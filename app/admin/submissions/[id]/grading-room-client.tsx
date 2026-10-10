"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissionById, finalizeGrading, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Lock,
  MessageSquare,
  Award,
  Save,
  Check,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface EssayGradeState {
  questionId: string;
  score: number;
  feedback: string;
}

export function GradingRoomClient({ submissionId }: { submissionId: string }) {
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [essayGrades, setEssayGrades] = useState<Record<string, EssayGradeState>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const handleGradeWithAI = async (
    questionId: string,
    questionContent: string,
    studentAnswer: string,
    maxScore: number
  ) => {
    setAiLoadingId(questionId);
    try {
      const res = await fetch("/api/ai/grade-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionContent,
          studentAnswer,
          maxScore: maxScore || 5.0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Lỗi AI chấm thi: " + (data.error || "Không thể xử lý"));
        return;
      }

      setEssayGrades((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          score: Number(data.score) || 0,
          feedback: data.feedback || "",
        },
      }));
    } catch (err: any) {
      alert("Lỗi kết nối tới dịch vụ AI: " + (err?.message || "Vui lòng thử lại"));
    } finally {
      setAiLoadingId(null);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const data = await getSubmissionById(submissionId);
        if (!data) {
          router.push("/admin/submissions");
          return;
        }
        setSubmission(data);

        const initialMap: Record<string, EssayGradeState> = {};
        if (data.answers) {
          for (const ans of data.answers) {
            if (ans.question?.type === "essay") {
              initialMap[ans.question_id] = {
                questionId: ans.question_id,
                score: Number(ans.score_awarded) || 0,
                feedback: ans.admin_feedback || "",
              };
            }
          }
        }
        setEssayGrades(initialMap);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [submissionId, router]);

  const handleScoreChange = (questionId: string, maxScore: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const clamped = Math.max(0, Math.min(maxScore, val));
    setEssayGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        score: clamped,
      },
    }));
  };

  const handleFeedbackChange = (questionId: string, feedback: string) => {
    setEssayGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        feedback,
      },
    }));
  };

  const handleFinalize = async () => {
    if (!submission) return;
    setIsSubmitting(true);
    setSavedSuccess(false);

    try {
      const gradesArray = Object.values(essayGrades);
      const updated = await finalizeGrading(submission.id, gradesArray);
      if (updated) {
        setSubmission(updated);
        setSavedSuccess(true);
        setTimeout(() => {
          router.push("/admin/submissions");
        }, 1200);
      }
    } catch (err: any) {
      alert("Lỗi khi lưu kết quả chấm thi: " + (err?.message || "Vui lòng thử lại"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Không tìm thấy bài nộp
        </h2>
        <Link href="/admin/submissions" className="mt-3 text-xs font-semibold text-zinc-700 underline">
          Quay lại danh sách bài làm
        </Link>
      </div>
    );
  }

  const mcqScore = Number(submission.mcq_score) || 0;
  const currentEssayTotal = Object.values(essayGrades).reduce((acc, g) => acc + (Number(g.score) || 0), 0);
  const liveTotalScore = mcqScore + currentEssayTotal;
  const answers = submission.answers || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Quản lý Bài nộp</span>
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <User className="h-3 w-3" />
                Thí sinh: <strong>{submission.user?.username || "Thí sinh"}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                <Calendar className="h-3 w-3" />
                {formatDate(submission.submitted_at)}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              Phòng Chấm thi: {submission.exam?.title}
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Kiểm tra điểm trắc nghiệm (đã khóa tự động) và chấm các câu hỏi tự luận bên dưới.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tổng điểm tính lại</p>
              <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">
                {liveTotalScore}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
              <p>Trắc nghiệm (Khóa): <strong className="text-zinc-900 dark:text-zinc-100">{mcqScore}</strong></p>
              <p>Tự luận đang chấm: <strong className="text-zinc-900 dark:text-zinc-100">{currentEssayTotal}</strong></p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800 gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4 stroke-[3]" />
                Đã hoàn tất chấm điểm và đồng bộ vào hệ thống!
              </span>
            ) : (
              <span>Thay đổi điểm số tự luận sẽ được tính toán trực tiếp vào tổng điểm.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Đang lưu..." : "Hoàn tất Chấm thi & Cập nhật điểm"}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {answers.map((ans, index) => {
          const q = ans.question;
          if (!q) return null;
          const isMCQ = q.type === "multiple_choice";

          return (
            <article
              key={ans.id}
              className={`rounded-2xl border bg-white p-6 shadow-xs transition dark:bg-zinc-900 ${
                isMCQ
                  ? "border-zinc-200 dark:border-zinc-800"
                  : "border-blue-200/80 ring-1 ring-blue-100 dark:border-blue-900/60 dark:ring-blue-950/40"
              }`}
            >
              <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận (Cần chấm)"}
                  </span>
                </div>

                <div>
                  {isMCQ ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        <Lock className="h-3 w-3" />
                        Tự động chấm
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                          ans.is_correct
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        {ans.is_correct ? `+${ans.score_awarded} điểm` : "0 điểm"}
                      </span>
                    </div>
                  ) : (
                    <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      Điểm tối đa: {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100 mb-4 whitespace-pre-wrap">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-800/30">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Thí sinh chọn: <strong className="text-zinc-900 dark:text-zinc-100">{ans.user_answer || "Bỏ trống"}</strong>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Đáp án chuẩn: <strong>{q.correct_answer}</strong>
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500">
                    {q.options.map((opt, optI) => (
                      <div key={optI} className="py-0.5">
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                      Bài làm của thí sinh
                    </label>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-900 whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-100">
                      {ans.user_answer ? ans.user_answer : "(Thí sinh bỏ trống câu này)"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Điểm số cho câu này (Tối đa: {q.max_score} điểm)
                        </label>
                        <button
                          type="button"
                          disabled={aiLoadingId === q.id}
                          onClick={() => handleGradeWithAI(q.id, q.content, ans.user_answer, q.max_score)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 shadow-xs transition hover:bg-purple-100 active:scale-[0.98] disabled:opacity-50 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300"
                          title="Sử dụng Gemini Pro để phân tích câu trả lời và chấm gợi ý"
                        >
                          <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                          <span>{aiLoadingId === q.id ? "Gemini Pro đang chấm..." : "Chấm gợi ý với Gemini Pro"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={q.max_score}
                          step="0.25"
                          value={essayGrades[q.id]?.score ?? 0}
                          onChange={(e) => handleScoreChange(q.id, q.max_score, e.target.value)}
                          className="h-8 w-20 rounded-md border border-zinc-300 bg-white px-2 text-center text-xs font-bold text-zinc-900 focus:border-zinc-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                        <span className="text-xs text-zinc-500">/ {q.max_score}</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        Nhận xét và phản hồi của Giảng viên
                      </label>
                      <textarea
                        rows={3}
                        value={essayGrades[q.id]?.feedback ?? ""}
                        onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                        placeholder="Nhập nhận xét chi tiết, chỉ ra lỗi sai hoặc khen ngợi thí sinh..."
                        className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Xác nhận hoàn tất phiên chấm thi?
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Điểm tự luận ({currentEssayTotal} đ) sẽ cộng cùng điểm trắc nghiệm ({mcqScore} đ) thành {liveTotalScore} điểm.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSubmitting}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Đang lưu..." : "Hoàn tất Chấm thi & Cập nhật điểm"}</span>
        </button>
      </div>
    </div>
  );
}
