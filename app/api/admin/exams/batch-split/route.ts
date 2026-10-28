import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import mammoth from "mammoth";
import { parseQuestionsFromRawText } from "@/lib/parsers/text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";
import {
  getServerGeminiApiKey,
  getCandidateGeminiModels,
} from "@/lib/gemini-server";

// Concurrency pool helper: runs tasks with a maximum number of concurrent promises
async function runConcurrent<T, R>(
  items: T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      try {
        results[index] = await task(items[index], index);
      } catch (err: any) {
        console.error(`Error processing item ${index + 1}:`, err);
        throw err;
      }
    }
  });

  await Promise.all(workers);
  return results;
}

// Strip leading "Câu 1:", "Question 1.", "1.", etc.
function cleanQuestionContent(raw: string): string {
  return raw
    .replace(/^(?:Câu(?:\s+hỏi)?|Question|Bài)\s*\d+\s*[\.\:\)\-\/]*\s*/i, "")
    .replace(/^\d+\s*[\.\)\/]\s*/i, "")
    .trim();
}

// Normalize options to clean "A. ...", "B. ...", "C. ...", "D. ..."
function normalizeOptions(rawOptions: any[]): string[] {
  if (!Array.isArray(rawOptions)) return [];
  return rawOptions
    .map((opt: any, idx: number) => {
      const str = String(opt || "").trim();
      if (!str) return "";
      const letter = String.fromCharCode(65 + idx);
      if (/^[A-D][\.\:\)]\s*/i.test(str)) {
        return str.replace(/^([A-D])[\.\:\)]\s*/i, (_, l) => `${l.toUpperCase()}. `);
      }
      return `${letter}. ${str}`;
    })
    .filter(Boolean);
}

// Split entire text into discrete exam chunks
function splitTextIntoExamChunks(rawText: string): { title: string; text: string }[] {
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();

  if (!normalized) return [];

  // Primary Regex matching exam headers:
  // e.g. "ĐỀ SỐ 1", "ĐỀ THI SỐ 02", "ĐỀ 1:", "ĐỀ 01.", "MÃ ĐỀ: 101", "BỘ ĐỀ SỐ 1", "EXAM 1"
  const EXAM_HEADER_REGEX =
    /(?:^|\n)(?=\s*(?:ĐỀ|BỘ\s*ĐỀ|MÃ\s*ĐỀ|EXAM)\s*(?:THI|SỐ|KIỂM\s*TRA)?\s*[:\.\s\-]?\s*\d+)/i;

  let rawChunks = normalized
    .split(EXAM_HEADER_REGEX)
    .map((c) => c.trim())
    .filter(Boolean);

  // Fallback 1: If regex yielded only 1 chunk but multiple "Câu 1" resets are detected, split by "Câu 1" resets
  if (rawChunks.length <= 1) {
    const câu1Regex = /(?:^|\n)(?=(?:Câu(?:\s+hỏi)?|Question|Bài)\s*1\s*[\.\:\)\-\/])/i;
    const câu1Splits = normalized.split(câu1Regex).map((c) => c.trim()).filter(Boolean);
    if (câu1Splits.length > 1) {
      rawChunks = câu1Splits;
    }
  }

  // Fallback 2: If still only 1 chunk, treat as a single exam
  if (rawChunks.length === 0) {
    rawChunks = [normalized];
  }

  // Format into { title, text } chunks
  return rawChunks.map((chunk, index) => {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let detectedTitle = `Đề số ${index + 1}`;

    if (lines.length > 0) {
      const firstLine = lines[0];
      if (/^(?:ĐỀ|BỘ\s+ĐỀ|MÃ\s+ĐỀ|EXAM|TEST)/i.test(firstLine)) {
        detectedTitle = firstLine.replace(/[\:\.\-]+$/, "").trim();
        if (lines.length > 1 && lines[1].length < 80 && !/^(?:Câu|Question|\d+[\.\)])/i.test(lines[1])) {
          detectedTitle += ` - ${lines[1].trim()}`;
        }
      }
    }

    return {
      title: detectedTitle,
      text: chunk,
    };
  });
}

let cachedBatchModel: string | null = null;

// Parse a single exam chunk using Gemini 2.5 Flash / Flash candidate models
async function parseExamChunkWithAI(
  chunk: { title: string; text: string },
  index: number,
  apiKey: string | null,
  candidateModels: string[]
): Promise<{
  tempId: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  hasIssues: boolean;
  issuesCount: number;
  questions: ParsedQuestionDraft[];
}> {
  const tempId = `batch_exam_${Date.now()}_${index + 1}`;

  // If no API key or offline, use regex-based deterministic extractor
  if (!apiKey) {
    const questions = parseQuestionsFromRawText(chunk.text);
    let missingCount = 0;
    const sanitized = questions.map((q, qIdx) => {
      const cleaned = cleanQuestionContent(q.content);
      const isMissing = q.type === "multiple_choice" && !q.correct_answer;
      if (isMissing) missingCount++;
      return {
        ...q,
        id: `q_draft_${tempId}_${qIdx + 1}`,
        content: cleaned,
      };
    });

    return {
      tempId,
      title: chunk.title || `Đề số ${index + 1}`,
      durationMinutes: 45,
      questionCount: sanitized.length,
      hasIssues: missingCount > 0,
      issuesCount: missingCount,
      questions: sanitized,
    };
  }

  // Structured Gemini prompt
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Bạn là Chuyên gia Khảo thí Học thuật. Hãy bóc tách đề thi sau thành cấu trúc JSON chuẩn xác.
Yêu cầu:
1. examTitle: Tiêu đề đề thi (ví dụ: "${chunk.title}").
2. estimatedDuration: Thời gian làm bài tính bằng phút (mặc định 45).
3. questions: Danh sách toàn bộ các câu hỏi trong đề:
   - content: Nội dung câu hỏi (BẮT BUỘC bỏ các tiền tố như "Câu 1:", "Câu hỏi 1.", "1.", "Question 1:").
   - type: "multiple_choice" nếu có các phương án lựa chọn, hoặc "essay" nếu là câu tự luận/bài tập lớn.
   - options: Mảng các lựa chọn ["A. ...", "B. ...", "C. ...", "D. ..."]. Nếu là tự luận thì để [].
   - correctAnswer: Chữ cái đáp án đúng ("A", "B", "C", hoặc "D"). Nếu đề có sẵn đáp án thì lấy đúng; nếu đề không ghi sẵn thì dựa vào kiến thức học thuật để chọn đáp án đúng nhất. Tự luận để "".
   - explanation: Lời giải thích ngắn gọn tại sao chọn đáp án đó (nếu có).
   - maxScore: Điểm câu hỏi (mặc định trắc nghiệm là 0.5; tự luận là 2.0).

ĐỀ THI NỘI DUNG:
${chunk.text}`;

  let resultJson: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      resultJson = JSON.parse(cleanedText);
      cachedBatchModel = modelName;
      break;
    } catch {
      continue;
    }
  }

  // If AI parsing failed or returned empty questions, fallback to regex parser
  if (!resultJson || !Array.isArray(resultJson.questions) || resultJson.questions.length === 0) {
    const regexQuestions = parseQuestionsFromRawText(chunk.text);
    let missingCount = 0;
    const sanitized = regexQuestions.map((q, qIdx) => {
      const isMissing = q.type === "multiple_choice" && !q.correct_answer;
      if (isMissing) missingCount++;
      return {
        ...q,
        id: `q_draft_${tempId}_${qIdx + 1}`,
        content: cleanQuestionContent(q.content),
      };
    });

    return {
      tempId,
      title: resultJson?.examTitle || chunk.title || `Đề số ${index + 1}`,
      durationMinutes: Number(resultJson?.estimatedDuration) || 45,
      questionCount: sanitized.length,
      hasIssues: missingCount > 0,
      issuesCount: missingCount,
      questions: sanitized,
    };
  }

  // Sanitize AI questions
  let missingCount = 0;
  const questions: ParsedQuestionDraft[] = resultJson.questions.map((q: any, qIdx: number) => {
    const rawContent = String(q.content || "").trim();
    const content = cleanQuestionContent(rawContent);

    const isEssay = q.type === "essay" || (!q.options || q.options.length === 0);
    const type: "multiple_choice" | "essay" = isEssay ? "essay" : "multiple_choice";

    let options: string[] = [];
    let correctAnswer = "";

    if (type === "multiple_choice") {
      options = normalizeOptions(q.options || []);
      const rawAns = String(q.correctAnswer || q.correct_answer || "").trim().toUpperCase();
      const match = rawAns.match(/^([A-D])/);
      if (match) {
        correctAnswer = match[1];
      } else if (options.length >= 2) {
        // Find if answer matches any option text
        const found = options.findIndex((o) => o.toLowerCase().includes(rawAns.toLowerCase()));
        correctAnswer = found !== -1 ? String.fromCharCode(65 + found) : "A";
      } else {
        correctAnswer = "A";
      }

      if (!correctAnswer) {
        missingCount++;
      }
    }

    const maxScore = Number(q.maxScore) > 0 ? Number(q.maxScore) : type === "multiple_choice" ? 0.5 : 2.0;

    return {
      id: `q_draft_${tempId}_${qIdx + 1}`,
      type,
      content: content || `Câu hỏi số ${qIdx + 1}`,
      options,
      correct_answer: correctAnswer,
      max_score: maxScore,
    };
  });

  return {
    tempId,
    title: String(resultJson.examTitle || chunk.title || `Đề số ${index + 1}`).trim(),
    durationMinutes: Number(resultJson.estimatedDuration) || 45,
    questionCount: questions.length,
    hasIssues: missingCount > 0,
    issuesCount: missingCount,
    questions,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Vui lòng chọn tệp Word (.docx) để phân tích." },
        { status: 400 }
      );
    }

    const fileName = file.name || "exams.docx";
    if (!fileName.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { error: "Hệ thống chỉ hỗ trợ định dạng tệp Microsoft Word (.docx)." },
        { status: 400 }
      );
    }

    // 1. Extract raw text from docx via mammoth
    const arrayBuffer = await file.arrayBuffer();
    const mammothResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = (mammothResult.value || "").trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Tệp Word không chứa nội dung văn bản hợp lệ hoặc tệp rỗng." },
        { status: 400 }
      );
    }

    // 2. Split into individual exam chunks
    const chunks = splitTextIntoExamChunks(rawText);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy cấu trúc đề thi nào trong tệp Word này." },
        { status: 400 }
      );
    }

    // 3. Resolve Gemini model & API key
    const apiKey = await getServerGeminiApiKey();
    const candidateModels = getCandidateGeminiModels(cachedBatchModel);

    // 4. Concurrent LLM structured parsing (Pool size: 4 concurrent requests)
    const parsedExams = await runConcurrent(chunks, 4, async (chunk, idx) => {
      return await parseExamChunkWithAI(chunk, idx, apiKey, candidateModels);
    });

    const totalQuestions = parsedExams.reduce((sum, e) => sum + e.questionCount, 0);

    return NextResponse.json({
      success: true,
      fileName,
      totalExams: parsedExams.length,
      totalQuestions,
      exams: parsedExams,
    });
  } catch (error: any) {
    console.error("Batch Exam Split & Parse Error:", error);
    return NextResponse.json(
      {
        error:
          "Lỗi trong quá trình tách và phân tích tệp nhiều đề thi: " +
          (error?.message || "Không xác định"),
      },
      { status: 500 }
    );
  }
}
