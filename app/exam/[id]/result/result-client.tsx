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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
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
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Nộp bài & Chấm điểm thành công!
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          {submission?.exam?.title || "Bài thi thử trực tuyến"}
        </p>

        {/* Instant Score Breakdown Cards */}
        <div className="my-6 space-y-3 text-left">
          {/* MCQ Score Card */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/35 p-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Điểm trắc nghiệm (Tự động)</p>
                <p className="text-[11px] text-zinc-400">Đã chấm theo đáp án chuẩn</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-400">
                {submission?.mcq_score ?? 0}
              </span>
              <span className="text-xs text-zinc-400"> / {maxMcqScore} đ</span>
            </div>
          </div>

          {/* Essay Score Card */}
          {essayQuestions.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-white/15 bg-zinc-900/65 p-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">Điểm tự luận (Gemini AI chấm ngay)</p>
                  <p className="text-[11px] text-zinc-400">
                    {isGraded ? "Đã chấm xong thang điểm 5 chuẩn" : "Đang xử lý"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-emerald-300">
                  {submission?.essay_score ?? 0}
                </span>
                <span className="text-xs text-zinc-400"> / {maxEssayScore} đ</span>
              </div>
            </div>
          )}

          {/* Total Score Highlight */}
          <div className="flex items-center justify-between rounded-xl border border-emerald-400/40 bg-emerald-500/20 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <div>
              <p className="text-xs font-bold text-white">Tổng điểm kết quả</p>
              <p className="text-[11px] text-emerald-200/80">Trắc nghiệm + Tự luận</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-300">
                {submission?.total_score ?? 0}
              </span>
              <span className="text-xs text-zinc-300"> / {maxTotalScore} điểm</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/history"
            className="glass-pill flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
          >
            <History className="h-4 w-4" />
            <span>Danh sách bài đã làm</span>
          </Link>

          {submissionId && (
            <Link
              href={`/history/${submissionId}`}
              className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-6 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              <span>Xem chi tiết & Lời phê AI</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
