"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate, cn } from "@/lib/utils";
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
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/40 leading-tight">
            Lịch sử Đánh giá Học phần
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#9ca3af] max-w-xl leading-relaxed">
            Lưu trữ 20 bài đánh giá gần nhất theo cơ chế xoay vòng dữ liệu, kèm điểm số và nhận xét học vụ chi tiết.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-full bg-[#10131b]/80 border border-[#2a2f3c] hover:border-[#3b4252] hover:bg-[#161a24] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all sm:self-auto select-none"
        >
          <BookOpen className="h-4 w-4" />
          <span>Thực hiện bài đánh giá mới</span>
        </Link>
      </motion.div>

      {/* History Table / Card List */}
      <h2 className="sr-only">Danh sách lịch sử bài đánh giá</h2>
      {loading ? (
        <div className="bg-[#161a24] rounded-3xl border border-[#252a37] flex h-48 items-center justify-center">
          <p className="text-sm text-slate-400">Đang tải lịch sử đánh giá...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-[#161a24] rounded-3xl border border-[#252a37] flex flex-col items-center justify-center py-12 px-4 text-center">
          <History className="mb-3 h-10 w-10 text-[#8b93a5]" />
          <h3 className="text-base font-bold text-white">
            Chưa có dữ liệu bài đánh giá
          </h3>
          <p className="mt-1 mb-4 max-w-sm text-xs text-slate-400">
            Vui lòng chọn bài đánh giá học phần tại danh mục để bắt đầu.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-slate-100 text-black px-5 py-2 text-xs font-bold shadow-sm transition-all select-none"
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
          className="bg-[#161a24] rounded-3xl overflow-hidden border border-[#252a37] shadow-md"
        >
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#10131b] text-[#8b93a5] uppercase font-heading tracking-wide text-xs font-bold border-b border-[#252a37]">
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
                      className={cn(
                        "group border-b border-[#252a37] transition-colors",
                        idx % 2 === 0 ? "bg-[#141824]" : "bg-[#161a24]",
                        "hover:bg-[#191e2b]"
                      )}
                    >
                      <td className="py-4 px-3 text-center font-bold font-mono text-[#8b93a5] text-xs">
                        #{idx + 1}
                      </td>
                      <td className="max-w-xs truncate py-4 px-4 font-semibold text-white group-hover:text-slate-200 transition-colors">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-slate-400">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5 text-[#8b93a5]" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold select-none shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            Đang chờ chấm
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-slate-200">
                        {sub.mcq_score}
                        {maxMcq > 0 ? ` / ${maxMcq}` : ""} điểm
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300">
                        {sub.essay_score !== null
                          ? `${sub.essay_score}${maxEssay > 0 ? ` / ${maxEssay}` : ""} điểm`
                          : "Đang chờ chấm"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-extrabold text-white font-mono">
                          {sub.total_score}
                          {maxTotal > 0 ? ` / ${maxTotal}` : ""} điểm
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-right">
                        <Link
                          href={`/history/${sub.id}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#10131b] border border-[#252a37] hover:border-[#2a2f3c] text-white hover:bg-[#161a24] px-3.5 py-1.5 text-xs font-semibold transition"
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
          <div className="md:hidden divide-y divide-[#252a37]">
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
                      <span className="text-xs font-bold font-mono text-[#8b93a5] mr-1.5">
                        #{idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-white inline font-heading">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </h3>
                    </div>
                    {isGraded ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#232836] text-[#e2e8f0] border border-[#2a2f3c] px-2 py-0.5 text-xs font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9ca3af]" />
                        Hoàn thành
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[#252a37] bg-[#10131b] px-2 py-0.5 text-xs font-medium text-[#9ca3af]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
                        Chờ chấm
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Calendar className="h-3 w-3 text-[#8b93a5]" />
                    <span>{formatDate(sub.submitted_at)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#10131b] border border-[#252a37] p-2.5 text-center text-xs">
                    <div>
                      <p className="text-[10px] text-[#8b93a5] font-mono uppercase">Trắc nghiệm</p>
                      <p className="font-bold text-white font-mono text-xs">{sub.mcq_score}{maxMcq > 0 ? `/${maxMcq}` : ""}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8b93a5] font-mono uppercase">Tự luận</p>
                      <p className="font-bold text-white font-mono text-xs">{sub.essay_score !== null ? `${sub.essay_score}${maxEssay > 0 ? `/${maxEssay}` : ""}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#8b93a5] font-mono uppercase">Tổng điểm</p>
                      <p className="font-bold text-white font-mono text-xs">{sub.total_score}{maxTotal > 0 ? `/${maxTotal}` : ""}</p>
                    </div>
                  </div>

                  <Link
                    href={`/history/${sub.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white hover:bg-slate-100 text-black py-2.5 text-xs font-bold transition shadow-sm"
                  >
                    <span>Xem chi tiết bài làm</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
