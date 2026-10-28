import { NextResponse } from "next/server";
import { createExam, getCategories } from "@/lib/store";
import { ParsedQuestionDraft } from "@/types/exam";

interface BatchExamPayload {
  title: string;
  description?: string;
  durationMinutes?: number;
  categoryId?: string;
  categorySlug?: string;
  isShuffled?: boolean;
  questions: Array<{
    content: string;
    type: "multiple_choice" | "essay";
    options: string[];
    correctAnswer?: string;
    correct_answer?: string;
    explanation?: string;
    maxScore?: number;
    max_score?: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exams = [], defaultCategoryId = "" } = body;

    if (!Array.isArray(exams) || exams.length === 0) {
      return NextResponse.json(
        { error: "Danh sách đề thi cần lưu không hợp lệ hoặc rỗng." },
        { status: 400 }
      );
    }

    const categories = await getCategories(true);
    let resolvedCategory = categories.find((c) => c.id === defaultCategoryId);
    if (!resolvedCategory && categories.length > 0) {
      resolvedCategory = categories[0];
    }

    const savedExams = [];

    for (let i = 0; i < exams.length; i++) {
      const item: BatchExamPayload = exams[i];
      const examTitle = String(item.title || `Đề thi số ${i + 1}`).trim();
      const duration = Number(item.durationMinutes) || 45;

      const catId = item.categoryId || resolvedCategory?.id || "cat_cnxh";
      const catSlug = item.categorySlug || resolvedCategory?.slug || "cnxh";

      const hasEssay = item.questions.some((q) => q.type === "essay");
      const hasMcq = item.questions.some((q) => q.type === "multiple_choice");
      const qType: "multiple_choice" | "essay" | "mixed" =
        hasEssay && hasMcq ? "mixed" : hasEssay ? "essay" : "multiple_choice";

      const questionsDraft: ParsedQuestionDraft[] = (item.questions || []).map(
        (q, qIdx) => {
          const type = q.type === "essay" ? "essay" : "multiple_choice";
          const rawScore = Number(q.maxScore || q.max_score);
          const maxScore =
            !isNaN(rawScore) && rawScore > 0
              ? rawScore
              : type === "multiple_choice"
              ? 0.5
              : 2.0;

          return {
            id: `batch_q_${Date.now()}_${i + 1}_${qIdx + 1}`,
            type,
            content: String(q.content || "").trim(),
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: String(q.correctAnswer || q.correct_answer || "A").trim().toUpperCase(),
            max_score: maxScore,
          };
        }
      );

      const saved = await createExam(
        {
          title: examTitle,
          description: item.description || `Đề thi được tạo tự động từ tệp nhiều đề thi Word (.docx).`,
          duration_minutes: duration,
          status: "published",
          category_id: catId,
          category_slug: catSlug,
          question_count: questionsDraft.length,
          question_type: qType,
          is_shuffled: Boolean(item.isShuffled),
        },
        questionsDraft
      );

      savedExams.push(saved);
    }

    return NextResponse.json({
      success: true,
      savedCount: savedExams.length,
      savedExams: savedExams.map((e) => ({
        id: e.id,
        title: e.title,
        questionCount: e.question_count,
      })),
    });
  } catch (error: any) {
    console.error("Batch Exam Save Error:", error);
    return NextResponse.json(
      {
        error:
          "Lỗi trong quá trình lưu danh sách đề thi: " +
          (error?.message || "Không xác định"),
      },
      { status: 500 }
    );
  }
}
