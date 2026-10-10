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
  Filter,
  User,
  Award,
} from "lucide-react";

export default function AdminSubmissionsListPage() {
  const router = useRouter();
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

  // Aggregate stats per exam
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Quản lý Bài nộp & Phòng Chấm thi
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Theo dõi danh sách thí sinh đã nộp bài, kiểm tra điểm trắc nghiệm và chấm điểm các câu hỏi tự luận.
          </p>
        </div>
      </div>

      {/* 1. Exam Summary Grid (Takers & Pending count per exam) */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-3">
          Thống kê theo từng Đề thi
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examStats.map(({ exam, totalTakers, pendingCount }) => (
            <div
              key={exam.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {exam.status === "published" ? "Đang mở" : "Bản nháp"}
                </span>
              </div>

              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-3">
                {exam.title}
              </h3>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Tổng lượt thi: <strong className="text-zinc-900 dark:text-zinc-100">{totalTakers}</strong>
                </span>

                {pendingCount > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    {pendingCount} bài chờ chấm
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Đã chấm xong
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Submissions Table with Filter */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Danh sách Bài làm cần chấm
            </h2>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {filteredSubmissions.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                filterStatus === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending_grading")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                filterStatus === "pending_grading"
                  ? "bg-amber-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Chờ chấm ({submissions.filter((s) => s.status === "pending_grading").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("graded")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                filterStatus === "graded"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              Đã hoàn thành ({submissions.filter((s) => s.status === "graded").length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-zinc-500">Đang tải dữ liệu bài làm...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Không có bài nộp nào phù hợp với bộ lọc
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider text-[10px] dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Thí sinh</th>
                  <th className="py-3.5 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3.5 px-4 font-semibold">Thời gian nộp</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm trắc nghiệm</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm tự luận</th>
                  <th className="py-3.5 px-4 font-semibold">Tổng điểm</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Chấm thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filteredSubmissions.map((sub) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                    >
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          {sub.user?.username || "Thí sinh"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-800 dark:text-zinc-200 max-w-xs truncate">
                        {sub.exam?.title || "Đề thi"}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã chấm xong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            Chờ chấm tự luận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                        {sub.mcq_score} điểm
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {sub.essay_score !== null ? `${sub.essay_score} điểm` : "Chưa chấm"}
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm text-zinc-950 dark:text-zinc-100">
                        {sub.total_score} điểm
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
                            isGraded
                              ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                              : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
      </div>
    </div>
  );
}
