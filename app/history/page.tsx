"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export default function HistoryPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    async function loadHistory() {
      try {
        const data = await getSubmissions(user?.id);
        setSubmissions(data);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [router]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Lịch sử Đánh giá Học phần
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Lưu trữ 20 bài đánh giá gần nhất theo cơ chế xoay vòng dữ liệu, kèm điểm số và nhận xét học vụ chi tiết.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-full bg-white hover:bg-zinc-200 active:bg-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors shadow-sm sm:self-auto"
        >
          <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Thực hiện bài đánh giá mới</span>
        </Link>
      </motion.div>

      {/* History Table / Card List */}
      {loading ? (
        <div className="bg-[#18191E] border border-white/[0.06] flex h-48 items-center justify-center rounded-2xl">
          <p className="text-xs text-zinc-400">Đang tải lịch sử đánh giá...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-[#18191E] border border-white/[0.06] flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center">
          <div className="h-11 w-11 rounded-xl bg-[#111215] border border-white/[0.08] flex items-center justify-center text-zinc-400 mb-3">
            <History className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-white">
            Chưa có dữ liệu bài đánh giá
          </h3>
          <p className="mt-1 mb-4 max-w-sm text-xs text-zinc-400">
            Vui lòng chọn bài đánh giá học phần tại danh mục để bắt đầu.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors shadow-sm"
          >
            <span>Đến ngân hàng đề thi</span>
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      ) : (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="bg-[#18191E] border border-white/[0.06] hover:border-zinc-700 transition-colors overflow-hidden rounded-2xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111215] text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                <tr>
                  <th className="py-3 px-3 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3 px-4 font-semibold">Thời gian nộp</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold">Điểm trắc nghiệm</th>
                  <th className="py-3 px-4 font-semibold">Điểm tự luận</th>
                  <th className="py-3 px-4 font-semibold">Tổng điểm</th>
                  <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {submissions.map((sub, idx) => {
                  const isGraded = sub.status === "graded";
                  const examQuestions = sub.exam?.questions || [];
                  const maxMcq =
                    Math.round(
                      examQuestions
                        .filter((q) => q.type === "multiple_choice")
                        .reduce((s, q) => s + Number(q.max_score || 0), 0) * 100
                    ) / 100;
                  const maxEssay =
                    Math.round(
                      examQuestions
                        .filter((q) => q.type === "essay")
                        .reduce((s, q) => s + Number(q.max_score || 0), 0) * 100
                    ) / 100;
                  const maxTotal = Math.round((maxMcq + maxEssay) * 100) / 100;

                  return (
                    <tr
                      key={sub.id}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-3 text-center font-mono font-medium text-zinc-400">
                        #{idx + 1}
                      </td>
                      <td className="max-w-xs truncate py-3.5 px-4 font-semibold text-white group-hover:text-zinc-200 transition-colors">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-zinc-400 font-mono">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400">
                            <Clock className="h-3 w-3" strokeWidth={1.5} />
                            Đang chờ chấm
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {sub.mcq_score}
                        {maxMcq > 0 ? ` / ${maxMcq}` : ""} điểm
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        {sub.essay_score !== null
                          ? `${sub.essay_score}${maxEssay > 0 ? ` / ${maxEssay}` : ""} điểm`
                          : "Đang chờ chấm"}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-xs font-bold text-white">
                          {sub.total_score}
                          {maxTotal > 0 ? ` / ${maxTotal}` : ""} điểm
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/history/${sub.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#111215] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/[0.06] px-3 py-1.5 text-xs font-medium transition-colors"
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
