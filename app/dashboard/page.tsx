"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExams, getSubmissions, getCurrentUser } from "@/lib/store";
import { Exam, Submission } from "@/types/exam";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  BookOpen,
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  FileText,
  Calendar,
} from "lucide-react";

export default function UserDashboardPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [examData, subData] = await Promise.all([
          getExams(true), // only published exams
          getSubmissions(user?.id),
        ]);
        setExams(examData);
        setSubmissions(subData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner / Welcome */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-zinc-50">
            Kỳ thi Khả dụng
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Chọn đề thi bên dưới để bắt đầu làm bài. Hệ thống sẽ tự động kích hoạt đồng hồ đếm ngược.
          </p>
        </div>

        <Link
          href="/history"
          className="inline-flex items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Xem Lịch sử bài đã nộp ({submissions.length})</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Đề thi đang mở</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{exams.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Bài đã hoàn thành</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{submissions.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Chờ giáo viên chấm</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {submissions.filter((s) => s.status === "pending_grading").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Exams Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">Đang tải danh sách đề thi...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-12 px-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <BookOpen className="h-10 w-10 text-zinc-400 mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Chưa có đề thi nào được xuất bản</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
            Vui lòng đăng nhập với quyền Quản trị viên để tải lên hoặc tạo đề thi mới từ tệp Word, Excel hoặc PDF.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const questionCount = exam.questions?.length || 0;
            const mcqCount = exam.questions?.filter((q) => q.type === "multiple_choice").length || 0;
            const essayCount = exam.questions?.filter((q) => q.type === "essay").length || 0;

            return (
              <div
                key={exam.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div>
                  {/* Tags */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <Clock className="h-3 w-3" />
                      {formatDuration(exam.duration_minutes)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <HelpCircle className="h-3 w-3" />
                      {questionCount} câu hỏi
                    </span>
                  </div>

                  <h3 className="text-base font-bold leading-snug text-zinc-900 dark:text-zinc-100">
                    {exam.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 line-clamp-3 dark:text-zinc-400">
                    {exam.description || "Bài thi đánh giá năng lực toàn diện."}
                  </p>

                  {/* Question Composition */}
                  <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <span>{mcqCount} trắc nghiệm</span>
                    <span>•</span>
                    <span>{essayCount} tự luận</span>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(exam.created_at)}
                  </span>

                  <Link
                    href={`/exam/${exam.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    <span>Vào làm bài</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
