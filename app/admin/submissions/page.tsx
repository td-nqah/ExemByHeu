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
          Quản lý Bài nộp & Đánh giá Học phần
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF]">
          Theo dõi bài nộp của sinh viên, xác nhận điểm trắc nghiệm và đánh giá tự luận (hệ thống lưu trữ 20 bài nộp gần nhất).
        </p>
      </div>

      {/* Submissions Table with Filter */}
      <div className="bg-white dark:bg-[#121318] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.4)] rounded-2xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white">
              Danh sách Bài nộp Đánh giá
            </h2>
            <span className="rounded-md bg-[#F6F6F8] dark:bg-[#14161D] border border-black/[0.06] px-2 py-0.5 text-xs font-semibold text-white">
              {filteredSubmissions.length} / 20
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F6F6F8] dark:bg-[#14161D] p-1 rounded-xl border border-black/[0.06]">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "glass-btn text-white font-semibold shadow-xs"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending_grading")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === "pending_grading"
                  ? "glass-btn text-white font-semibold shadow-xs"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              Chờ đánh giá ({submissions.filter((s) => s.status === "pending_grading").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("graded")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === "graded"
                  ? "glass-btn text-white font-semibold shadow-xs"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              Đã hoàn tất đánh giá ({submissions.filter((s) => s.status === "graded").length})
            </button>
          </div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-[#9CA3AF]">Đang tải dữ liệu bài nộp...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6F6F8] dark:bg-[#14161D] border border-black/[0.08] text-white mx-auto">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Chưa có bài nộp nào
            </p>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
              Khi sinh viên hoàn thành bài đánh giá, dữ liệu sẽ tự động hiển thị tại đây để Giảng viên đánh giá và ghi nhận điểm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F6F6F8] dark:bg-[#0E0F14] text-[#9CA3AF] uppercase tracking-tight text-[11px] font-heading font-bold border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-3 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">Sinh viên</th>
                  <th className="py-3 px-4 font-semibold">Đề đánh giá</th>
                  <th className="py-3 px-4 font-semibold">Thời gian nộp</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold">Điểm trắc nghiệm</th>
                  <th className="py-3 px-4 font-semibold">Điểm tự luận</th>
                  <th className="py-3 px-4 font-semibold">Tổng điểm</th>
                  <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredSubmissions.map((sub, idx) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-white">
                        #{idx + 1}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-white" />
                          {sub.user?.username || "Sinh viên"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-3.5 px-4 font-medium text-white">
                        {sub.exam?.title || "Đề đánh giá"}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-[#9CA3AF]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="text-xs font-semibold text-white">
                            Đã hoàn tất đánh giá
                          </span>
                        ) : (
                          <span className="text-xs text-[#9CA3AF]">
                            Chờ đánh giá tự luận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {sub.mcq_score} điểm
                      </td>
                      <td className="py-3.5 px-4 text-white">
                        {sub.essay_score !== null ? `${sub.essay_score} điểm` : "Chờ đánh giá"}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-bold text-white">
                        {sub.total_score} điểm
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                            isGraded
                              ? "bg-[#1f2637] hover:bg-[#283248] text-white border border-white/[0.06]"
                              : "bg-[#4f57ea] hover:bg-[#434ac9] text-white shadow-sm"
                          }`}
                        >
                          <span>{isGraded ? "Xem lại & Cập nhật điểm" : "Đánh giá bài làm"}</span>
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
