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
  X,
  FileText,
  Calendar,
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
          getExams(false), // get all exams (draft + published)
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Quản trị Khảo thí
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Tổng quan hệ thống, quản lý đề thi, nhập dữ liệu từ file và điều phối chấm bài.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Phòng Chấm thi ({pendingGradingCount} bài chờ)</span>
          </Link>

          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tổng số đề thi</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{exams.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Đã xuất bản</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{publishedCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Lượt nộp bài</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{submissions.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Chờ chấm tự luận</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{pendingGradingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Exams Management Table */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Danh sách Đề thi trong hệ thống
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {exams.length} đề thi
          </span>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-zinc-500">Đang tải dữ liệu...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Chưa có đề thi nào</p>
            <Link
              href="/admin/exams/create"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo đề thi đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 uppercase tracking-wider text-[10px] dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3 px-4 font-semibold">Thời lượng</th>
                  <th className="py-3 px-4 font-semibold">Số câu hỏi</th>
                  <th className="py-3 px-4 font-semibold">Ngày tạo</th>
                  <th className="py-3 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {exams.map((exam) => {
                  const isPublished = exam.status === "published";
                  const questionCount = exam.questions?.length || 0;

                  return (
                    <tr
                      key={exam.id}
                      className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                    >
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100 max-w-sm truncate">
                        {exam.title}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDuration(exam.duration_minutes)}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {questionCount} câu
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(exam.created_at)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exam.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
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
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/exam/${exam.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          title="Xem trước phòng thi"
                        >
                          <Eye className="h-3 w-3" />
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
