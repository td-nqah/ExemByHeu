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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Lịch sử Đánh giá Học phần
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Lưu trữ 20 bài đánh giá gần nhất theo cơ chế xoay vòng dữ liệu, kèm điểm số và nhận xét học vụ chi tiết.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2.5 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all sm:self-auto"
        >
          <BookOpen className="h-4 w-4" />
          <span>Thực hiện bài đánh giá mới</span>
        </Link>
      </motion.div>

      {/* History Table / Card List */}
      {loading ? (
        <div className="obsidian-card flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-slate-400">Đang tải lịch sử đánh giá...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="obsidian-card flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center">
          <History className="mb-3 h-10 w-10 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Chưa có dữ liệu bài đánh giá
          </h3>
          <p className="mt-1 mb-4 max-w-sm text-xs text-slate-400">
            Vui lòng chọn bài đánh giá học phần tại danh mục để bắt đầu.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
          >
            <span>Đến ngân hàng đề đánh giá</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="obsidian-card overflow-hidden rounded-2xl"
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-indigo-950/50 text-slate-300 uppercase tracking-wider text-xs border-b border-indigo-500/20">
                <tr>
                  <th className="py-3.5 px-3 font-semibold w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3.5 px-4 font-semibold">Thời gian nộp</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm trắc nghiệm</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm tự luận</th>
                  <th className="py-3.5 px-4 font-semibold">Tổng điểm</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
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
                      className="group border-b border-white/5 hover:bg-indigo-950/20 transition-colors"
                    >
                      <td className="py-4 px-3 text-center font-bold font-heading text-indigo-400 text-xs">
                        #{idx + 1}
                      </td>
                      <td className="max-w-xs truncate py-4 px-4 font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                            <Clock className="h-3 w-3" />
                            Đang chờ chấm
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-200">
                        {sub.mcq_score}
                        {maxMcq > 0 ? ` / ${maxMcq}` : ""} điểm
                      </td>
                      <td className="py-4 px-4 text-slate-300">
                        {sub.essay_score !== null
                          ? `${sub.essay_score}${maxEssay > 0 ? ` / ${maxEssay}` : ""} điểm`
                          : "Đang chờ chấm"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-extrabold text-indigo-400">
                          {sub.total_score}
                          {maxTotal > 0 ? ` / ${maxTotal}` : ""} điểm
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-right">
                        <Link
                          href={`/history/${sub.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 text-slate-300 px-3 py-1.5 text-xs font-semibold transition"
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-based List View (< 768px) */}
          <div className="md:hidden divide-y divide-white/10">
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
                <div key={sub.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold font-heading text-indigo-400 mr-1.5">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white inline">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </h4>
                    </div>
                    {isGraded ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 text-[10px] font-semibold">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                        <Clock className="h-2.5 w-2.5" />
                        Chờ chấm
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3 w-3 text-indigo-400" />
                    <span>{formatDate(sub.submitted_at)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-900/60 border border-white/5 p-2.5 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Trắc nghiệm</p>
                      <p className="font-bold text-white text-xs">{sub.mcq_score}{maxMcq > 0 ? `/${maxMcq}` : ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Tự luận</p>
                      <p className="font-bold text-white text-xs">{sub.essay_score !== null ? `${sub.essay_score}${maxEssay > 0 ? `/${maxEssay}` : ""}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Tổng điểm</p>
                      <p className="font-bold text-indigo-400 text-xs">{sub.total_score}{maxTotal > 0 ? `/${maxTotal}` : ""}</p>
                    </div>
                  </div>

                  <Link
                    href={`/history/${sub.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800/90 hover:bg-indigo-600 hover:text-white border border-slate-700/60 text-slate-200 py-2 text-xs font-semibold transition"
                  >
                    <span>Xem chi tiết bài làm</span>
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                  </Link>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
