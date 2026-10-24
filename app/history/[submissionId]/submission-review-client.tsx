"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissionById, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Calendar,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function SubmissionReviewClient({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const data = await getSubmissionById(submissionId);
        // Bảo vệ quyền riêng tư: Học viên chỉ được xem bài làm của chính mình
        if (data && user && user.role !== "admin" && data.user_id && data.user_id !== user.id) {
          router.push("/history");
          return;
        }
        setSubmission(data);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [submissionId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <h2 className="text-base font-bold text-[#111827] dark:text-white">
            Không tìm thấy bài làm
          </h2>
          <Link href="/history" className="mt-3 inline-block text-xs font-semibold text-[#111827] dark:text-white underline">
            Quay lại Lịch sử làm bài
          </Link>
        </div>
      </div>
    );
  }

  const isGraded = submission.status === "graded";
  const answers = submission.answers || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] transition hover:text-[#111827] dark:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#111827] dark:text-white" />
          <span>Quay lại lịch sử đánh giá</span>
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
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#F6F6F8] dark:bg-[#1A1C24] border border-black/[0.08] dark:border-white/[0.1] px-2.5 py-0.5 text-[11px] font-semibold text-[#111827] dark:text-white">
                <Calendar className="h-3 w-3 text-[#111827] dark:text-white" />
                {formatDate(submission.submitted_at)}
              </span>
              {isGraded ? (
                <span className="inline-flex items-center gap-1 border border-[#2E9E5B]/20 bg-[#DDF2E5] px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold text-[#2E9E5B]">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã hoàn tất đánh giá
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 border border-[#B8962E]/30 bg-[#F6EBC8] px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold text-[#B8962E]">
                  <Clock className="h-3 w-3" />
                  Đang chờ chấm điểm tự luận
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-white sm:text-2xl">
              {submission.exam?.title || "Bài kiểm tra"}
            </h1>
            <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              User: <strong className="text-[#111827] dark:text-white">{submission.user?.username || "User"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] p-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Tổng điểm</p>
              <p className="text-2xl font-black text-[#111827] dark:text-white">
                {submission.total_score}
              </p>
            </div>
            <div className="h-8 w-px bg-black/[0.1] dark:bg-white/[0.1]" />
            <div className="space-y-0.5 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              <p>
                Trắc nghiệm: <span className="font-bold text-[#111827] dark:text-white">{submission.mcq_score}</span>
              </p>
              <p>
                Tự luận:{" "}
                <span className="font-bold text-[#111827] dark:text-white">
                  {submission.essay_score !== null ? submission.essay_score : "Chờ chấm"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-[#111827] dark:text-white">
          Chi tiết từng câu hỏi ({answers.length} câu)
        </h2>

        {answers.map((answer, index) => {
          const q = answer.question;
          if (!q) return null;

          const isMCQ = q.type === "multiple_choice";
          const isCorrect = answer.is_correct === true;

          return (
            <motion.article
              key={answer.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
              className="card-soft rounded-[24px] bg-white dark:bg-[#1A1D26] border border-black/[0.06] dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] p-6"
            >
              <div className="mb-4 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] text-xs font-bold text-[#111827] dark:text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-[#111827] dark:text-white">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isMCQ ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Đúng (+{answer.score_awarded} / {q.max_score} điểm)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 dark:border-rose-500/40 bg-rose-100 dark:bg-rose-950/50 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:text-rose-400">
                        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        Sai (0 / {q.max_score} điểm)
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#F6F6F8] dark:bg-[#1A1C24] border border-black/[0.08] dark:border-white/[0.1] px-2.5 py-0.5 text-xs font-bold text-[#111827] dark:text-white">
                      <Award className="h-3.5 w-3.5" />
                      Điểm đạt: {answer.score_awarded} / {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#111827] dark:text-white">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2.5">
                  {q.options.map((optText, optIdx) => {
                    const letterMatch = optText.match(/^([A-Z])[\.\:\)]/i);
                    const letter = letterMatch
                      ? letterMatch[1].toUpperCase()
                      : String.fromCharCode(65 + optIdx);
                    const userChoiceLetter = (answer.user_answer || "")
                      .replace(/^([A-Z])[\.\:\)].*/i, "$1")
                      .trim()
                      .toUpperCase();
                    const correctKeyLetter = (q.correct_answer || "")
                      .replace(/^([A-Z])[\.\:\)].*/i, "$1")
                      .trim()
                      .toUpperCase();

                    const optId = `${q.id}_opt_${optIdx}`;
                    const isCandidateChoice =
                      (userChoiceLetter.length > 0 && userChoiceLetter === letter) ||
                      answer.user_answer === optId ||
                      answer.user_answer === optText;
                    const isCorrectAnswer =
                      correctKeyLetter.length > 0 && correctKeyLetter === letter;

                    let rowStyle =
                      "border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] text-[#6B7280] dark:text-[#9CA3AF] opacity-80";
                    let letterBadgeStyle =
                      "border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#1A1C24] text-[#6B7280] dark:text-[#9CA3AF]";

                    if (isCorrectAnswer) {
                      rowStyle =
                        "border-[#2E9E5B] dark:border-emerald-500/50 bg-[#DDF2E5] dark:bg-emerald-950/30 text-[#2E9E5B] dark:text-emerald-400 font-semibold shadow-xs";
                      letterBadgeStyle =
                        "border border-[#2E9E5B] bg-[#2E9E5B] text-white";
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      rowStyle =
                        "border-rose-300 dark:border-rose-500/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 font-semibold shadow-xs";
                      letterBadgeStyle =
                        "border border-rose-500 bg-rose-600 text-white";
                    }

                    return (
                      <div
                        key={optIdx}
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
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Lựa chọn của bạn (Đáp án đúng)</span>
                            </span>
                          )}

                          {isCandidateChoice && !isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 dark:border-rose-500/40 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-400">
                              <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                              <span>Lựa chọn của bạn</span>
                            </span>
                          )}

                          {!isCandidateChoice && isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 dark:border-emerald-500/40 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Đáp án đúng</span>
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
                    <label className="mb-1.5 block text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
                      Bài làm của sinh viên
                    </label>
                    <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] p-4 whitespace-pre-wrap text-xs leading-relaxed text-[#111827] dark:text-white">
                      {answer.user_answer || "(Sinh viên không điền câu trả lời)"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-[#111827] dark:text-white">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-bold text-[#111827] dark:text-white">
                        Đánh giá & Nhận xét học vụ (Trợ lý học thuật AI & Giảng viên phụ trách)
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#4B5563] dark:text-slate-300">
                      {answer.admin_feedback ||
                        "Chưa có nhận xét chi tiết hoặc bài thi đang trong quá trình chấm."}
                    </p>
                  </div>
                </div>
              )}

              {/* Lời giải chi tiết / Giải thích đáp án nếu có */}
              {q.explanation && (
                <div className="mt-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F6F6F8] dark:bg-[#14161D] p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#111827] dark:text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Lời giải chi tiết:</span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#111827] dark:text-white">
                    {q.explanation}
                  </p>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
