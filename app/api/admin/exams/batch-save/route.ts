import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

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
    const { exams = [], defaultCategoryId = "cat_cnxh" } = body;

    if (!Array.isArray(exams) || exams.length === 0) {
      return NextResponse.json(
        { error: "Danh sách đề thi cần lưu không hợp lệ hoặc rỗng." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const savedExams: Array<{ id: string; title: string; questionCount: number }> = [];

    for (let i = 0; i < exams.length; i++) {
      const item: BatchExamPayload = exams[i];
      const examTitle = String(item.title || `Đề thi số ${i + 1}`).trim();
      const duration = Number(item.durationMinutes) || 45;
      const catId = item.categoryId || defaultCategoryId || "cat_cnxh";
      const catSlug = item.categorySlug || "cnxh";

      const hasEssay = item.questions?.some((q) => q.type === "essay");
      const hasMcq = item.questions?.some((q) => q.type === "multiple_choice");
      const qType: "multiple_choice" | "essay" | "mixed" =
        hasEssay && hasMcq ? "mixed" : hasEssay ? "essay" : "multiple_choice";

      const examId = `exam_${Date.now()}_${i + 1}_${Math.random().toString(36).substring(2, 7)}`;
      const createdBy = "00000000-0000-0000-0000-000000000001";
      const isShuffled = Boolean(item.isShuffled);

      const meta = {
        category_id: catId,
        category_slug: catSlug,
        question_count: item.questions?.length || 0,
        question_type: qType,
        is_shuffled: isShuffled,
      };
      const descWithMeta = `<!--meta:${JSON.stringify(meta)}-->\n${item.description || "Đề thi được tạo tự động từ tệp nhiều đề thi Word (.docx)."}`.trim();

      const questionsList = (item.questions || []).map((q, qIdx) => {
        const type = q.type === "essay" ? "essay" : "multiple_choice";
        const rawScore = Number(q.maxScore || q.max_score);
        const maxScore =
          !isNaN(rawScore) && rawScore > 0
            ? rawScore
            : type === "multiple_choice"
            ? 0.5
            : 2.0;

        return {
          id: `q_${Date.now()}_${i + 1}_${qIdx + 1}_${Math.random().toString(36).substring(2, 6)}`,
          exam_id: examId,
          type,
          content: String(q.content || `Câu hỏi số ${qIdx + 1}`).trim(),
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: String(q.correctAnswer || q.correct_answer || "A").trim().toUpperCase(),
          max_score: maxScore,
          order_index: qIdx + 1,
        };
      });

      let actualExamId = examId;

      if (supabase) {
        let insertedExam: any = null;
        let examErr: any = null;

        // 1. Attempt insert with all columns
        try {
          const fullRes = await supabase
            .from("exams")
            .insert({
              title: examTitle,
              description: descWithMeta,
              duration_minutes: duration,
              category_id: catId,
              category_slug: catSlug,
              question_count: questionsList.length,
              question_type: qType,
              status: "published",
              is_shuffled: isShuffled,
              created_by: createdBy,
            })
            .select()
            .single();

          insertedExam = fullRes.data;
          examErr = fullRes.error;
        } catch (e) {
          examErr = e;
        }

        // 2. Fallback to base columns if schema doesn't have extended columns
        if (examErr || !insertedExam) {
          try {
            const baseRes = await supabase
              .from("exams")
              .insert({
                title: examTitle,
                description: descWithMeta,
                duration_minutes: duration,
                status: "published",
                created_by: createdBy,
              })
              .select()
              .single();

            insertedExam = baseRes.data;
          } catch {
            // ignore
          }
        }

        if (insertedExam?.id) {
          actualExamId = insertedExam.id;
        }

        // 3. Batch insert questions for this exam
        if (questionsList.length > 0) {
          const questionsPayload = questionsList.map((q) => ({
            exam_id: actualExamId,
            type: q.type,
            content: q.content,
            options: q.options,
            correct_answer: q.correct_answer,
            max_score: q.max_score,
            order_index: q.order_index,
          }));

          try {
            await supabase.from("questions").insert(questionsPayload);
          } catch (qErr) {
            console.error(`Failed to insert questions for exam ${actualExamId}:`, qErr);
          }
        }
      }

      savedExams.push({
        id: actualExamId,
        title: examTitle,
        questionCount: questionsList.length,
      });
    }

    return NextResponse.json({
      success: true,
      savedCount: savedExams.length,
      savedExams,
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
