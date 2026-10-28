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
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface ParsedEssayEvaluation {
  isFull: boolean;
  score: number;
  maxScore: number;
  praise: string;
  reason: string;
  missingPoints: string;
}

function parseEssayEvaluation(
  feedback: string | undefined | null,
  scoreAwarded: number | null | undefined,
  maxScore: number | undefined
): ParsedEssayEvaluation {
  const max = Number(maxScore) || 5.0;
  const score = typeof scoreAwarded === "number" ? scoreAwarded : 0;
  const isFull = score >= max && max > 0;
  const raw = (feedback || "").trim();

  if (isFull) {
    let praise = raw;
    if (!praise || praise.includes("Đang chờ") || praise.includes("Chưa có nhận xét")) {
      praise =
        "Xuất sắc! Bài làm nắm rất vững kiến thức trọng tâm, lập luận sắc bén, dẫn chứng đầy đủ và trình bày rất chuẩn mực theo tiêu chí chấm thi.";
    } else if (!praise.toLowerCase().includes("xuất sắc")) {
      praise = `Xuất sắc! ${praise}`;
    }
    return {
      isFull: true,
      score,
      maxScore: max,
      praise,
      reason: "",
      missingPoints: "",
    };
  }

  // Not full score (< maxScore or < 5)
  let reason = "";
  let missingPoints = "";

  // Try parsing "Chưa đạt điểm tối đa vì: ... Cần bổ sung: ..."
  const reasonMatch = raw.match(
    /(?:chưa đạt điểm tối đa vì|lý do chưa đạt điểm tối đa|lý do|nguyên nhân)\s*:\s*([\s\S]*?)(?=(?:cần bổ sung|nội dung cần bổ sung)\s*:|$)/i
  );
  const missingMatch = raw.match(
    /(?:cần bổ sung|nội dung cần bổ sung)\s*:\s*([\s\S]*)/i
  );

  if (reasonMatch && reasonMatch[1]?.trim()) {
    reason = reasonMatch[1].trim();
  }
  if (missingMatch && missingMatch[1]?.trim()) {
    missingPoints = missingMatch[1].trim();
  }

  // Intelligent fallback if raw text was not in the strict 2-part format
  if (!reason && !missingPoints) {
    if (raw && !raw.includes("Chưa có nhận xét") && !raw.includes("Đang chờ")) {
      reason = raw;
      missingPoints = `Bổ sung thêm luận điểm phân tích cốt lõi, mở rộng dẫn chứng và liên kết chặt chẽ hơn với yêu cầu đề thi để đạt trọn vẹn ${max}/${max} điểm.`;
    } else {
      reason = `Bài làm chưa đáp ứng toàn diện các tiêu chí đánh giá theo barem điểm (${score}/${max} điểm).`;
      missingPoints = `Cần hoàn thiện đầy đủ các ý chính của đề bài, làm rõ cơ sở lý luận và liên hệ thực tiễn để đạt trọn vẹn ${max}/${max} điểm.`;
    }
  } else if (!missingPoints) {
    missingPoints = `Bổ sung thêm các luận cứ phân tích chuyên sâu và ví dụ minh họa cụ thể để đạt trọn vẹn ${max}/${max} điểm.`;
  } else if (!reason) {
    reason = `Bài làm còn một số thiếu sót cần hoàn thiện để đạt trọn vẹn ${max}/${max} điểm.`;
  }

  return {
    isFull: false,
    score,
    maxScore: max,
    praise: "",
    reason,
    missingPoints,
  };
}

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

      {/* Overview Card */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8 rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-8 shadow-xl"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F3C] bg-[#10131B] px-3 py-1 text-[11px] tabular-nums text-[#9CA3AF]">
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
              <p className="text-[11px] font-medium text-[#8B93A5]">
                Điểm tổng kết
              </p>
              <div className="flex items-baseline gap-1 text-2xl font-black text-white tabular-nums">
                <span>{submission.total_score}</span>
                <span className="text-xs font-normal text-[#8B93A5]">/ 10 đ</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Questions Breakdown List */}
      <div className="space-y-4">
        <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-[#8B93A5] px-1">
          Chi tiết từng câu hỏi ({answers.length} câu)
        </h2>

        {answers.map((answer, index) => {
          const q = answer.question;
          if (!q) return null;

          const isMCQ = q.type === "multiple_choice";
          const isCorrect = answer.is_correct;
          const evalResult = !isMCQ
            ? parseEssayEvaluation(answer.admin_feedback, answer.score_awarded, q.max_score)
            : null;

          return (
            <motion.article
              key={answer.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.25) }}
              className="rounded-3xl border border-[#252A37] bg-[#161A24] p-6 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#252A37] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#252A37] bg-[#10131B] text-xs font-bold text-white tabular-nums">
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
                  ) : evalResult?.isFull ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      Điểm tuyệt đối: {answer.score_awarded} / {q.max_score} điểm
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2A2F3C] bg-[#232836] px-3 py-1 text-xs font-semibold text-[#E5E7EB]">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      Điểm đạt: {answer.score_awarded} / {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-slate-100">
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
                      "border border-[#252A37] bg-[#161A24] text-[#8B93A5]";

                    if (isCorrectAnswer) {
                      rowStyle =
                        "border-emerald-500/60 bg-emerald-950/30 text-emerald-300 font-semibold";
                      letterBadgeStyle =
                        "border border-emerald-400/50 bg-emerald-500/20 text-emerald-300";
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      rowStyle =
                        "border-rose-500/60 bg-rose-950/30 text-rose-300 font-semibold";
                      letterBadgeStyle =
                        "border border-rose-400/50 bg-rose-500/20 text-rose-300";
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
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Lựa chọn của bạn (Đáp án đúng)</span>
                            </span>
                          )}

                          {isCandidateChoice && !isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                              <XCircle className="h-3.5 w-3.5 text-rose-400" />
                              <span>Lựa chọn của bạn</span>
                            </span>
                          )}

                          {!isCandidateChoice && isCorrectAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
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
                  {/* Bài làm của thí sinh */}
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#8B93A5] font-semibold">
                      Bài làm của sinh viên
                    </label>
                    <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4 whitespace-pre-wrap text-xs leading-relaxed text-slate-100">
                      {answer.user_answer || "(Sinh viên không điền câu trả lời)"}
                    </div>
                  </div>

                  {/* Phần hiển thị Đánh giá & Nhận xét của Trợ lý AI */}
                  {evalResult?.isFull ? (
                    <div className="rounded-2xl border border-white/20 bg-[#10131B] p-4 sm:p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#252A37]">
                        <div className="flex items-center gap-2 text-white">
                          <Sparkles className="h-4 w-4 text-white" />
                          <span className="text-xs font-bold">
                            Đánh giá &amp; Nhận xét học vụ (Trợ lý học thuật AI)
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          Khen ngợi: Xuất sắc ({evalResult.score} / {evalResult.maxScore} điểm)
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🌟 Lời khen từ Trợ lý AI:</span>
                        </p>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {evalResult.praise}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4 sm:p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#252A37]">
                        <div className="flex items-center gap-2 text-white">
                          <Sparkles className="h-4 w-4 text-white" />
                          <span className="text-xs font-bold">
                            Đánh giá &amp; Nhận xét học vụ (Trợ lý học thuật AI)
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-300 border border-white/15">
                          <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                          Chưa đạt điểm tối đa ({evalResult?.score} / {evalResult?.maxScore} điểm)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                        {/* 1. Lý do không full điểm */}
                        <div className="p-3.5 rounded-xl bg-[#161A24] border border-[#252A37] space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                            <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>Lý do chưa đạt điểm tối đa:</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {evalResult?.reason}
                          </p>
                        </div>

                        {/* 2. Phải bổ sung nội dung gì */}
                        <div className="p-3.5 rounded-xl bg-[#161A24] border border-[#252A37] space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <HelpCircle className="h-3.5 w-3.5 text-white shrink-0" />
                            <span>Nội dung cần bổ sung để full điểm:</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {evalResult?.missingPoints}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Lời giải chi tiết / Giải thích đáp án nếu có */}
              {q.explanation && (
                <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-3.5">
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
