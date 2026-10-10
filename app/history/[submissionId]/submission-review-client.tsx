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
  MessageSquare,
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center p-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Không tìm thấy bài làm
        </h2>
        <Link href="/history" className="mt-3 text-xs font-semibold text-zinc-700 underline">
          Quay lại Lịch sử làm bài
        </Link>
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại danh sách bài làm</span>
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Calendar className="h-3 w-3" />
                {formatDate(submission.submitted_at)}
              </span>
              {isGraded ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Đã hoàn thành chấm điểm
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <Clock className="h-3 w-3" />
                  Đang chờ chấm tự luận
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
              {submission.exam?.title || "Bài kiểm tra"}
            </h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Thí sinh: {submission.user?.username || "Thí sinh"}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Tổng điểm</p>
              <p className="text-2xl font-black text-zinc-950 dark:text-zinc-50">
                {submission.total_score}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
              <p>Trắc nghiệm: <span className="font-bold text-zinc-900 dark:text-zinc-100">{submission.mcq_score}</span></p>
              <p>Tự luận: <span className="font-bold text-zinc-900 dark:text-zinc-100">{submission.essay_score !== null ? submission.essay_score : "Chờ chấm"}</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
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
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {isMCQ ? "Trắc nghiệm" : "Tự luận"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isMCQ ? (
                    isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đúng (+{answer.score_awarded} / {q.max_score} điểm)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                        <XCircle className="h-3.5 w-3.5" />
                        Sai (0 / {q.max_score} điểm)
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <Award className="h-3.5 w-3.5" />
                      Điểm đạt: {answer.score_awarded} / {q.max_score} điểm
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100 mb-4 whitespace-pre-wrap">
                {q.content}
              </p>

              {isMCQ ? (
                <div className="space-y-2">
                  {q.options.map((optText, optIdx) => {
                    const letterMatch = optText.match(/^([A-D])[\.\:\)]/i);
                    const letter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + optIdx);
                    const isCandidateChoice = answer.user_answer.toUpperCase() === letter;
                    const isCorrectAnswer = q.correct_answer.toUpperCase() === letter;

                    let rowStyle = "border-zinc-200 bg-zinc-50/50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300";
                    if (isCorrectAnswer) {
                      rowStyle = "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200";
                    } else if (isCandidateChoice && !isCorrectAnswer) {
                      rowStyle = "border-red-300 bg-red-50/80 text-red-950 font-medium dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200";
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
                        <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold">
                          {isCandidateChoice && (
                            <span className="rounded-sm bg-zinc-800 text-white px-1.5 py-0.5 text-[10px] dark:bg-zinc-200 dark:text-zinc-900">
                              Lựa chọn của bạn
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="rounded-sm bg-emerald-600 text-white px-1.5 py-0.5 text-[10px]">
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
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                      Bài làm của thí sinh
                    </label>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-900 whitespace-pre-wrap dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-100">
                      {answer.user_answer || "(Thí sinh bỏ trống câu này)"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2 mb-1.5 text-blue-900 dark:text-blue-300">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold">Đánh giá & Nhận xét chi tiết (Gemini AI & Giảng viên)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-blue-950 dark:text-blue-200 whitespace-pre-wrap">
                      {answer.admin_feedback || "Chưa có nhận xét chi tiết hoặc bài thi đang trong quá trình chấm."}
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
