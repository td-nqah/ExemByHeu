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
import { motion, useReducedMotion } from "motion/react";
import { NumberStepper } from "@/components/ui/NumberStepper";

interface EssayGradeState {
  questionId: string;
  score: number;
  feedback: string;
}

export function GradingRoomClient({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

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
        alert("Lỗi Trợ lý AI đánh giá: " + (data.error || "Không thể xử lý"));
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
      alert("Lỗi kết nối tới Trợ lý học thuật AI: " + (err?.message || "Vui lòng thử lại"));
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
      alert("Lỗi khi lưu kết quả đánh giá: " + (err?.message || "Vui lòng thử lại"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-10 w-10 text-rose-400" />
          <h2 className="text-base font-bold text-white">
            Không tìm thấy bài nộp
          </h2>
          <Link href="/admin/submissions" className="mt-3 inline-block text-xs font-semibold text-white underline">
            Quay lại danh sách bài nộp
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Quay lại Quản lý Bài nộp & Đánh giá</span>
        </Link>
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel mb-8 rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/90 border border-slate-700/50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-200">
                <User className="h-3 w-3 text-white" />
                Sinh viên: <strong>{submission.user?.username || "Sinh viên"}</strong>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/90 border border-slate-700/50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                <Calendar className="h-3 w-3 text-white" />
                {formatDate(submission.submitted_at)}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Đánh giá Học phần: {submission.exam?.title}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Kiểm tra kết quả trắc nghiệm và tiến hành đánh giá chi tiết các câu hỏi tự luận.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng điểm đánh giá</p>
              <p className="text-2xl font-black text-white">
                {liveTotalScore}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="space-y-0.5 text-xs text-slate-400">
              <p>
                Điểm trắc nghiệm (Đã khóa): <strong className="text-white">{mcqScore}</strong>
              </p>
              <p>
                Điểm tự luận: <strong className="text-white">{currentEssayTotal}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Check className="h-4 w-4 stroke-[3]" />
                Đã ghi nhận kết quả đánh giá và cập nhật điểm học phần!
              </span>
            ) : (
              <span>Thay đổi điểm số tự luận sẽ được tính toán trực tiếp vào tổng điểm.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Đang lưu..." : "Lưu kết quả đánh giá & Cập nhật điểm"}</span>
          </button>
        </div>
      </motion.div>

      <div className="space-y-6">
        {answers.map((ans, index) => {
          const q = ans.question;
          if (!q) return null;
          const isMCQ = q.type === "multiple_choice";

          return (
            <motion.article
              key={ans.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
              className={`glow-card rounded-2xl p-6 ${
                !isMCQ ? "border-white/20 ring-1 ring-white/10" : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isMCQ ? "Trắc nghiệm khách quan" : "Tự luận (Cần đánh giá)"}
                  </span>
                </div>

                <div>
                  {isMCQ ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/90 border border-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-300">
                        <Lock className="h-3 w-3 text-white" />
                        Tự động ghi nhận
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold ${
                          ans.is_correct
                            ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-400"
                            : "border-rose-500/40 bg-rose-950/50 text-rose-400"
                        }`}
                      >
                        {ans.is_correct ? `+${ans.score_awarded} điểm` : "0 điểm"}
                      </span>
                    </div>
                  ) : (
                    <span className="rounded-md bg-white/10 border border-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                      Điểm tối đa: {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-100">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2.5">
                  {q.options.map((optText, optI) => {
                    const letterMatch = optText.match(/^([A-Z])[\.\:\)]/i);
                    const letter = letterMatch
                      ? letterMatch[1].toUpperCase()
                      : String.fromCharCode(65 + optI);
                    const userChoiceLetter = (ans.user_answer || "")
                      .replace(/^([A-Z])[\.\:\)].*/i, "$1")
                      .trim()
                      .toUpperCase();
                    const correctKeyLetter = (q.correct_answer || "")
                      .replace(/^([A-Z])[\.\:\)].*/i, "$1")
                      .trim()
                      .toUpperCase();

                    const optId = `${q.id}_opt_${optI}`;
                    const isCandidateChoice =
                      (userChoiceLetter.length > 0 && userChoiceLetter === letter) ||
                      ans.user_answer === optId ||
                      ans.user_answer === optText;
                    const isCorrectAnswer =
                      correctKeyLetter.length > 0 && correctKeyLetter === letter;

                    let rowStyle =
                      "border-slate-800 bg-slate-900/40 text-slate-400 opacity-65";
                    let letterBadgeStyle =
                      "border border-slate-700 bg-slate-800 text-slate-400";

                    if (isCorrectAnswer) {
                      rowStyle =
                        "border-emerald-500 bg-emerald-950/50 text-emerald-400 font-semibold shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]";
                      letterBadgeStyle =
                        "border border-emerald-400/50 bg-emerald-500/20 text-emerald-300";
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      rowStyle =
                        "border-rose-500 bg-rose-950/50 text-rose-400 font-semibold shadow-[inset_0_1px_0_rgba(244,63,94,0.15)]";
                      letterBadgeStyle =
                        "border border-rose-400/50 bg-rose-500/20 text-rose-300";
                    }

                    return (
                      <div
                        key={optI}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 text-xs leading-relaxed transition ${rowStyle}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${letterBadgeStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="pt-0.5">
                            {optText.replace(/^[A-Z][\.\:\)]\s*/i, "")}
                          </span>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                          {isCandidateChoice && isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>Sinh viên chọn (Chính xác)</span>
                            </span>
                          )}

                          {isCandidateChoice && !isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                              <AlertCircle className="h-3 w-3 text-rose-400" />
                              <span>Phương án sinh viên chọn</span>
                            </span>
                          )}

                          {!isCandidateChoice && isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span>Đáp án chuẩn</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">
                      Bài làm của sinh viên
                    </label>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-100">
                      {ans.user_answer ? ans.user_answer : "(Sinh viên không điền nội dung trả lời)"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/20 bg-white/[0.04] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-white">
                          <Award className="h-4 w-4 text-white" />
                          Điểm số cho câu này (Tối đa: {q.max_score} điểm)
                        </label>
                        <button
                          type="button"
                          disabled={aiLoadingId === q.id}
                          onClick={() => handleGradeWithAI(q.id, q.content, ans.user_answer, q.max_score)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-white/20 hover:text-white active:scale-[0.98] disabled:opacity-50"
                          title="Sử dụng Trợ lý học thuật AI để phân tích câu trả lời và đề xuất điểm theo barem"
                        >
                          <Sparkles className="h-3 w-3 text-white" />
                          <span>{aiLoadingId === q.id ? "Trợ lý AI đang phân tích barem..." : "Đề xuất điểm với Trợ lý AI"}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <NumberStepper
                          value={essayGrades[q.id]?.score ?? 0}
                          onChange={(val) => handleScoreChange(q.id, q.max_score, String(val))}
                          min={0}
                          max={q.max_score}
                          step={0.25}
                        />
                        <span className="text-xs text-slate-400">/ {q.max_score}</span>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-300">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                        Nhận xét học vụ của Giảng viên phụ trách
                      </label>
                      <textarea
                        rows={3}
                        value={essayGrades[q.id]?.feedback ?? ""}
                        onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                        placeholder="Nhập nhận xét học vụ chi tiết, đối sánh barem điểm và hướng dẫn cải thiện..."
                        className="glass-input w-full rounded-xl p-3 text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>

      <div className="glass-panel mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl p-6 sm:flex-row">
        <div>
          <h4 className="text-sm font-bold text-white">
            Xác nhận lưu kết quả đánh giá học phần?
          </h4>
          <p className="text-xs text-slate-400">
            Điểm tự luận ({currentEssayTotal} đ) kết hợp cùng điểm trắc nghiệm ({mcqScore} đ) thành tổng điểm {liveTotalScore} (Thang điểm 10).
          </p>
        </div>

        <button
          type="button"
          onClick={handleFinalize}
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-6 py-3 text-xs font-bold text-zinc-950 shadow-sm transition active:scale-[0.98] disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? "Đang lưu..." : "Lưu kết quả đánh giá & Cập nhật điểm"}</span>
        </button>
      </div>
    </div>
  );
}
