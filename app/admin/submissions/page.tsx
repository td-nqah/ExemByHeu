"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  User,
  Inbox,
} from "lucide-react";

export default function AdminSubmissionsListPage() {
  const router = useRouter();
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
        const allSubs = await getSubmissions();
        setSubmissions(allSubs);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const filteredSubmissions = submissions.filter((sub) => {
    if (filterStatus === "all") return true;
    return sub.status === filterStatus;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Quản lý Bài nộp & Phòng Chấm thi
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Theo dõi tối đa 10 bài nộp gần nhất của user, kiểm tra điểm trắc nghiệm và chấm điểm tự luận (tự động giữ 10 bài mới nhất).
        </p>
      </div>

      {/* Submissions Table with Filter */}
      <div className="bg-[#151b27] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white">
              Danh sách Bài làm
            </h2>
            <span className="rounded-md bg-[#1f2637] border border-white/[0.05] px-2 py-0.5 text-xs font-semibold text-slate-300">
              {filteredSubmissions.length} / 10
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-[#10141e] p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-[#4f57ea] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending_grading")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === "pending_grading"
                  ? "bg-[#4f57ea] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chờ chấm ({submissions.filter((s) => s.status === "pending_grading").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("graded")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === "graded"
                  ? "bg-[#4f57ea] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
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
          <div className="py-14 text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e2538] text-indigo-400 mx-auto">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Chưa có bài nộp nào
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Khi user hoàn thành và nộp bài thi, bài thi sẽ tự động xuất hiện tại đây để giám khảo chấm điểm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121722] text-slate-400 uppercase tracking-wider text-[11px] border-b border-white/[0.06]">
                <tr>
                  <th className="py-3 px-3 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">User</th>
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
                {filteredSubmissions.map((sub, idx) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-[#1a2130] transition-colors"
                    >
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-indigo-400">
                        #{idx + 1}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                          {sub.user?.username || "User"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-3.5 px-4 font-medium text-slate-200">
                        {sub.exam?.title || "Đề thi"}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã chấm xong
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold">
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
                      <td className="py-3.5 px-4 text-sm font-bold text-[#818cf8]">
                        {sub.total_score} điểm
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isGraded
                              ? "bg-[#1f2637] hover:bg-[#283248] text-slate-300 border border-white/[0.06]"
                              : "bg-[#4f57ea] hover:bg-[#434ac9] text-white shadow-sm"
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
