"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSubmissionById, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import {
  CheckCircle2,
  ArrowRight,
  History,
  Award,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function ExamResultClient({ examId: _examId }: { examId: string }) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const shouldReduceMotion = useReducedMotion();

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
        const user = getCurrentUser();
        // Bảo vệ quyền riêng tư: Nếu không phải admin và bài nộp không phải của user thì không hiển thị
        if (data && user && user.role !== "admin" && data.user_id && data.user_id !== user.id) {
          setSubmission(null);
          return;
        }
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg rounded-3xl border border-[#252A37] bg-[#161A24] p-6 sm:p-8 text-center shadow-2xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#252A37] bg-[#10131B] text-emerald-400">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Nộp bài & Chấm điểm thành công!
        </h1>
        <p className="mt-1 text-xs text-[#9CA3AF]">
          {submission?.exam?.title || "Bài thi thử trực tuyến"}
        </p>

        {/* Summary Status Banner */}
        <div className="mt-4 rounded-full border border-[#2A2F3C] bg-[#232836] px-4 py-2 text-xs font-mono font-semibold text-white">
          Trắc nghiệm: {submission?.mcq_score ?? 0} đ - Tự luận:{" "}
          {essayQuestions.length === 0
            ? "0 đ"
            : isGraded && submission?.essay_score !== null
            ? `${submission?.essay_score} đ`
            : "Đang chờ chấm"}
        </div>

        {/* Instant Score Breakdown Cards */}
        <div className="my-6 space-y-3 text-left">
          {/* MCQ Score Card */}
          <div className="flex items-center justify-between rounded-2xl border border-[#252A37] bg-[#10131B] p-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Điểm trắc nghiệm (Tự động)</p>
                <p className="text-[11px] text-[#9CA3AF]">Đã chấm theo đáp án chuẩn</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-lg font-extrabold text-emerald-400">
                {submission?.mcq_score ?? 0}
              </span>
              <span className="text-xs text-[#9CA3AF]"> / {maxMcqScore} đ</span>
            </div>
          </div>

          {/* Essay Score Card */}
          {essayQuestions.length > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-[#252A37] bg-[#10131B] p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-white" />
                <div>
                  <p className="text-xs font-bold text-white">Điểm tự luận</p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {isGraded ? "Đã hoàn tất chấm điểm" : "Đang chờ chấm"}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-extrabold text-white">
                  {submission?.essay_score !== null ? submission?.essay_score : "Chờ chấm"}
                </span>
                {submission?.essay_score !== null && (
                  <span className="text-xs text-[#9CA3AF]"> / {maxEssayScore} đ</span>
                )}
              </div>
            </div>
          )}

          {/* Total Score Highlight */}
          <div className="flex items-center justify-between rounded-2xl border border-[#252A37] bg-[#141824] p-4 text-white">
            <div>
              <p className="text-xs font-bold text-white">Tổng điểm kết quả</p>
              <p className="text-[11px] text-[#9CA3AF]">Trắc nghiệm + Tự luận</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-2xl font-black text-white">
                {submission?.total_score ?? 0}
              </span>
              <span className="text-xs text-[#9CA3AF]"> / {maxTotalScore} điểm</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/history"
            className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#10131B] border border-[#2A2F3C] px-5 text-xs font-semibold text-white transition hover:bg-[#161A24]"
          >
            <History className="h-4 w-4 text-white" />
            <span>Danh sách bài đã làm</span>
          </Link>

          {submissionId && (
            <Link
              href={`/history/${submissionId}`}
              className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-200 px-6 text-xs font-bold text-[#05070D] shadow-lg transition active:scale-[0.98]"
            >
              <span>Xem chi tiết & Nhận xét</span>
              <ArrowRight className="h-3.5 w-3.5 text-black" />
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
