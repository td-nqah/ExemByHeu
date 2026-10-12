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
        router.push("/home");
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
          router.push("/home");
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
    <div className="flex min-h-[100dvh] flex-col justify-center items-center px-4 py-4 sm:py-8 lg:py-12 pb-safe pt-safe">
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch">
        {/* 1. Mobile Order 1 / Desktop Top-Left (col-span-6): Page Title & Hero Intro */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:col-span-6 lg:row-start-1 space-y-2 sm:space-y-4 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-medium text-indigo-400">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
            <span>ExamByHeu v2.0 Cyber • Thi thử Trực tuyến</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-[2.65rem] font-bold tracking-tight text-white leading-snug sm:leading-[1.14]">
            Hệ thống Thi thử & Chấm thi Trực tuyến
            <span className="hidden sm:inline"> Chuẩn Mực</span>
          </h1>

          <p className="hidden sm:block max-w-[58ch] text-xs sm:text-sm lg:text-base text-slate-400 leading-relaxed">
            Bóc tách đề thi tự động từ Word, Excel, PDF. Chấm điểm trắc nghiệm và tự luận bằng AI trong phòng thi bảo mật.
          </p>
        </motion.div>

        {/* 2. Mobile Order 2 / Desktop Right Column (col-span-6, height-aligned & width-constrained) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex justify-center w-full lg:h-full"
        >
          <div className="relative bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 flex w-full max-w-md lg:max-w-[440px] mx-auto flex-col justify-center rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl lg:h-full">
            {/* Centered Icon & Header Title "Đăng nhập hệ thống" */}
            <div className="mb-4 sm:mb-6 flex flex-col items-center text-center">
              <div className="mb-3 sm:mb-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Đăng nhập hệ thống
              </h2>
              <p className="mt-1 sm:mt-1.5 max-w-xs text-xs text-slate-400">
                Nhập thông tin tài khoản để truy cập phòng thi thử hoặc trang quản trị.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="glass-input h-12 sm:h-11 w-full rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
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
                  className="glass-input h-12 sm:h-11 w-full rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 sm:mt-3 flex h-12 sm:h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 text-base sm:text-sm font-semibold sm:font-medium text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all active:scale-[0.98] disabled:opacity-50 select-none"
              >
                <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Subdued Glassmorphism Watermark */}
            <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-5 select-none pointer-events-auto">
              <span className="font-mono text-[10px] tracking-widest uppercase text-slate-500/30 hover:text-indigo-400/60 transition-colors duration-300 cursor-default">
                MadeByHeu
              </span>
            </div>
          </div>
        </motion.div>

        {/* 3. Mobile Order 3 / Desktop Bottom-Left (col-span-6): Asymmetric Bento Feature Highlights */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="order-3 lg:col-span-6 lg:row-start-2 grid grid-cols-1 gap-3.5 sm:grid-cols-12 self-end"
        >
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 sm:col-span-7 rounded-2xl p-4 sm:p-5">
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

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 sm:col-span-5 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Phòng thi Thời gian thực
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Đồng hồ đếm ngược chuẩn xác, tự động khóa và nộp bài khi hết giờ.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 sm:col-span-12 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3.5">
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
