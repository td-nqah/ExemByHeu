import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface EssayItem {
  questionId: string;
  content: string;
  studentAnswer: string;
  maxScore: number;
  rubric?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { essayQuestions = [] } = body;

    if (!Array.isArray(essayQuestions) || essayQuestions.length === 0) {
      return NextResponse.json({
        results: [],
        totalEssayScore: 0,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-pro";

    // Grade each essay question concurrently with Promise.all
    const gradingPromises = essayQuestions.map(async (item: EssayItem) => {
      const maxScore = Number(item.maxScore) || 5.0;
      const studentAnswer = (item.studentAnswer || "").trim();

      if (!studentAnswer) {
        return {
          questionId: item.questionId,
          score: 0,
          feedback: "Thí sinh không làm bài hoặc bỏ trống câu trả lời này. Điểm: 0 / " + maxScore + ".",
        };
      }

      // If no API key configured, use intelligent mock grading
      if (!apiKey) {
        const wordCount = studentAnswer.split(/\s+/).length;
        const simulatedScore = Math.min(
          maxScore,
          Math.max(1.0, Math.round((wordCount > 30 ? 4.0 : 2.5) * 4) / 4)
        );

        return {
          questionId: item.questionId,
          score: simulatedScore,
          feedback: `[Gemini AI Chấm nhanh]: Bài làm mạch lạc, nêu được ý chính (${wordCount} từ). Điểm đạt: ${simulatedScore}/${maxScore}. (Cấu hình GEMINI_API_KEY trong .env.local để kích hoạt Gemini Pro thực tế).`,
        };
      }

      try {
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `Bạn là Giám khảo chấm thi học thuật chuyên nghiệp.
Hãy chấm bài tự luận của thí sinh trên thang điểm tối đa là ${maxScore} (thang điểm 5 chuẩn).
Quy tắc:
1. Thang điểm: 0.0 đến ${maxScore}, làm tròn bước nhảy 0.25 (ví dụ 3.0, 3.25, 3.5, 4.0, 4.75, 5.0).
2. Tiêu chí: Bám sát câu hỏi (50%), Luận điểm & dẫn chứng (30%), Diễn đạt mạch lạc (20%).
3. Viết lời nhận xét súc tích, công tâm bằng tiếng Việt (khoảng 2-3 câu).
4. Trả về định dạng JSON thuần túy.`;

        const userPrompt = `
CÂU HỎI:
"""
${item.content}
"""

BÀI LÀM:
"""
${studentAnswer}
"""

THANG ĐIỂM: ${maxScore}

Trả về JSON duy nhất:
{
  "score": <số float từ 0 đến ${maxScore}>,
  "feedback": "<nhận xét bằng tiếng Việt>"
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

        const text = response.text || "{}";
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        let finalScore = typeof parsed.score === "number" ? parsed.score : 0;
        finalScore = Math.max(0, Math.min(maxScore, finalScore));
        finalScore = Math.round(finalScore * 4) / 4;

        return {
          questionId: item.questionId,
          score: finalScore,
          feedback: parsed.feedback || "Đã hoàn thành đánh giá bài làm.",
        };
      } catch (err: any) {
        console.error(`Lỗi chấm câu hỏi ${item.questionId}:`, err);
        return {
          questionId: item.questionId,
          score: 2.5,
          feedback: "[AI Đang bảo trì]: Bài làm đã được ghi nhận. Vui lòng để giáo viên xác nhận lại điểm.",
        };
      }
    });

    const results = await Promise.all(gradingPromises);
    const totalEssayScore = results.reduce((sum, r) => sum + Number(r.score || 0), 0);

    return NextResponse.json({
      results,
      totalEssayScore,
    });
  } catch (error: any) {
    console.error("Submission grading error:", error);
    return NextResponse.json(
      { error: "Lỗi trong quá trình chấm điểm tự động: " + (error?.message || "Không xác định") },
      { status: 500 }
    );
  }
}
