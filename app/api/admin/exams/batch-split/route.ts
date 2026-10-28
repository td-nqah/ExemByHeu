import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { parseQuestionsFromRawText } from "@/lib/parsers/text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";

export const maxDuration = 60;

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
  // Matches "ĐỀ SỐ 1", "ĐỀ 1", "ĐỀ THI SỐ 02", "ĐỀ 01:", "ĐỀ ÔN TẬP SỐ 1", "MÃ ĐỀ: 101", "BỘ ĐỀ SỐ 1", "EXAM 1"
  const EXAM_HEADER_REGEX =
    /(?:^|\n)(?=\s*(?:[-*#_\[(]*\s*)?(?:ĐỀ|BỘ\s*ĐỀ|MÃ\s*ĐỀ|EXAM|TEST)(?:[^\n\d]{0,40})\d+)/i;

  let rawChunks = normalized
    .split(EXAM_HEADER_REGEX)
    .map((c) => c.trim())
    .filter(Boolean);

  // If the first chunk is a cover page / title banner without exam header or questions, drop it
  if (rawChunks.length > 1) {
    const isFirstHeader = /^(?:[-*#_\[(]*\s*)?(?:ĐỀ|BỘ\s*ĐỀ|MÃ\s*ĐỀ|EXAM|TEST)(?:[^\n\d]{0,40})\d+/i.test(
      rawChunks[0]
    );
    const hasQ1 = /(?:Câu(?:\s+hỏi)?|Question|Bài)\s*1\s*[\.\:\)\-\/]/i.test(rawChunks[0]);
    if (!isFirstHeader && !hasQ1) {
      rawChunks = rawChunks.slice(1);
    }
  }

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
      if (/^(?:[-*#_\[(]*\s*)?(?:ĐỀ|BỘ\s+ĐỀ|MÃ\s+ĐỀ|EXAM|TEST)/i.test(firstLine)) {
        detectedTitle = firstLine
          .replace(/[\:\.\-]+$/, "")
          .replace(/^[-*#_\[(]+\s*/, "")
          .replace(/\s*[-*#_\])]+$/, "")
          .trim();
        if (
          lines.length > 1 &&
          lines[1].length < 80 &&
          !/^(?:Câu|Question|\d+[\.\)])/i.test(lines[1])
        ) {
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const defaultDuration = Number(formData.get("defaultDuration")) || 45;

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

    // 1. Extract raw text from docx via mammoth (Buffer required in Node.js)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mammothResult = await mammoth.extractRawText({ buffer, arrayBuffer } as any);
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

    // 3. High-Speed Deterministic Parsing across all chunks
    // Parses all questions, choices, answers, and scores in ~0.2s without serverless timeout
    const parsedExams = chunks.map((chunk, idx) => {
      const tempId = `batch_exam_${Date.now()}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`;
      const rawQuestions = parseQuestionsFromRawText(chunk.text);
      let missingCount = 0;

      const questions: ParsedQuestionDraft[] = rawQuestions.map((q, qIdx) => {
        const cleaned = cleanQuestionContent(q.content);
        const options = normalizeOptions(q.options || []);
        const isMissing = q.type === "multiple_choice" && !q.correct_answer;
        if (isMissing) missingCount++;

        return {
          id: `q_draft_${tempId}_${qIdx + 1}`,
          type: q.type,
          content: cleaned || `Câu hỏi số ${qIdx + 1}`,
          options,
          correct_answer: q.correct_answer ? q.correct_answer.toUpperCase() : "A",
          max_score: q.max_score > 0 ? q.max_score : q.type === "multiple_choice" ? 0.5 : 2.0,
        };
      });

      return {
        tempId,
        title: chunk.title || `Đề số ${idx + 1}`,
        durationMinutes: defaultDuration,
        questionCount: questions.length,
        hasIssues: missingCount > 0,
        issuesCount: missingCount,
        questions,
      };
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
    console.error("Batch Exam Split Error:", error);
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
