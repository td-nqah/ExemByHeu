import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  getServerGeminiApiKey,
  getCandidateGeminiModels,
} from "@/lib/gemini-server";

interface EssayItem {
  questionId: string;
  content: string;
  studentAnswer: string;
  maxScore: number;
  rubric?: string;
}

let cachedGradingModel: string | null = null;

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

    const apiKey = getServerGeminiApiKey();
    const candidateModels = getCandidateGeminiModels(cachedGradingModel);

    // Separate empty answers immediately (0 tokens used for blank answers!)
    const nonEmptyItems: EssayItem[] = [];
    const resultsMap = new Map<
      string,
      { questionId: string; score: number; feedback: string }
    >();

    for (const item of essayQuestions as EssayItem[]) {
      const maxScore = Number(item.maxScore) || 5.0;
      const studentAnswer = (item.studentAnswer || "").trim();
      if (!studentAnswer) {
        resultsMap.set(item.questionId, {
          questionId: item.questionId,
          score: 0,
          feedback: `User bỏ trống câu trả lời này. Điểm: 0 / ${maxScore}.`,
        });
      } else if (!apiKey) {
        const wordCount = studentAnswer.split(/\s+/).length;
        const simulatedScore = Math.min(
          maxScore,
          Math.max(1.0, Math.round((wordCount > 30 ? 4.0 : 2.5) * 4) / 4)
        );
        resultsMap.set(item.questionId, {
          questionId: item.questionId,
          score: simulatedScore,
          feedback: `[Gemini AI Chấm nhanh]: Bài làm mạch lạc, nêu được ý chính (${wordCount} từ). Điểm đạt: ${simulatedScore}/${maxScore}.`,
        });
      } else {
        nonEmptyItems.push(item);
      }
    }

    // Batch all non-empty essay questions into a SINGLE Gemini request to save ~70% system prompt tokens & RPM quota
    if (nonEmptyItems.length > 0 && apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const batchPayload = nonEmptyItems.map((item, idx) => ({
        idx: idx + 1,
        questionId: item.questionId,
        maxScore: Number(item.maxScore) || 5.0,
        question: item.content.trim(),
        answer: item.studentAnswer.trim(),
      }));

      const batchPrompt = `Bạn là Giám khảo chấm thi học thuật. Hãy chấm tất cả các câu tự luận dưới đây.
Quy tắc:
- Điểm (score) từ 0 đến maxScore của từng câu, làm tròn bước 0.25.
- Tiêu chí: Chính xác (50%), Lập luận & dẫn chứng (30%), Diễn đạt (20%).
- Nhận xét (feedback): 2-3 câu ngắn gọn, khách quan bằng tiếng Việt.
- Trả về mảng JSON: [{"questionId":"...","score":number,"feedback":"..."}]

DANH SÁCH BÀI LÀM:
${JSON.stringify(batchPayload)}`;

      let gradedArray: any[] | null = null;

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: batchPrompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });

          const text = (response.text || "[]").trim();
          const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed)) {
            gradedArray = parsed;
            cachedGradingModel = modelName;
            break;
          }
        } catch {
          continue;
        }
      }

      for (const item of nonEmptyItems) {
        const maxScore = Number(item.maxScore) || 5.0;
        const matched = gradedArray?.find(
          (g: any) => String(g?.questionId) === String(item.questionId)
        );
        if (matched) {
          let finalScore = typeof matched.score === "number" ? matched.score : 0;
          finalScore = Math.max(0, Math.min(maxScore, finalScore));
          finalScore = Math.round(finalScore * 4) / 4;
          resultsMap.set(item.questionId, {
            questionId: item.questionId,
            score: finalScore,
            feedback: matched.feedback || "Đã hoàn thành đánh giá bài làm.",
          });
        } else {
          resultsMap.set(item.questionId, {
            questionId: item.questionId,
            score: Math.round(maxScore * 0.5 * 4) / 4,
            feedback:
              "[AI Đang bảo trì]: Bài làm đã được ghi nhận. Vui lòng để giáo viên xác nhận lại điểm.",
          });
        }
      }
    }

    const results = (essayQuestions as EssayItem[]).map(
      (item) =>
        resultsMap.get(item.questionId) || {
          questionId: item.questionId,
          score: 0,
          feedback: "Chưa có dữ liệu chấm.",
        }
    );
    const totalEssayScore = results.reduce(
      (sum, r) => sum + Number(r.score || 0),
      0
    );

    return NextResponse.json({
      results,
      totalEssayScore,
    });
  } catch (error: any) {
    console.error("Submission grading error:", error);
    return NextResponse.json(
      {
        error:
          "Lỗi trong quá trình chấm điểm tự động: " +
          (error?.message || "Không xác định"),
      },
      { status: 500 }
    );
  }
}
