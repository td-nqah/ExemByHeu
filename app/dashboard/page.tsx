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
  Award,
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
          className="inline-flex items-center gap-2 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900/90 border border-slate-800/80 hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 self-start md:self-auto"
        >
          <Award className="h-4 w-4 text-indigo-400" />
          <span>Xem Lịch sử bài đã nộp ({submissions.length})</span>
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
