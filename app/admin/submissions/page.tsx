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
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quản lý Bài nộp & Phòng Chấm thi
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Theo dõi danh sách thí sinh đã nộp bài thi thử, kiểm tra điểm trắc nghiệm và chấm điểm tự luận.
          </p>
        </div>
      </div>

      {/* 1. Exam Summary Grid */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-zinc-300">
          Thống kê theo từng Đề thi thử
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examStats.map(({ exam, totalTakers, pendingCount }) => (
            <div
              key={exam.id}
              className="glass-card rounded-2xl p-5"
            >
              <div className="mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-400">
                  {exam.status === "published" ? "Đang mở" : "Bản nháp"}
                </span>
              </div>

              <h3 className="mb-3 line-clamp-1 text-sm font-bold text-white">
                {exam.title}
              </h3>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="text-zinc-400">
                  Tổng lượt thi: <strong className="text-white">{totalTakers}</strong>
                </span>

                {pendingCount > 0 ? (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    {pendingCount} bài chờ chấm
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    Đã chấm xong
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Submissions Table with Filter */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Danh sách Bài làm
            </h2>
            <span className="glass-pill rounded-md px-2 py-0.5 text-xs font-semibold text-zinc-300">
              {filteredSubmissions.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === "all"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending_grading")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === "pending_grading"
                  ? "bg-amber-400 text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Chờ chấm ({submissions.filter((s) => s.status === "pending_grading").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("graded")}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterStatus === "graded"
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Đã hoàn thành ({submissions.filter((s) => s.status === "graded").length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-zinc-400">Đang tải dữ liệu bài làm...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-300">
              Không có bài nộp nào phù hợp với bộ lọc
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-400">
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
              <tbody className="divide-y divide-white/10">
                {filteredSubmissions.map((sub) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className="transition hover:bg-white/[0.04]"
                    >
                      <td className="whitespace-nowrap py-3.5 px-4 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-emerald-400" />
                          {sub.user?.username || "Thí sinh"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-3.5 px-4 text-zinc-200">
                        {sub.exam?.title || "Đề thi"}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã chấm xong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                            <Clock className="h-3 w-3" />
                            Chờ chấm tự luận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-200">
                        {sub.mcq_score} điểm
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        {sub.essay_score !== null ? `${sub.essay_score} điểm` : "Chưa chấm"}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-black text-emerald-400">
                        {sub.total_score} điểm
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                            isGraded
                              ? "glass-pill text-zinc-200 hover:bg-white/10 hover:text-white"
                              : "border border-emerald-400/40 bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400"
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
