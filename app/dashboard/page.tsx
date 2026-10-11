"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { getExams, getSubmissions, getCurrentUser } from "@/lib/store";
import { Exam, Submission } from "@/types/exam";
import { UserExamCard } from "@/components/dashboard/UserExamCard";
import {
  BookOpen,
  ChevronRight,
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
          title="Bấm để xem Lịch sử làm bài"
          className="group inline-flex items-center gap-3.5 sm:gap-4 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.18)] rounded-xl p-3 px-4 shadow-lg transition-all duration-300 self-start md:self-auto cursor-pointer"
        >
          {/* Số đề hiện có */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-sm select-none" aria-hidden="true">📚</span>
            <span>Đề hiện có:</span>
            <span className="font-bold text-white tracking-wide">
              {loading ? "..." : exams.length}
            </span>
          </div>

          {/* Đường phân cách mảnh */}
          <div className="h-4 w-px bg-white/10 group-hover:bg-white/20 transition-colors" />

          {/* Số đề đã hoàn thành */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-sm select-none" aria-hidden="true">✅</span>
            <span>Đã hoàn thành:</span>
            <span className="font-bold text-indigo-400 group-hover:text-indigo-300 tracking-wide">
              {loading ? "..." : submissions.length}
            </span>
          </div>

          {/* Mũi tên chuyển hướng */}
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:translate-x-0.5 ml-0.5" />
        </Link>
      </motion.div>

      {/* Exam Cards Grid */}
      {loading ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-slate-400">
            Đang tải danh sách đề thi thử...
          </p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center">
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
          {exams.map((exam, idx) => (
            <UserExamCard key={exam.id} exam={exam} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
