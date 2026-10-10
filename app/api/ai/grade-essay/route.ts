import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      questionContent,
      studentAnswer,
      maxScore = 5.0,
      rubric = "",
    } = body;

    if (!questionContent) {
      return NextResponse.json(
        { error: "Thiếu nội dung câu hỏi tự luận." },
        { status: 400 }
      );
    }

    if (!studentAnswer || !studentAnswer.trim()) {
      return NextResponse.json({
        score: 0,
        feedback: "Thí sinh không làm bài hoặc bỏ trống câu trả lời này. Điểm số: 0 / " + maxScore + ".",
        breakdown: {
          accuracy: 0,
          depth: 0,
          expression: 0,
        },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    // Fallback if GEMINI_API_KEY is not configured yet
    if (!apiKey) {
      const wordCount = studentAnswer.trim().split(/\s+/).length;
      const simulatedScore = Math.min(
        maxScore,
        Math.max(1.0, Math.round((wordCount > 30 ? 4.0 : 2.5) * 4) / 4)
      );

      return NextResponse.json({
        score: simulatedScore,
        feedback: `[Mô phỏng AI]: Bài làm trình bày được các luận điểm cơ bản (${wordCount} từ). Để kích hoạt chấm thực tế bằng Gemini Pro, vui lòng cấu hình GEMINI_API_KEY trong tệp .env.local.`,
        isMock: true,
        breakdown: {
          accuracy: simulatedScore * 0.5,
          depth: simulatedScore * 0.3,
          expression: simulatedScore * 0.2,
        },
      });
    }

    // Call Gemini Pro API
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Bạn là một Giám khảo Học thuật chuyên nghiệp, công tâm và có kiến thức sâu rộng.
Nhiệm vụ của bạn là chấm điểm bài thi tự luận của thí sinh trên thang điểm tối đa là ${maxScore} (thang điểm 5 chuẩn).

Quy tắc chấm điểm:
1. Thang điểm: từ 0.0 đến ${maxScore}, bước nhảy làm tròn 0.25 (ví dụ: 3.25, 3.5, 4.0, 4.75, 5.0).
2. Tiêu chí đánh giá:
   - Tính chính xác và bám sát câu hỏi (50% trọng số).
   - Độ sâu kiến thức, lập luận logic và ví dụ minh họa (30% trọng số).
   - Khả năng diễn đạt, hành văn mạch lạc, thuật ngữ chuẩn mực (20% trọng số).
3. Đưa ra nhận xét khách quan: chỉ ra điểm sáng, thiếu sót cần bổ sung, và giải thích vì sao cho mức điểm đó.
4. Trả về định dạng JSON thuần túy, không có markdown backticks xung quanh.`;

    const userPrompt = `
ĐỀ BÀI CÂU HỎI TỰ LUẬN:
"""
${questionContent}
"""

${rubric ? `HƯỚNG DẪN CHẤM / ĐÁP ÁN MẪU:\n"""\n${rubric}\n"""\n` : ""}

BÀI LÀM CỦA THÍ SINH:
"""
${studentAnswer}
"""

THANG ĐIỂM TỐI ĐA: ${maxScore}

Hãy trả về duy nhất một đối tượng JSON có cấu trúc sau:
{
  "score": <số điểm chấm được, kiểu float từ 0 đến ${maxScore}>,
  "feedback": "<lời nhận xét chi tiết và công tâm bằng tiếng Việt>",
  "breakdown": {
    "accuracy": <điểm độ chính xác>,
    "depth": <điểm độ sâu luận điểm>,
    "expression": <điểm hành văn diễn đạt>
  }
}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "{}";
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);

    // Ensure score is valid and bounded
    let finalScore = typeof resultJson.score === "number" ? resultJson.score : 0;
    finalScore = Math.max(0, Math.min(Number(maxScore), finalScore));
    finalScore = Math.round(finalScore * 4) / 4; // Round to nearest 0.25

    return NextResponse.json({
      score: finalScore,
      feedback: resultJson.feedback || "Đã hoàn thành đánh giá bài làm tự luận.",
      breakdown: resultJson.breakdown || null,
      isMock: false,
    });
  } catch (error: any) {
    console.error("Gemini Grading Error:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối Gemini API: " + (error?.message || "Không xác định") },
      { status: 500 }
    );
  }
}
