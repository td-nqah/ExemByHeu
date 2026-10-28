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
        feedback: `Chưa đạt điểm tối đa vì: Học viên bỏ trống không làm câu trả lời này (0/${maxScore} điểm). Cần bổ sung: Trả lời hoàn chỉnh các yêu cầu của đề bài.`,
        reason: "Học viên bỏ trống câu trả lời.",
        missing_points: "Cần trả lời toàn bộ nội dung câu hỏi đề ra.",
        breakdown: {
          accuracy: 0,
          depth: 0,
          expression: 0,
        },
      });
    }

    const apiKey = await getServerGeminiApiKey();
    const candidateModels = getCandidateGeminiModels(cachedEssayModel);

    // Fallback if GEMINI_API_KEY is not configured yet
    if (!apiKey) {
      const wordCount = studentAnswer.trim().split(/\s+/).length;
      const isFull = wordCount >= 60;
      const simulatedScore = isFull
        ? Number(maxScore)
        : Math.min(
            Number(maxScore) - 0.5,
            Math.max(1.0, Math.round((wordCount > 30 ? 4.0 : 2.5) * 4) / 4)
          );

      let feedback = "";
      if (simulatedScore >= Number(maxScore)) {
        feedback = `Xuất sắc! Bài làm (${wordCount} từ) trình bày chuẩn mực, phân tích sâu sắc, lập luận chặt chẽ và đáp ứng toàn diện barem chấm thi.`;
      } else {
        feedback = `Chưa đạt điểm tối đa vì: Bài làm (${wordCount} từ) còn tóm lược, một số luận điểm chưa thực sự sâu sắc và còn thiếu dẫn chứng thực tiễn minh họa. Cần bổ sung: Bổ sung thêm các luận cứ phân tích cốt lõi, làm rõ cơ sở lý luận và liên hệ thực tế để đạt trọn vẹn ${maxScore}/${maxScore} điểm.`;
      }

      return NextResponse.json({
        score: simulatedScore,
        feedback,
        isMock: true,
        breakdown: {
          accuracy: simulatedScore * 0.5,
          depth: simulatedScore * 0.3,
          expression: simulatedScore * 0.2,
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const compactPrompt = `Bạn là Giám khảo chấm thi học thuật chuyên nghiệp. Hãy chấm câu tự luận dưới đây trên thang điểm ${maxScore} (làm tròn bước 0.25).
Tiêu chí đánh giá:
- Độ chính xác & đúng trọng tâm (50%)
- Lập luận logic & dẫn chứng (30%)
- Diễn đạt & trình bày (20%)

ĐỀ BÀI: ${String(questionContent).trim()}
${rubric ? `ĐÁP ÁN MẪU / BAREM: ${String(rubric).trim()}\n` : ""}BÀI LÀM CỦA HỌC VIÊN: ${String(studentAnswer).trim()}

QUY TẮC NHẬN XÉT (FEEDBACK) BẮT BUỘC:
1. Nếu điểm đạt tối đa (${maxScore}/${maxScore} điểm, ví dụ 5/5):
   - BẮT BUỘC nhận xét phải khen ngợi bài làm xuất sắc (ví dụ: "Xuất sắc! Bài làm nắm rất vững kiến thức trọng tâm, lập luận sắc bén, dẫn chứng đầy đủ và trình bày rất chuẩn mực.").
2. Nếu điểm dưới tối đa (< ${maxScore} điểm, ví dụ dưới 5 điểm):
   - BẮT BUỘC nhận xét phải nêu ngắn gọn 2 phần:
     + Lý do chưa đạt điểm tối đa: chỉ rõ điểm thiếu sót, sơ sài hoặc chưa chuẩn xác.
     + Nội dung cần bổ sung: chỉ rõ các ý, luận điểm, kiến thức hoặc dẫn chứng cần thêm vào để đạt điểm tuyệt đối.
   - Định dạng nhận xét bắt buộc:
     "Chưa đạt điểm tối đa vì: [Nêu lý do ngắn gọn]. Cần bổ sung: [Nêu cụ thể nội dung cần bổ sung]."

Trả về duy nhất định dạng JSON:
{"score":number,"feedback":"...","reason":"...","missing_points":"...","breakdown":{"accuracy":number,"depth":number,"expression":number}}`;

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

    let feedback = (resultJson.feedback || "").trim();
    if (finalScore >= Number(maxScore)) {
      if (!feedback.toLowerCase().includes("xuất sắc")) {
        feedback = `Xuất sắc! ${feedback || "Bài làm lập luận chặt chẽ, đầy đủ luận điểm và đáp ứng toàn diện yêu cầu đề bài."}`;
      }
    } else {
      const hasReason = feedback.toLowerCase().includes("vì:") || feedback.toLowerCase().includes("lý do");
      const hasSupplement = feedback.toLowerCase().includes("bổ sung");
      if (!hasReason || !hasSupplement) {
        if (resultJson.reason && resultJson.missing_points) {
          feedback = `Chưa đạt điểm tối đa vì: ${resultJson.reason}. Cần bổ sung: ${resultJson.missing_points}`;
        } else if (!hasSupplement) {
          feedback = `Chưa đạt điểm tối đa vì: ${feedback || "bài làm chưa triển khai toàn diện các ý chính"}. Cần bổ sung: Bổ sung thêm luận cứ phân tích, làm rõ dẫn chứng và liên kết chặt chẽ hơn với nội dung câu hỏi để đạt trọn vẹn ${maxScore}/${maxScore} điểm.`;
        }
      }
    }

    return NextResponse.json({
      score: finalScore,
      feedback,
      reason: resultJson.reason || "",
      missing_points: resultJson.missing_points || "",
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
