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
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">
            Lịch sử Đánh giá Học phần
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Lưu trữ 20 bài đánh giá gần nhất theo cơ chế xoay vòng dữ liệu, kèm điểm số và nhận xét học vụ chi tiết.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-xl glass-btn px-4 py-2.5 text-xs font-semibold cursor-pointer hover:-translate-y-0.5 transition-all sm:self-auto"
        >
          <BookOpen className="h-4 w-4" />
          <span>Thực hiện bài đánh giá mới</span>
        </Link>
      </motion.div>

      {/* History Table / Card List */}
      {loading ? (
        <div className="bg-white border border-black/[0.06] shadow-sm flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-[#6B7280]">Đang tải lịch sử đánh giá...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white border border-black/[0.06] flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center shadow-sm text-[#111827]">
          <History className="mb-3 h-10 w-10 text-[#111827]" />
          <h3 className="text-base font-bold text-[#111827]">
            Chưa có dữ liệu bài đánh giá
          </h3>
          <p className="mt-1 mb-4 max-w-sm text-xs text-[#6B7280]">
            Vui lòng chọn bài đánh giá học phần tại danh mục để bắt đầu.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl glass-btn px-4 py-2 text-xs font-semibold cursor-pointer hover:-translate-y-0.5 transition-all"
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
          className="bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] overflow-hidden rounded-2xl transition-all"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F6F8] text-slate-700 uppercase tracking-tight text-[11px] font-heading font-bold border-b border-black/[0.06]">
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
                      className="group border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="py-4 px-3 text-center font-mono font-bold text-[#6B7280]">
                        #{idx + 1}
                      </td>
                      <td className="max-w-xs truncate py-4 px-4 font-semibold text-[#111827] group-hover:text-[#111827] transition-colors">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-[#6B7280]">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#111827]" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#111827] text-white px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold shadow-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-black/[0.04] text-[#6B7280] px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold">
                            <Clock className="h-3 w-3" />
                            Đang chờ chấm
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#111827]">
                        {sub.mcq_score}
                        {maxMcq > 0 ? ` / ${maxMcq}` : ""} điểm
                      </td>
                      <td className="py-4 px-4 text-[#6B7280]">
                        {sub.essay_score !== null
                          ? `${sub.essay_score}${maxEssay > 0 ? ` / ${maxEssay}` : ""} điểm`
                          : "Đang chờ chấm"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-extrabold text-[#111827]">
                          {sub.total_score}
                          {maxTotal > 0 ? ` / ${maxTotal}` : ""} điểm
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-right">
                        <Link
                          href={`/history/${sub.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl glass-btn text-[#111827] px-3 py-1.5 text-xs font-semibold hover:-translate-y-0.5 transition-all"
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
        </motion.div>
      )}
    </div>
  );
}
