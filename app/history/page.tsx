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

export default function HistoryPage() {
  const router = useRouter();
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Lịch sử Làm bài
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Xem lại tất cả các bài thi thử đã tham gia, điểm số chi tiết và nhận xét từ AI & giảng viên.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-emerald-400/40 bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98]"
        >
          <BookOpen className="h-4 w-4" />
          <span>Làm bài thi mới</span>
        </Link>
      </div>

      {/* History Table / Card List */}
      {loading ? (
        <div className="glass-card flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-zinc-400">Đang tải lịch sử bài thi...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center">
          <History className="mb-3 h-10 w-10 text-zinc-500" />
          <h3 className="text-base font-bold text-white">
            Bạn chưa thực hiện bài thi thử nào
          </h3>
          <p className="mt-1 mb-4 max-w-sm text-xs text-zinc-400">
            Hãy bắt đầu bằng cách chọn một trong các đề thi thử khả dụng tại Bảng điều khiển.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400"
          >
            <span>Đến danh sách đề thi</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3.5 px-4 font-semibold">Thời gian nộp</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm trắc nghiệm</th>
                  <th className="py-3.5 px-4 font-semibold">Điểm tự luận</th>
                  <th className="py-3.5 px-4 font-semibold">Tổng điểm</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {submissions.map((sub) => {
                  const isGraded = sub.status === "graded";

                  return (
                    <tr
                      key={sub.id}
                      className="transition hover:bg-white/[0.04]"
                    >
                      <td className="max-w-xs truncate py-4 px-4 font-bold text-white">
                        {sub.exam?.title || "Đề thi thử trực tuyến"}
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(sub.submitted_at)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                            <Clock className="h-3 w-3" />
                            Đang chấm
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-semibold text-zinc-200">
                        {sub.mcq_score} điểm
                      </td>
                      <td className="py-4 px-4 text-zinc-300">
                        {sub.essay_score !== null ? `${sub.essay_score} điểm` : "Chờ chấm"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-extrabold text-emerald-400">
                          {sub.total_score} điểm
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-right">
                        <Link
                          href={`/history/${sub.id}`}
                          className="glass-pill inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
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
        </div>
      )}
    </div>
  );
}
