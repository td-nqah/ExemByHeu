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
  Pencil,
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
  const pendingGradingCount = submissions.filter(
    (s) => s.status === "pending_grading"
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            Quản trị Thi thử Trực tuyến
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-normal">
              Admin Panel
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Tổng quan hệ thống ExamByHeu, quản lý ngân hàng đề thi và điều phối chấm bài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            <span>Phòng Chấm thi ({pendingGradingCount} bài chờ)</span>
          </Link>
        </div>
      </motion.div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng số đề thi
            </p>
            <p className="text-2xl font-bold text-white mt-1">{exams.length}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Đã xuất bản
            </p>
            <p className="text-2xl font-bold text-white mt-1">{publishedCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Lượt nộp bài
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {submissions.length}
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Chờ chấm tự luận
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {pendingGradingCount}
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Exams Management Section */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0C1017] border border-slate-800/90 overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="flex flex-col gap-3 border-b border-slate-800/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-base font-bold text-white">
              Quản lý Ngân hàng Đề thi ({exams.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Xem trước cấu trúc đề, chỉnh sửa câu hỏi, đóng/mở xuất bản hoặc xóa đề thi khỏi hệ thống.
            </p>
          </div>

          <Link
            href="/admin/exams/create"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all sm:self-auto"
          >
            <FilePlus2 className="h-4 w-4" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-slate-400">Đang tải dữ liệu...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-300">
              Chưa có đề thi nào
            </p>
            <Link
              href="/admin/exams/create"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo đề thi đầu tiên
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800/80 bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Tên đề thi</th>
                  <th className="py-3.5 px-4 font-semibold">Thời lượng</th>
                  <th className="py-3.5 px-4 font-semibold">Số câu hỏi</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày tạo</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right font-semibold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {exams.map((exam) => {
                  const isPublished = exam.status === "published";
                  const questionCount = exam.questions?.length || 0;

                  return (
                    <tr
                      key={exam.id}
                      className="transition hover:bg-slate-900/40"
                    >
                      <td className="max-w-sm truncate py-3.5 px-4 font-bold text-white">
                        {exam.title}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-slate-300">
                        {formatDuration(exam.duration_minutes)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {questionCount} câu
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4 text-slate-400">
                        {formatDate(exam.created_at)}
                      </td>
                      <td className="whitespace-nowrap py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exam.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                            isPublished
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-800"
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
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/exams/preview?id=${exam.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition"
                            title="Xem trước toàn bộ câu hỏi và đáp án"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Xem trước</span>
                          </Link>

                          <Link
                            href={`/admin/exams/${exam.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-300 hover:text-white transition"
                            title="Chỉnh sửa thông tin đề thi và câu hỏi"
                          >
                            <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Chỉnh sửa</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setExamToDelete(exam)}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300"
                            title="Xóa đề thi này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Xác nhận xóa đề thi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Thao tác này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs leading-relaxed text-slate-300">
                Bạn có chắc chắn muốn xóa đề thi{" "}
                <strong className="text-white">
                  &ldquo;{examToDelete.title}&rdquo;
                </strong>
                ? Toàn bộ câu hỏi và lịch sử bài nộp liên quan đến đề thi này sẽ bị xóa tự động (Cascading Delete).
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
