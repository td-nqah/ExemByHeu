"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSubmissionById } from "@/lib/store";
import { Submission } from "@/types/exam";
import {
  CheckCircle2,
  ArrowRight,
  History,
  FileText,
  Award,
  Sparkles,
} from "lucide-react";

export function ExamResultClient({ examId }: { examId: string }) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResult() {
      if (!submissionId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getSubmissionById(submissionId);
        setSubmission(data);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent dark:border-zinc-100" />
      </div>
    );
  }

  const mcqQuestions = submission?.exam?.questions?.filter((q) => q.type === "multiple_choice") || [];
  const essayQuestions = submission?.exam?.questions?.filter((q) => q.type === "essay") || [];
  const maxMcqScore = mcqQuestions.reduce((acc, q) => acc + Number(q.max_score), 0);
  const maxEssayScore = essayQuestions.reduce((acc, q) => acc + Number(q.max_score), 0);
  const maxTotalScore = maxMcqScore + maxEssayScore;
  const isGraded = submission?.status === "graded";

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-4 shadow-xs">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          Nộp bài & Chấm điểm thành công!
        </h1>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {submission?.exam?.title || "Bài kiểm tra trực tuyến"}
        </p>

        {/* Instant Score Breakdown Cards */}
        <div className="my-6 space-y-3 text-left">
          {/* MCQ Score Card */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Điểm trắc nghiệm (Tự động)</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Đã chấm theo đáp án chuẩn</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                {submission?.mcq_score ?? 0}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400"> / {maxMcqScore} đ</span>
            </div>
          </div>

          {/* Essay Score Card */}
          {essayQuestions.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/60 dark:bg-purple-950/30">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-purple-700 dark:text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Điểm tự luận (Gemini AI chấm ngay)</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {isGraded ? "Đã chấm xong thang điểm 5 chuẩn" : "Đang xử lý"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-purple-700 dark:text-purple-400">
                  {submission?.essay_score ?? 0}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400"> / {maxEssayScore} đ</span>
              </div>
            </div>
          )}

          {/* Total Score Highlight */}
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-900 p-4 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
            <div>
              <p className="text-xs font-semibold opacity-90">Tổng điểm kết quả</p>
              <p className="text-[11px] opacity-70">Trắc nghiệm + Tự luận</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">
                {submission?.total_score ?? 0}
              </span>
              <span className="text-xs opacity-80"> / {maxTotalScore} điểm</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/history"
            className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <History className="h-4 w-4" />
            <span>Danh sách bài thi đã làm</span>
          </Link>

          {submissionId && (
            <Link
              href={`/history/${submissionId}`}
              className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <span>Xem chi tiết & Lời phê của AI</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
