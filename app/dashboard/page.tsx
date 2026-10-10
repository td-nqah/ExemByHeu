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
  BookCheck,
  Clock,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Award,
  TrendingUp,
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
          getExams(true, user?.id),
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

  const pendingCount = submissions.filter(
    (s) => s.status === "pending_grading"
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Quick Action */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            Đề thi thử Khả dụng
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-normal">
              Hệ thống sẵn sàng
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Chọn đề thi bên dưới để bắt đầu làm bài. Hệ thống sẽ tự động kích hoạt đồng hồ đếm ngược.
          </p>
        </div>

        <Link
          href="/history"
          className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm self-start md:self-auto"
        >
          <Award className="h-4 w-4 text-indigo-400" />
          <span>Xem Lịch sử bài đã nộp ({submissions.length})</span>
        </Link>
      </motion.div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between hover:border-slate-700 transition-all"
        >
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Đề thi đang mở
            </p>
            <p className="text-2xl font-bold text-white mt-1">{exams.length}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookCheck className="h-5 w-5" />
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
              Bài đã hoàn thành
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {submissions.length}
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
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
              Chờ giáo viên duyệt
            </p>
            <p className="text-2xl font-bold text-white mt-1">{pendingCount}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="bg-[#0C1017] border border-slate-800/90 flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-slate-400">
            Đang tải danh sách đề thi thử...
          </p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-[#0C1017] border border-slate-800/90 flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Chưa có đề thi thử nào được xuất bản
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            Vui lòng đăng nhập với quyền Quản trị viên để tải lên hoặc tạo đề thi mới từ tệp Word, Excel hoặc PDF.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam, idx) => {
            const questionCount = exam.questions?.length || 0;
            const mcqCount =
              exam.questions?.filter((q) => q.type === "multiple_choice")
                .length || 0;
            const essayCount =
              exam.questions?.filter((q) => q.type === "essay").length || 0;

            const recentAttempts = exam.recent_submissions || [];

            return (
              <motion.div
                key={exam.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="glow-card bg-[#0C1017] border border-slate-800/90 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/50">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {formatDuration(exam.duration_minutes)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/50">
                      <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                      {questionCount} câu hỏi
                    </span>
                  </div>

                  {/* Exam Title & Info */}
                  <h3 className="text-xl font-bold text-white tracking-tight mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {exam.description ||
                      "Bài thi thử trực tuyến đánh giá năng lực toàn diện."}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
                    <span>{mcqCount} trắc nghiệm</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>{essayCount} tự luận</span>
                  </div>
                </div>

                {/* Recent Scores Component */}
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> 3 lần
                      gần nhất:
                    </span>
                  </div>

                  {recentAttempts.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-0.5">
                      Chưa có lượt làm bài nào
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                      {recentAttempts.map((attempt, attemptIdx) => {
                        const isPending = attempt.status === "pending_grading";
                        const labelNum = attemptIdx + 1;

                        const badgeColor = isPending
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          : attemptIdx === 1
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20";

                        return (
                          <Link
                            key={attempt.id}
                            href={`/history/${attempt.id}`}
                            title={`Xem chi tiết lượt nộp ngày ${formatDate(
                              attempt.submitted_at
                            )}`}
                            className={`text-[11px] font-semibold border px-2 py-0.5 rounded-md transition ${badgeColor}`}
                          >
                            {isPending
                              ? `Lần ${labelNum}: Đang chấm`
                              : `Lần ${labelNum}: ${attempt.total_score}`}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(exam.created_at)}
                  </span>

                  <Link
                    href={`/exam/${exam.id}`}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:translate-x-0.5"
                  >
                    <span>Vào làm bài</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
