import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseQuestionsFromRawText } from "@/lib/parsers/text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";
import {
  getServerGeminiApiKey,
  getCandidateGeminiModels,
} from "@/lib/gemini-server";

function normalizeAiQuestions(rawItems: any[]): ParsedQuestionDraft[] {
  if (!Array.isArray(rawItems)) return [];

  const normalized: ParsedQuestionDraft[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    if (!item || typeof item !== "object") continue;

    const rawContent = String(item.content || "").trim();
    if (!rawContent) continue;

    // Clean redundant leading "Câu 1:" if AI left it in
    const cleanedContent =
      rawContent
        .replace(/^(?:Câu(?:\s+hỏi)?|Question|Bài)\s*\d+\s*[\.\:\)\-\/]*\s*/i, "")
        .trim() || rawContent;

    const rawOptions = Array.isArray(item.options)
      ? item.options.map((o: any) => String(o || "").trim()).filter(Boolean)
      : [];

    const isMcq =
      item.type === "multiple_choice" ||
      (item.type !== "essay" && rawOptions.length >= 2);
    const type: "multiple_choice" | "essay" = isMcq ? "multiple_choice" : "essay";

    // Format options as ["A. ...", "B. ...", "C. ...", "D. ..."]
    const options: string[] = isMcq
      ? rawOptions.map((opt: string, idx: number) => {
          const letter = String.fromCharCode(65 + idx);
          if (/^[A-Z][\.\:\)]\s+/i.test(opt)) {
            return opt.replace(
              /^([A-Z])[\.\:\)]\s+/i,
              (_, l) => `${l.toUpperCase()}. `
            );
          }
          return `${letter}. ${opt}`;
        })
      : [];

    // Ensure at least 2 options if marked as multiple_choice
    if (type === "multiple_choice" && options.length < 2) {
      options.push("A. Lựa chọn A", "B. Lựa chọn B", "C. Lựa chọn C", "D. Lựa chọn D");
    }

    // Normalize correct_answer to letter A, B, C, D
    let correctAnswer = "";
    if (type === "multiple_choice") {
      const rawAns = String(item.correct_answer || "").trim();
      const directLetterMatch = rawAns.match(/^([A-D])(?:[\.\:\)\s]|$)/i);
      if (directLetterMatch) {
        correctAnswer = directLetterMatch[1].toUpperCase();
      } else if (rawAns) {
        const matchedIdx = options.findIndex((opt) =>
          opt.toLowerCase().includes(rawAns.toLowerCase())
        );
        if (matchedIdx !== -1) {
          correctAnswer = String.fromCharCode(65 + matchedIdx);
        }
      }
      if (!correctAnswer) {
        correctAnswer = "A";
      }
    }

    const parsedScore = Number(item.max_score);
    const maxScore =
      !isNaN(parsedScore) && parsedScore > 0
        ? Math.round(parsedScore * 100) / 100
        : type === "multiple_choice"
        ? 0.5
        : 2.0;

    normalized.push({
      id: `ai_draft_${Date.now()}_${i + 1}`,
      type,
      content: cleanedContent,
      options,
      correct_answer: correctAnswer,
      max_score: maxScore,
    });
  }

  return normalized;
}

// Cache working model in server memory to avoid repeated 404/429 round-trips
let cachedWorkingModel: string | null = null;

function compressExamText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  let rawText = "";

  try {
    const body = await request.json();
    rawText = compressExamText(String(body?.rawText || ""));

    if (!rawText) {
      return NextResponse.json(
        { error: "Nội dung văn bản đề thi đang trống." },
        { status: 400 }
      );
    }

    const apiKey = await getServerGeminiApiKey();

    // 1. If GEMINI_API_KEY is not configured, immediately use the traditional Regex fallback parser
    if (!apiKey) {
      const fallbackQuestions = parseQuestionsFromRawText(rawText);
      return NextResponse.json({
        questions: fallbackQuestions,
        mode: "fallback",
        reason:
          "Chưa cấu hình GEMINI_API_KEY, hệ thống tự động dùng bộ phân tích Regex dự phòng.",
      });
    }

    // 2. Smart Parsing with Google Gemini AI (Token-Optimized Prompt & Cached Model)
    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = getCandidateGeminiModels(cachedWorkingModel);

    // Compact, token-efficient instruction
    const prompt = `Phân tích đề thi sau thành mảng JSON: [{"type":"multiple_choice"|"essay","content":"nội dung câu hỏi (bỏ 'Câu X:')","options":["A. ...","B. ...","C. ...","D. ..."],"correct_answer":"A"|"B"|"C"|"D"|"","max_score":number}].
Quy tắc:
- Trắc nghiệm: chuẩn hóa options có tiền tố A./B./C./D., correct_answer chỉ gồm 1 chữ cái A-D (tự giải nếu đề chưa ghi đáp án), max_score mặc định 0.5.
- Tự luận: options=[], correct_answer="", max_score mặc định 2.0.
ĐỀ THI:
${rawText.slice(0, 35000)}`;

    let aiQuestions: ParsedQuestionDraft[] = [];
    let activeModelUsed = "";
    let lastError = "";

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

        const responseText = (response.text || "").trim();
        const cleanedJson = responseText
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        const parsedData = JSON.parse(cleanedJson);
        const rawArray = Array.isArray(parsedData)
          ? parsedData
          : Array.isArray(parsedData?.questions)
          ? parsedData.questions
          : [];

        const normalized = normalizeAiQuestions(rawArray);
        if (normalized.length > 0) {
          aiQuestions = normalized;
          activeModelUsed = modelName;
          cachedWorkingModel = modelName;
          break;
        }
      } catch (err: any) {
        lastError = err?.message || "Gemini model error";
        continue;
      }
    }

    if (aiQuestions.length > 0) {
      return NextResponse.json({
        questions: aiQuestions,
        mode: "ai",
        model: activeModelUsed,
      });
    }

    // 3. Fallback to traditional regex parser if AI returned empty or all models failed
    const fallbackQuestions = parseQuestionsFromRawText(rawText);
    return NextResponse.json({
      questions: fallbackQuestions,
      mode: "fallback",
      reason:
        lastError ||
        "AI không trả về dữ liệu hợp lệ, đã tự động chuyển sang bộ bóc tách Regex dự phòng.",
    });
  } catch (error: any) {
    console.error("Smart Exam Parser Error:", error);
    if (rawText) {
      const fallbackQuestions = parseQuestionsFromRawText(rawText);
      if (fallbackQuestions.length > 0) {
        return NextResponse.json({
          questions: fallbackQuestions,
          mode: "fallback",
          reason: "Hệ thống tự động sử dụng bộ phân tích dự phòng (Fallback Parser).",
        });
      }
    }

    return NextResponse.json(
      {
        error:
          "Không thể bóc tách nội dung đề thi: " +
          (error?.message || "Vui lòng kiểm tra lại định dạng văn bản."),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const apiKey = await getServerGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      model: null,
      message: "Chưa cấu hình GEMINI_API_KEY (Đang dùng chế độ Fallback Regex).",
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = getCandidateGeminiModels(cachedWorkingModel);

  for (const modelName of candidateModels) {
    try {
      const start = Date.now();
      const res = await ai.models.generateContent({
        model: modelName,
        contents: "OK",
        config: {
          maxOutputTokens: 5,
        },
      });
      const latencyMs = Date.now() - start;
      if (res.text) {
        cachedWorkingModel = modelName;
        return NextResponse.json({
          connected: true,
          model: modelName,
          latencyMs,
          reply: res.text.trim(),
          message: "Đã kết nối Google Gemini AI",
        });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    connected: false,
    model: null,
    message: "Không thể kết nối tới Gemini API (kiểm tra lại GEMINI_API_KEY hoặc hạn mức).",
  });
}
