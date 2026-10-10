"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExams, getSubmissions, toggleExamStatus, getCurrentUser } from "@/lib/store";
import { Exam, Submission } from "@/types/exam";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  BookOpen,
  FilePlus2,
  CheckCircle2,
  Clock,
  Users,
  Eye,
  Check,
  Layers,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleToggleStatus = async (examId: string) => {
    const updated = await toggleExamStatus(examId);
    if (updated) {
      setExams((prev) => prev.map((e) => (e.id === examId ? updated : e)));
    }
  };

  const publishedCount = exams.filter((e) => e.status === "published").length;
  const pendingGradingCount = submissions.filter((s) => s.status === "pending_grading").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quản trị Thi thử Trực tuyến
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tổng quan hệ thống ExemTest, quản lý đề thi thử, bóc tách từ file và điều phối chấm bài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/submissions"
            className="glass-card-interactive inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-100"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Phòng Chấm thi ({pendingGradingCount} bài chờ)</span>
          </Link>

          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition hover:bg-emerald-400 active:scale-[0.98]"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-zinc-200">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Tổng số đề thi</p>
              <p className="text-xl font-bold text-white">{exams.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Đã xuất bản</p>
              <p className="text-xl font-bold text-white">{publishedCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Lượt nộp bài</p>
              <p className="text-xl font-bold text-white">{submissions.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/15 text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Chờ chấm tự luận</p>
              <p className="text-xl font-bold text-white">{pendingGradingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exams Management Table */}
      <div className="glass-panel overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-white">
            Danh sách Đề thi thử trong hệ thống
          </h2>
          <span className="text-xs text-zinc-400">
            {exams.length} đề thi
          </span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-zinc-400">Đang tải dữ liệu...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-zinc-500" />
            <p className="text-xs font-semibold text-zinc-300">Chưa có đề thi nào</p>
            <Link
              href="/admin/exams/create"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500 px-3.5 py-2 text-xs font-bold text-zinc-950"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo đề thi đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-zinc-950/50 text-[10px] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3.5 px-4 font-semibold">Thời lượng</th>
                  <th className="py-3.5 px-4 font-semibold">Số câu hỏi</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày tạo</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {exams.map((exam) => {
                  const isPublished = exam.status === "published";
                  const questionCount = exam.questions?.length || 0;

                  return (
                    <tr
                      key={exam.id}
                      className="transition hover:bg-white/[0.04]"
                    >
                      <td className="max-w-sm truncate py-3.5 px-4 font-bold text-white">
                        {exam.title}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-zinc-300">
                        {formatDuration(exam.duration_minutes)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        {questionCount} câu
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-zinc-400">
                        {formatDate(exam.created_at)}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exam.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                            isPublished
                              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              : "border-white/15 bg-white/5 text-zinc-400 hover:bg-white/10"
                          }`}
                          title="Bấm để bật/tắt xuất bản đề thi"
                        >
                          {isPublished ? (
                            <>
                              <Check className="h-3 w-3" />
                              Đang mở thi
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Bản nháp (Đóng)
                            </>
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <Link
                          href={`/exam/${exam.id}`}
                          className="glass-pill inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
                          title="Xem trước phòng thi"
                        >
                          <Eye className="h-3 w-3 text-emerald-400" />
                          Xem trước
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
