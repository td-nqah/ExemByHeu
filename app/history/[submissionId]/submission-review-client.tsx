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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-8 text-center shadow-xl">
          <h2 className="text-base font-bold text-white">
            Không tìm thấy bài làm
          </h2>
          <Link href="/history" className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-xs font-bold text-[#05070D] transition hover:bg-slate-200">
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF] transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white" />
          <span>Quay lại lịch sử đánh giá</span>
        </Link>
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-8 shadow-xl"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F3C] bg-[#10131B] px-3 py-1 text-[11px] font-mono text-[#9CA3AF]">
                <Calendar className="h-3 w-3 text-[#8B93A5]" />
                {formatDate(submission.submitted_at)}
              </span>
              {isGraded ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Đã hoàn tất đánh giá
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Đang chờ chấm điểm tự luận
                </span>
              )}
            </div>

            <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/40 leading-tight">
              {submission.exam?.title || "Bài kiểm tra"}
            </h1>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Học viên: <strong className="text-white">{submission.user?.username || "User"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#252A37] bg-[#10131B] p-4">
            <div className="text-right">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8B93A5]">Tổng điểm</p>
              <p className="text-2xl font-black text-white font-mono">
                {submission.total_score}
              </p>
            </div>
            <div className="h-8 w-px bg-[#252A37]" />
            <div className="space-y-0.5 text-xs text-[#9CA3AF]">
              <p>
                Trắc nghiệm: <span className="font-bold text-white font-mono">{submission.mcq_score}</span>
              </p>
              <p>
                Tự luận:{" "}
                <span className="font-bold text-white font-mono">
                  {submission.essay_score !== null ? submission.essay_score : "Chờ chấm"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
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
              className="rounded-3xl border border-[#252A37] bg-[#161A24] p-6 shadow-lg"
            >
              <div className="mb-4 flex items-center justify-between border-b border-[#252A37] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#252A37] bg-[#10131B] text-xs font-mono font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isMCQ ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F3C] bg-[#232836] px-3 py-1 text-xs font-semibold text-[#E5E7EB]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Đúng (+{answer.score_awarded} / {q.max_score} điểm)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F3C] bg-[#232836] px-3 py-1 text-xs font-semibold text-[#E5E7EB]">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        Sai (0 / {q.max_score} điểm)
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F3C] bg-[#232836] px-3 py-1 text-xs font-semibold text-[#E5E7EB]">
                      <Award className="h-3.5 w-3.5 text-white" />
                      Điểm đạt: {answer.score_awarded} / {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-100">
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
                      "border-[#252A37] bg-[#10131B] text-[#9CA3AF]";
                    let letterBadgeStyle =
                      "border border-[#252A37] bg-[#161A24] text-[#8B93A5] font-mono";

                    if (isCorrectAnswer) {
                      rowStyle =
                        "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 font-semibold";
                      letterBadgeStyle =
                        "border border-emerald-400/50 bg-emerald-500/20 text-emerald-300 font-mono";
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      rowStyle =
                        "border-rose-500/60 bg-rose-950/30 text-rose-300 font-semibold";
                      letterBadgeStyle =
                        "border border-rose-400/50 bg-rose-500/20 text-rose-300 font-mono";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-xs leading-relaxed transition ${rowStyle}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${letterBadgeStyle}`}
                          >
                            {letter}
                          </span>
                          <span className="pt-0.5 text-slate-200">
                            {optText.replace(/^[A-Z][\.\:\)]\s*/i, "")}
                          </span>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                          {isCandidateChoice && isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Lựa chọn của bạn (Đáp án đúng)</span>
                            </span>
                          )}

                          {isCandidateChoice && !isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                              <XCircle className="h-3 w-3 text-rose-400" />
                              <span>Lựa chọn của bạn</span>
                            </span>
                          )}

                          {!isCandidateChoice && isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
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
                    <label className="mb-1.5 block text-[11px] font-mono uppercase tracking-wider text-[#8B93A5]">
                      Bài làm của sinh viên
                    </label>
                    <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-100">
                      {answer.user_answer || "(Sinh viên không điền câu trả lời)"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-white">
                      <Sparkles className="h-4 w-4 text-white" />
                      <span className="text-xs font-bold text-white">
                        Đánh giá & Nhận xét học vụ (Trợ lý học thuật AI & Giảng viên phụ trách)
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#9CA3AF]">
                      {answer.admin_feedback ||
                        "Chưa có nhận xét chi tiết hoặc bài thi đang trong quá trình chấm."}
                    </p>
                  </div>
                </div>
              )}

              {/* Lời giải chi tiết / Giải thích đáp án nếu có */}
              {q.explanation && (
                <div className="mt-3.5 rounded-2xl border border-[#252A37] bg-[#10131B] p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                    <span>Lời giải chi tiết:</span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#9CA3AF]">
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
