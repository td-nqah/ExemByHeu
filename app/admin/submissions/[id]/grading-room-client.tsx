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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
          <h2 className="text-base font-bold text-white">
            Không tìm thấy bài nộp
          </h2>
          <Link href="/admin/submissions" className="mt-3 inline-block text-xs font-semibold text-emerald-400 underline">
            Quay lại danh sách bài làm
          </Link>
        </div>
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Quản lý Bài nộp</span>
        </Link>
      </div>

      <div className="glass-panel mb-8 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="glass-pill inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-zinc-200">
                <User className="h-3 w-3 text-emerald-400" />
                Thí sinh: <strong>{submission.user?.username || "Thí sinh"}</strong>
              </span>
              <span className="glass-pill inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                <Calendar className="h-3 w-3 text-emerald-400" />
                {formatDate(submission.submitted_at)}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Phòng Chấm thi: {submission.exam?.title}
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Kiểm tra điểm trắc nghiệm (đã khóa tự động) và chấm các câu hỏi tự luận bên dưới.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tổng điểm tính lại</p>
              <p className="text-2xl font-black text-emerald-400">
                {liveTotalScore}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="space-y-0.5 text-xs text-zinc-400">
              <p>
                Trắc nghiệm (Khóa): <strong className="text-white">{mcqScore}</strong>
              </p>
              <p>
                Tự luận đang chấm: <strong className="text-white">{currentEssayTotal}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
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
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
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
              className={`glass-card rounded-2xl p-6 ${
                !isMCQ ? "border-emerald-500/30 ring-1 ring-emerald-500/20" : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-xs font-bold text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận (Cần chấm)"}
                  </span>
                </div>

                <div>
                  {isMCQ ? (
                    <div className="flex items-center gap-2">
                      <span className="glass-pill inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-zinc-300">
                        <Lock className="h-3 w-3 text-emerald-400" />
                        Tự động chấm
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${
                          ans.is_correct
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-red-500/30 bg-red-500/15 text-red-300"
                        }`}
                      >
                        {ans.is_correct ? `+${ans.score_awarded} điểm` : "0 điểm"}
                      </span>
                    </div>
                  ) : (
                    <span className="glass-pill rounded-md px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                      Điểm tối đa: {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-100">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2 rounded-xl border border-white/10 bg-zinc-950/55 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-400">
                      Thí sinh chọn: <strong className="text-white">{ans.user_answer || "Bỏ trống"}</strong>
                    </span>
                    <span className="text-emerald-400">
                      Đáp án chuẩn: <strong>{q.correct_answer}</strong>
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-400">
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
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">
                      Bài làm của thí sinh
                    </label>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/65 p-4 whitespace-pre-wrap text-xs leading-relaxed text-zinc-100">
                      {ans.user_answer ? ans.user_answer : "(Thí sinh bỏ trống câu này)"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <Award className="h-4 w-4 text-emerald-400" />
                          Điểm số cho câu này (Tối đa: {q.max_score} điểm)
                        </label>
                        <button
                          type="button"
                          disabled={aiLoadingId === q.id}
                          onClick={() => handleGradeWithAI(q.id, q.content, ans.user_answer, q.max_score)}
                          className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 hover:text-white active:scale-[0.98] disabled:opacity-50"
                          title="Sử dụng Gemini Pro để phân tích câu trả lời và chấm gợi ý"
                        >
                          <Sparkles className="h-3 w-3 text-emerald-400" />
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
                          className="glass-input h-8 w-20 rounded-lg px-2 text-center text-xs font-bold"
                        />
                        <span className="text-xs text-zinc-400">/ {q.max_score}</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-300">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                        Nhận xét và phản hồi của Giảng viên
                      </label>
                      <textarea
                        rows={3}
                        value={essayGrades[q.id]?.feedback ?? ""}
                        onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                        placeholder="Nhập nhận xét chi tiết, chỉ ra lỗi sai hoặc khen ngợi thí sinh..."
                        className="glass-input w-full rounded-xl p-3 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="glass-panel mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl p-6 sm:flex-row">
        <div>
          <h4 className="text-sm font-bold text-white">
            Xác nhận hoàn tất phiên chấm thi?
          </h4>
          <p className="text-xs text-zinc-400">
            Điểm tự luận ({currentEssayTotal} đ) sẽ cộng cùng điểm trắc nghiệm ({mcqScore} đ) thành {liveTotalScore} điểm.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-6 py-3 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Đang lưu..." : "Hoàn tất Chấm thi & Cập nhật điểm"}</span>
        </button>
      </div>
    </div>
  );
}
