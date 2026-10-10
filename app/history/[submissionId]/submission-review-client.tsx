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

export function SubmissionReviewClient({ submissionId }: { submissionId: string }) {
  const router = useRouter();

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          <h2 className="text-base font-bold text-white">
            Không tìm thấy bài làm
          </h2>
          <Link href="/history" className="mt-3 inline-block text-xs font-semibold text-emerald-400 underline">
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại danh sách bài làm</span>
        </Link>
      </div>

      <div className="glass-panel mb-8 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="glass-pill inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
                <Calendar className="h-3 w-3 text-emerald-400" />
                {formatDate(submission.submitted_at)}
              </span>
              {isGraded ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã hoàn thành chấm điểm
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                  <Clock className="h-3 w-3" />
                  Đang chờ chấm tự luận
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {submission.exam?.title || "Bài kiểm tra"}
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Thí sinh: {submission.user?.username || "Thí sinh"}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tổng điểm</p>
              <p className="text-2xl font-black text-emerald-400">
                {submission.total_score}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="space-y-0.5 text-xs text-zinc-400">
              <p>
                Trắc nghiệm: <span className="font-bold text-white">{submission.mcq_score}</span>
              </p>
              <p>
                Tự luận:{" "}
                <span className="font-bold text-white">
                  {submission.essay_score !== null ? submission.essay_score : "Chờ chấm"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-zinc-300">
          Chi tiết từng câu hỏi ({answers.length} câu)
        </h2>

        {answers.map((answer, index) => {
          const q = answer.question;
          if (!q) return null;

          const isMCQ = q.type === "multiple_choice";
          const isCorrect = answer.is_correct === true;

          return (
            <article
              key={answer.id}
              className="glass-card rounded-2xl p-6"
            >
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 text-xs font-bold text-emerald-400">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-white">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isMCQ ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đúng (+{answer.score_awarded} / {q.max_score} điểm)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-300">
                        <XCircle className="h-3.5 w-3.5" />
                        Sai (0 / {q.max_score} điểm)
                      </span>
                    )
                  ) : (
                    <span className="glass-pill inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                      <Award className="h-3.5 w-3.5 text-emerald-400" />
                      Điểm đạt: {answer.score_awarded} / {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-100">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const letterMatch = optText.match(/^([A-D])[\.\:\)]/i);
                    const letter = letterMatch
                      ? letterMatch[1].toUpperCase()
                      : String.fromCharCode(65 + optIdx);
                    const isCandidateChoice = answer.user_answer.toUpperCase() === letter;
                    const isCorrectAnswer = q.correct_answer.toUpperCase() === letter;

                    let rowStyle =
                      "border-white/10 bg-zinc-950/50 text-zinc-300";
                    if (isCorrectAnswer) {
                      rowStyle =
                        "border-emerald-500/60 bg-emerald-950/40 text-emerald-100 font-semibold ring-1 ring-emerald-500/40";
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      rowStyle =
                        "border-red-500/50 bg-red-950/40 text-red-200 font-medium";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs leading-relaxed ${rowStyle}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-bold">{letter}.</span>
                          <span>{optText.replace(/^[A-D][\.\:\)]\s*/i, "")}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
                          {isCandidateChoice && (
                            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-white">
                              Lựa chọn của bạn
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-zinc-950">
                              Đáp án chuẩn
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
                    <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">
                      Bài làm của thí sinh
                    </label>
                    <div className="rounded-xl border border-white/10 bg-zinc-950/65 p-4 whitespace-pre-wrap text-xs leading-relaxed text-zinc-100">
                      {answer.user_answer || "(Thí sinh bỏ trống câu này)"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 p-4">
                    <div className="mb-1.5 flex items-center gap-2 text-emerald-300">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold">
                        Đánh giá & Nhận xét chi tiết (Gemini AI & Giảng viên)
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-200">
                      {answer.admin_feedback ||
                        "Chưa có nhận xét chi tiết hoặc bài thi đang trong quá trình chấm."}
                    </p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
