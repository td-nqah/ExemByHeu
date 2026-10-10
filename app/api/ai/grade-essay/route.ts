import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  getServerGeminiApiKey,
  getCandidateGeminiModels,
} from "@/lib/gemini-server";

let cachedEssayModel: string | null = null;

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

    const apiKey = getServerGeminiApiKey();
    const candidateModels = getCandidateGeminiModels(cachedEssayModel);

    // Fallback if GEMINI_API_KEY is not configured yet
    if (!apiKey) {
      const wordCount = studentAnswer.trim().split(/\s+/).length;
      const simulatedScore = Math.min(
        maxScore,
        Math.max(1.0, Math.round((wordCount > 30 ? 4.0 : 2.5) * 4) / 4)
      );

      return NextResponse.json({
        score: simulatedScore,
        feedback: `[Mô phỏng AI]: Bài làm trình bày được các luận điểm cơ bản (${wordCount} từ). Để kích hoạt chấm thực tế bằng Gemini AI, vui lòng cấu hình GEMINI_API_KEY trong tệp .env.local.`,
        isMock: true,
        breakdown: {
          accuracy: simulatedScore * 0.5,
          depth: simulatedScore * 0.3,
          expression: simulatedScore * 0.2,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const compactPrompt = `Chấm câu tự luận trên thang điểm ${maxScore} (làm tròn bước 0.25).
Tiêu chí: Chính xác (50%), Lập luận & dẫn chứng (30%), Diễn đạt (20%).
ĐỀ BÀI: ${String(questionContent).trim()}
${rubric ? `ĐÁP ÁN MẪU: ${String(rubric).trim()}\n` : ""}BÀI LÀM: ${String(studentAnswer).trim()}
Trả về JSON: {"score":number,"feedback":"nhận xét khách quan bằng tiếng Việt","breakdown":{"accuracy":number,"depth":number,"expression":number}}`;

    let resultJson: any = null;
    let lastErr: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: compactPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const responseText = response.text || "{}";
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        resultJson = JSON.parse(cleanedText);
        cachedEssayModel = modelName;
        break;
      } catch (e: any) {
        lastErr = e;
        continue;
      }
    }

    if (!resultJson) {
      throw lastErr || new Error("Không thể gọi model Gemini AI.");
    }

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
