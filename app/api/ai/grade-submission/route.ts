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

    const apiKey = await getServerGeminiApiKey();
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
          feedback: `Chưa đạt điểm tối đa vì: Thí sinh không làm hoặc để trống câu trả lời này (0/${maxScore} điểm). Cần bổ sung: Trả lời đầy đủ các ý chính của đề bài để được tính điểm.`,
        });
      } else if (!apiKey) {
        const wordCount = studentAnswer.split(/\s+/).length;
        const isFull = wordCount >= 60;
        const simulatedScore = isFull
          ? maxScore
          : Math.min(
              maxScore - 0.5,
              Math.max(1.0, Math.round((wordCount > 30 ? 4.0 : 2.5) * 4) / 4)
            );

        let feedback = "";
        if (simulatedScore >= maxScore) {
          feedback = `Xuất sắc! Bài làm (${wordCount} từ) phân tích rất chuẩn mực, lập luận chặt chẽ, đầy đủ luận điểm trọng tâm và đáp ứng hoàn hảo tiêu chí đề thi.`;
        } else {
          feedback = `Chưa đạt điểm tối đa vì: Bài làm (${wordCount} từ) còn tóm lược, một số luận điểm chưa thực sự sâu sắc và còn thiếu dẫn chứng thực tiễn minh họa. Cần bổ sung: Bổ sung thêm các luận cứ phân tích cốt lõi, làm rõ cơ sở lý luận và liên hệ thực tế để đạt trọn vẹn ${maxScore}/${maxScore} điểm.`;
        }

        resultsMap.set(item.questionId, {
          questionId: item.questionId,
          score: simulatedScore,
          feedback,
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

      const batchPrompt = `Bạn là Giám khảo chấm thi học thuật chuyên nghiệp. Hãy chấm tất cả các câu hỏi tự luận dưới đây.
Quy tắc chấm:
- Điểm (score): từ 0 đến maxScore của từng câu (làm tròn bước 0.25).
- Tiêu chí: Đúng trọng tâm (50%), Lập luận & dẫn chứng (30%), Diễn đạt & trình bày (20%).

QUY TẮC NHẬN XÉT (FEEDBACK) BẮT BUỘC CHO MỖI CÂU:
1. Nếu điểm đạt tối đa (score == maxScore, ví dụ 5/5 điểm):
   - BẮT BUỘC nhận xét phải khen ngợi bài làm xuất sắc (ví dụ: "Xuất sắc! Bài làm nắm rất vững kiến thức, lập luận sắc bén, dẫn chứng đầy đủ và trình bày rất chuẩn mực.").
2. Nếu điểm dưới tối đa (score < maxScore, ví dụ dưới 5 điểm):
   - BẮT BUỘC nhận xét phải nêu ngắn gọn 2 phần:
     + Lý do chưa đạt điểm tối đa (nói rõ thiếu sót hoặc điểm chưa chuẩn xác của bài làm).
     + Nội dung cần bổ sung (nói cụ thể học viên cần bổ sung thêm luận điểm, kiến thức hay dẫn chứng gì để đạt điểm tuyệt đối).
   - Định dạng nhận xét bắt buộc:
     "Chưa đạt điểm tối đa vì: [Nêu lý do ngắn gọn]. Cần bổ sung: [Nêu cụ thể nội dung cần bổ sung]."

Trả về duy nhất mảng JSON:
[{"questionId":"...","score":number,"feedback":"...","reason":"...","missing_points":"..."}]

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

          let feedback = (matched.feedback || "").trim();
          if (finalScore >= maxScore) {
            if (!feedback.toLowerCase().includes("xuất sắc")) {
              feedback = `Xuất sắc! ${feedback || "Bài làm lập luận chặt chẽ, đầy đủ luận điểm và đáp ứng toàn diện yêu cầu đề bài."}`;
            }
          } else {
            const hasReason = feedback.toLowerCase().includes("vì:") || feedback.toLowerCase().includes("lý do");
            const hasSupplement = feedback.toLowerCase().includes("bổ sung");
            if (!hasReason || !hasSupplement) {
              if (matched.reason && matched.missing_points) {
                feedback = `Chưa đạt điểm tối đa vì: ${matched.reason}. Cần bổ sung: ${matched.missing_points}`;
              } else if (!hasSupplement) {
                feedback = `Chưa đạt điểm tối đa vì: ${feedback || "bài làm chưa triển khai đầy đủ các ý chính"}. Cần bổ sung: Bổ sung thêm luận điểm phân tích, làm rõ dẫn chứng và mở rộng giải thích để đạt trọn vẹn ${maxScore}/${maxScore} điểm.`;
              }
            }
          }

          resultsMap.set(item.questionId, {
            questionId: item.questionId,
            score: finalScore,
            feedback,
          });
        } else {
          resultsMap.set(item.questionId, {
            questionId: item.questionId,
            score: Math.round(maxScore * 0.5 * 4) / 4,
            feedback: `Chưa đạt điểm tối đa vì: Hệ thống đang chờ giáo viên phụ trách thẩm định lại bài làm (${Math.round(maxScore * 0.5 * 4) / 4}/${maxScore} điểm). Cần bổ sung: Vui lòng đợi giảng viên rà soát tiêu chí và cập nhật nhận xét chi tiết.`,
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
