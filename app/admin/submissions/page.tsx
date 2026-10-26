"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSubmissions, getCurrentUser } from "@/lib/store";
import { Submission } from "@/types/exam";
import { formatDate, cn } from "@/lib/utils";
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
        <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/40 leading-tight">
          Quản lý Bài nộp & Đánh giá Học phần
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
          Theo dõi bài nộp của sinh viên, xác nhận điểm trắc nghiệm và đánh giá tự luận (hệ thống lưu trữ 20 bài nộp gần nhất).
        </p>
      </div>

      {/* Submissions Table with Filter */}
      <div className="rounded-3xl border border-[#252A37] bg-[#161A24] overflow-hidden shadow-xl">
        {/* Table Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#252A37] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white">
              Danh sách Bài nộp Đánh giá
            </h2>
            <span className="rounded-full bg-[#10131B] border border-[#252A37] px-3 py-0.5 text-xs font-semibold tabular-nums text-white">
              {filteredSubmissions.length} / 20
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-[#10131B] p-1 rounded-full border border-[#252A37]">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === "all"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-[#8B93A5] hover:text-white"
              }`}
            >
              Tất cả ({submissions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("pending_grading")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === "pending_grading"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-[#8B93A5] hover:text-white"
              }`}
            >
              Chờ đánh giá ({submissions.filter((s) => s.status === "pending_grading").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("graded")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === "graded"
                  ? "bg-white text-black shadow-sm font-bold"
                  : "text-[#8B93A5] hover:text-white"
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10131B] border border-[#252A37] text-white mx-auto">
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
              <thead className="bg-[#10131B] text-[#8B93A5] uppercase tracking-wide text-xs font-heading font-bold border-b border-[#252A37]">
                <tr>
                  <th className="py-3.5 px-3 font-bold w-12 text-center">#</th>
                  <th className="py-3.5 px-4 font-bold">Sinh viên</th>
                  <th className="py-3.5 px-4 font-bold">Đề đánh giá</th>
                  <th className="py-3.5 px-4 font-bold">Thời gian nộp</th>
                  <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-bold">Điểm trắc nghiệm</th>
                  <th className="py-3.5 px-4 font-bold">Điểm tự luận</th>
                  <th className="py-3.5 px-4 font-bold">Tổng điểm</th>
                  <th className="py-3.5 px-4 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A37]">
                {filteredSubmissions.map((sub, idx) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-[#141824]" : "bg-[#161A24]",
                        "hover:bg-[#191E2B]"
                      )}
                    >
                      <td className="py-3.5 px-3 text-center font-bold tabular-nums text-[#8B93A5] text-xs">
                        #{idx + 1}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-white" />
                          {sub.user?.username || "Sinh viên"}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-3.5 px-4 font-medium text-slate-200">
                        {sub.exam?.title || "Đề đánh giá"}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-[#9CA3AF] tabular-nums">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#8B93A5]" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#232836] text-[#E5E7EB] border border-[#2A2F3C] px-3 py-0.5 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Đã hoàn tất đánh giá
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#232836] text-[#E5E7EB] border border-[#2A2F3C] px-3 py-0.5 text-[11px] font-semibold">
                            <Clock className="h-3 w-3 text-amber-400" />
                            Chờ đánh giá tự luận
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200 tabular-nums">
                        {sub.mcq_score} điểm
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 tabular-nums">
                        {sub.essay_score !== null ? `${sub.essay_score} điểm` : "Chờ đánh giá"}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-bold text-white tabular-nums">
                        {sub.total_score} điểm
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm",
                            isGraded
                              ? "bg-[#10131B] hover:bg-[#161A24] text-white border border-[#2A2F3C]"
                              : "bg-white hover:bg-slate-200 text-[#05070D]"
                          )}
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
