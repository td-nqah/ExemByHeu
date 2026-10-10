"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  getExams,
  getSubmissions,
  toggleExamStatus,
  deleteExam,
  getCurrentUser,
} from "@/lib/store";
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
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!examToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteExam(examToDelete.id);
      setExams((prev) => prev.filter((e) => e.id !== examToDelete.id));
      setSubmissions((prev) => prev.filter((s) => s.exam_id !== examToDelete.id));
      setExamToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const publishedCount = exams.filter((e) => e.status === "published").length;
  const pendingGradingCount = submissions.filter((s) => s.status === "pending_grading").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header (No "Tạo đề mới" button on top header; localized inside Exam Management table below) */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Quản trị Thi thử Trực tuyến
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Tổng quan hệ thống ExamTestByHeu, quản lý ngân hàng đề thi và điều phối chấm bài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/submissions"
            className="glass-card-interactive inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"
          >
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>Phòng Chấm thi ({pendingGradingCount} bài chờ)</span>
          </Link>
        </div>
      </motion.div>

      {/* Overview Metrics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { icon: Layers, label: "Tổng số đề thi", value: exams.length },
          { icon: BookOpen, label: "Đã xuất bản", value: publishedCount },
          { icon: Users, label: "Lượt nộp bài", value: submissions.length },
          { icon: Clock, label: "Chờ chấm tự luận", value: pendingGradingCount },
        ].map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-2xl p-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">{metric.label}</p>
                  <p className="text-xl font-bold text-white">{metric.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Exams Management Section (Localized Exam Creation & Cascading Delete) */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel overflow-hidden rounded-2xl"
      >
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-white">
              Quản lý Ngân hàng Đề thi ({exams.length})
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Xem trước cấu trúc đề, đóng/mở xuất bản hoặc xóa đề thi khỏi hệ thống.
            </p>
          </div>

          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 shadow-xs transition hover:bg-zinc-200 active:scale-[0.98] sm:self-auto"
          >
            <FilePlus2 className="h-4 w-4 text-zinc-950" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-zinc-400">Đang tải dữ liệu...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-300">Chưa có đề thi nào</p>
            <Link
              href="/admin/exams/create"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950"
            >
              <FilePlus2 className="h-3.5 w-3.5 text-zinc-950" />
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
                              ? "border-white/30 bg-white/15 text-white hover:bg-white/25"
                              : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                          }`}
                          title="Bấm để bật/tắt xuất bản đề thi"
                        >
                          {isPublished ? (
                            <>
                              <Check className="h-3 w-3 text-white" />
                              Đang mở thi
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-zinc-300" />
                              Bản nháp (Đóng)
                            </>
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/exams/preview?id=${exam.id}`}
                            className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/12 hover:text-white"
                            title="Xem trước toàn bộ câu hỏi và đáp án (Read-Only)"
                          >
                            <Eye className="h-3.5 w-3.5 text-white" />
                            <span>Xem trước</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setExamToDelete(exam)}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-200 transition hover:bg-red-500/20 hover:text-white"
                            title="Xóa đề thi này"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-white" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Delete Exam Confirmation Modal */}
      <AnimatePresence>
        {examToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel relative w-full max-w-md rounded-2xl p-6"
            >
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                disabled={isDeleting}
                className="absolute top-4 right-4 rounded-xl p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4 text-white" />
              </button>

              <div className="mb-4 flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/15 text-white">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Xác nhận xóa đề thi
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Thao tác này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-white/10 bg-zinc-950/60 p-4 text-xs leading-relaxed text-zinc-300">
                Bạn có chắc chắn muốn xóa đề thi{" "}
                <strong className="text-white">&ldquo;{examToDelete.title}&rdquo;</strong>?
                Toàn bộ câu hỏi và lịch sử bài nộp liên quan đến đề thi này sẽ bị xóa tự động (Cascading Delete).
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamToDelete(null)}
                  disabled={isDeleting}
                  className="glass-pill rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-red-500 active:scale-[0.98] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-white" />
                  <span>{isDeleting ? "Đang xóa..." : "Xác nhận xóa"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
