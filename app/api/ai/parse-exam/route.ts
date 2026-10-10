import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { parseQuestionsFromRawText } from "@/lib/parsers/text-extractor";
import { ParsedQuestionDraft } from "@/types/exam";

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
        // Check if rawAns matches the text of one of the options
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

export async function POST(request: Request) {
  let rawText = "";

  try {
    const body = await request.json();
    rawText = String(body?.rawText || "").trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Nội dung văn bản đề thi đang trống." },
        { status: 400 }
      );
    }

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    // 1. If GEMINI_API_KEY is not configured, immediately use the traditional Regex fallback parser
    if (!apiKey) {
      const fallbackQuestions = parseQuestionsFromRawText(rawText);
      return NextResponse.json({
        questions: fallbackQuestions,
        mode: "fallback",
        reason: "Chưa cấu hình GEMINI_API_KEY trong .env.local, hệ thống tự động dùng bộ phân tích Regex dự phòng.",
      });
    }

    // 2. Smart Parsing with Google Gemini AI
    const ai = new GoogleGenAI({ apiKey });
    const configuredModel = (process.env.GEMINI_MODEL || "").trim();
    const candidateModels = Array.from(
      new Set(
        [configuredModel, "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"].filter(
          Boolean
        )
      )
    );

    const prompt = `Hãy phân tích đoạn văn bản đề thi dưới đây và trả về một mảng JSON chuẩn cấu trúc gồm các trường: \`type\` ('multiple_choice' | 'essay'), \`content\` (nội dung câu hỏi), \`options\` (danh sách các lựa chọn A, B, C, D nếu là trắc nghiệm), \`correct_answer\` (đáp án đúng nếu nhận diện được), và \`max_score\`.

Quy tắc chi tiết:
1. Nhận diện linh hoạt mọi định dạng đề thi (kể cả khi các lựa chọn trắc nghiệm nằm trên cùng 1 dòng, không có ký tự A. B. C. D. rõ ràng, hoặc câu hỏi tự luận trình bày tự do).
2. Với câu trắc nghiệm (\`type\`: "multiple_choice"):
   - \`content\`: Nội dung câu hỏi (đã lược bỏ tiền tố "Câu 1:", "Question 1:", v.v.).
   - \`options\`: Mảng các chuỗi lựa chọn được chuẩn hóa có tiền tố "A. ...", "B. ...", "C. ...", "D. ...".
   - \`correct_answer\`: Chữ cái đáp án đúng ("A", "B", "C", hoặc "D"). Nếu trong văn bản có đánh dấu đáp án đúng (như "Đáp án: B", dấu *, gạch chân, chữ Đúng) thì lấy chính xác; nếu đề không ghi sẵn đáp án đúng, hãy tự suy luận đáp án đúng dựa trên kiến thức chuyên môn của bạn!
   - \`max_score\`: Điểm số của câu hỏi nếu đề bài có ghi (ví dụ "(0.5 điểm)"), nếu không ghi thì mặc định là 0.5.
3. Với câu tự luận (\`type\`: "essay"):
   - \`content\`: Nội dung câu hỏi tự luận đầy đủ.
   - \`options\`: [] (mảng rỗng).
   - \`correct_answer\`: "" (chuỗi rỗng).
   - \`max_score\`: Điểm số của câu tự luận nếu đề bài có ghi (ví dụ "(2 điểm)"), nếu không ghi thì mặc định là 2.0.
4. Chỉ trả về DUY NHẤT một mảng JSON hợp lệ (ví dụ: [ { "type": "multiple_choice", ... } ]), không kèm giải thích ngoài JSON.

NỘI DUNG ĐỀ THI CẦN BÓC TÁCH:
"""
${rawText.slice(0, 45000)}
"""`;

    let aiQuestions: ParsedQuestionDraft[] = [];
    let lastError = "";

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
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
    // Even on unexpected exception, try fallback parser if rawText is available
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
