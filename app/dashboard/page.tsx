"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
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
  const reduceMotion = useReducedMotion();
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
          getExams(true),
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
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Đề thi thử Khả dụng
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Chọn đề thi bên dưới để bắt đầu làm bài. Hệ thống sẽ tự động kích hoạt đồng hồ đếm ngược.
          </p>
        </div>

        <Link
          href="/history"
          className="glass-card-interactive inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-semibold text-white"
        >
          <CheckCircle className="h-4 w-4 text-white" />
          <span>Xem Lịch sử bài đã nộp ({submissions.length})</span>
        </Link>
      </motion.div>

      {/* Metrics Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: BookOpen,
            label: "Đề thi đang mở",
            value: exams.length,
          },
          {
            icon: CheckCircle,
            label: "Bài đã hoàn thành",
            value: submissions.length,
          },
          {
            icon: FileText,
            label: "Chờ giáo viên duyệt",
            value: submissions.filter((s) => s.status === "pending_grading").length,
          },
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

      {/* Available Exams Grid */}
      {loading ? (
        <div className="glass-card flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-zinc-400">Đang tải danh sách đề thi thử...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-zinc-300" />
          <h3 className="text-base font-bold text-white">
            Chưa có đề thi thử nào được xuất bản
          </h3>
          <p className="mt-1 max-w-sm text-xs text-zinc-400">
            Vui lòng đăng nhập với quyền Quản trị viên để tải lên hoặc tạo đề thi mới từ tệp Word, Excel hoặc PDF.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam, idx) => {
            const questionCount = exam.questions?.length || 0;
            const mcqCount =
              exam.questions?.filter((q) => q.type === "multiple_choice").length || 0;
            const essayCount =
              exam.questions?.filter((q) => q.type === "essay").length || 0;

            return (
              <motion.div
                key={exam.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card-interactive flex flex-col justify-between rounded-2xl p-6"
              >
                <div>
                  {/* Tags */}
                  <div className="mb-3.5 flex flex-wrap items-center gap-2">
                    <span className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                      <Clock className="h-3 w-3 text-white" />
                      {formatDuration(exam.duration_minutes)}
                    </span>
                    <span className="glass-pill inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                      <HelpCircle className="h-3 w-3 text-white" />
                      {questionCount} câu hỏi
                    </span>
                  </div>

                  <h3 className="text-base font-bold leading-snug text-white">
                    {exam.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
                    {exam.description || "Bài thi thử trực tuyến đánh giá năng lực toàn diện."}
                  </p>

                  {/* Question Composition */}
                  <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3 text-[11px] text-zinc-400">
                    <span>{mcqCount} trắc nghiệm</span>
                    <span>•</span>
                    <span>{essayCount} tự luận</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3.5">
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Calendar className="h-3 w-3 text-zinc-300" />
                    {formatDate(exam.created_at)}
                  </span>

                  <Link
                    href={`/exam/${exam.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 shadow-xs transition hover:bg-zinc-200 active:scale-[0.98]"
                  >
                    <span>Vào làm bài</span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-950" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
