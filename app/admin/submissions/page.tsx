"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExams, getSubmissions, getCurrentUser } from "@/lib/store";
import { Exam, Submission } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  User,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export default function AdminSubmissionsListPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending_grading" | "graded">("all");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [allExams, allSubs] = await Promise.all([
          getExams(false),
          getSubmissions(),
        ]);
        setExams(allExams);
        setSubmissions(allSubs);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const examStats = exams.map((exam) => {
    const examSubs = submissions.filter((s) => s.exam_id === exam.id);
    const pendingCount = examSubs.filter((s) => s.status === "pending_grading").length;
    const gradedCount = examSubs.filter((s) => s.status === "graded").length;
    return {
      exam,
      totalTakers: examSubs.length,
      pendingCount,
      gradedCount,
    };
  });

  const filteredSubmissions = submissions.filter((sub) => {
    if (filterStatus === "all") return true;
    return sub.status === filterStatus;
  });

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
            Quản lý Bài nộp & Phòng Chấm thi
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Theo dõi danh sách thí sinh đã nộp bài thi thử, kiểm tra điểm trắc nghiệm và chấm điểm tự luận.
          </p>
        </div>
      </motion.div>

      {/* 1. Exam Summary Grid */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-300">
          Thống kê theo từng Đề thi thử
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examStats.map(({ exam, totalTakers, pendingCount }, idx) => (
            <motion.div
              key={exam.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 rounded-2xl p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {exam.status === "published" ? "Đang mở" : "Bản nháp"}
                </span>
              </div>

              <h3 className="mb-3 line-clamp-1 text-sm font-bold text-white">
                {exam.title}
              </h3>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                <span className="text-slate-400">
                  Tổng lượt thi: <strong className="text-white">{totalTakers}</strong>
                </span>

                {pendingCount > 0 ? (
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                    {pendingCount} bài chờ chấm
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 text-[11px] font-semibold">
                    Đã chấm xong
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. Submissions Table with Filter */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 overflow-hidden rounded-2xl shadow-xl"
      >
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Danh sách Bài làm
            </h2>
            <span className="rounded-md bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-xs font-semibold text-slate-300">
              {filteredSubmissions.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterStatus === "all"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending_grading")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterStatus === "pending_grading"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              Chờ chấm ({submissions.filter((s) => s.status === "pending_grading").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("graded")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filterStatus === "graded"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              Đã hoàn thành ({submissions.filter((s) => s.status === "graded").length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-slate-400">Đang tải dữ liệu bài làm...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-300">
              Không có bài nộp nào phù hợp với bộ lọc
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Thí sinh</th>
                  <th className="py-3.5 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3.5 px-4 font-semibold">Thời gian nộp</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm trắc nghiệm</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm tự luận</th>
                  <th className="py-3.5 px-4 font-semibold">Tổng điểm</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Chấm thi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className="group border-b border-slate-800/50 hover:bg-indigo-950/20 transition-colors"
                    >
                      <td className="whitespace-nowrap py-3.5 px-4 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                          {sub.user?.username || "Thí sinh"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-3.5 px-4 font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {sub.exam?.title || "Đề thi"}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-indigo-400" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2.5 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã chấm xong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                            <Clock className="h-3 w-3" />
                            Chờ chấm tự luận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {sub.mcq_score} điểm
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {sub.essay_score !== null ? `${sub.essay_score} điểm` : "Chưa chấm"}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-black text-indigo-400">
                        {sub.total_score} điểm
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                            isGraded
                              ? "bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 text-slate-300"
                              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                          }`}
                        >
                          <span>{isGraded ? "Xem & Sửa điểm" : "Chấm bài ngay"}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
