"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { loginUser, getCurrentUser } from "@/lib/store";
import {
  GraduationCap,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(username, password);
      if (user) {
        if (user.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
      }
    } catch {
      setError("Đã xảy ra lỗi trong quá trình xác thực tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch">
        {/* 1. Mobile Order 1 / Desktop Top-Left (col-span-6): Page Title & Hero Intro */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:col-span-6 lg:row-start-1 space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 text-xs font-medium text-indigo-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Exambyheu v2.0 Cyber • Thi thử Trực tuyến</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] leading-[1.14]">
            Hệ thống Thi thử & Chấm thi Trực tuyến Chuẩn Mực
          </h1>

          <p className="max-w-[58ch] text-sm sm:text-base text-slate-400 leading-relaxed">
            Bóc tách đề thi tự động từ Word, Excel, PDF. Chấm điểm trắc nghiệm và tự luận bằng AI trong phòng thi bảo mật.
          </p>
        </motion.div>

        {/* 2. Mobile Order 2 / Desktop Right Column (col-span-6, stretched horizontally & height-aligned) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex"
        >
          <div className="glow-card bg-[#0C1017] border border-slate-800/90 flex w-full flex-col justify-center rounded-2xl p-6 sm:p-10 shadow-xl">
            {/* Centered Icon & Header Title "Đăng nhập hệ thống" */}
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Đăng nhập hệ thống
              </h2>
              <p className="mt-1.5 max-w-xs text-xs text-slate-400">
                Nhập thông tin tài khoản để truy cập phòng thi thử hoặc trang quản trị.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="block text-xs font-medium text-slate-300"
                >
                  Tên đăng nhập
                </label>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="glass-input h-11 w-full rounded-xl px-3.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-slate-300"
                >
                  Mật khẩu
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="glass-input h-11 w-full rounded-xl px-3.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>

        {/* 3. Mobile Order 3 / Desktop Bottom-Left (col-span-6): Asymmetric Bento Feature Highlights */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="order-3 lg:col-span-6 lg:row-start-2 grid grid-cols-1 gap-3.5 sm:grid-cols-12 self-end"
        >
          <div className="glow-card bg-[#0C1017] border border-slate-800/90 sm:col-span-7 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Bóc tách Đề thi Đa định dạng
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Tự động nhận diện câu hỏi trắc nghiệm A-B-C-D và câu tự luận từ file Word (.docx), Excel (.xlsx) và PDF.
            </p>
          </div>

          <div className="glow-card bg-[#0C1017] border border-slate-800/90 sm:col-span-5 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Phòng thi Thời gian thực
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Đồng hồ đếm ngược chuẩn xác, tự động khóa và nộp bài khi hết giờ.
            </p>
          </div>

          <div className="glow-card bg-[#0C1017] border border-slate-800/90 sm:col-span-12 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Chấm điểm Trắc nghiệm & Tự luận AI Tức thì
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                Khóa điểm trắc nghiệm ngay khi nộp bài, kết hợp Gemini Pro chấm tự luận và trả lời phê chi tiết trong vòng dưới 30 giây.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
