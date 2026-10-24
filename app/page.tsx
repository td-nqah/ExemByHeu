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
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotNotice, setForgotNotice] = useState(false);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi trong quá trình xác thực tài khoản.";
      setError(msg);
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
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full glass-badge px-3 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            <span>
              <span className="text-white font-bold">Exam</span>
              <span className="text-[#9CA3AF] font-bold">By</span>
              <span className="text-white font-bold">Heu</span> v2.0 • Khảo thí & Đánh giá Học phần
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-[2.35rem] xl:text-[2.65rem] font-extrabold tracking-tight text-white leading-tight sm:leading-[1.16]">
            <span className="text-white">Hệ thống</span> Khảo thí
            <span className="block mt-1 sm:mt-1.5 lg:mt-2">
              <span className="text-white">Đánh giá</span> Học thuật
            </span>
          </h1>

          <p className="hidden sm:block max-w-[58ch] text-xs sm:text-sm lg:text-base text-[#9CA3AF] leading-relaxed">
            Bóc tách đề thi tự động từ học liệu số. Chấm điểm trắc nghiệm và hỗ trợ đánh giá tự luận trong môi trường bảo mật.
          </p>
        </motion.div>

        {/* 2. Mobile Order 2 / Desktop Right Column (col-span-6, height-aligned & width-constrained) */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="order-2 lg:col-span-6 lg:col-start-7 lg:row-start-1 lg:row-span-2 flex justify-center w-full lg:h-full"
        >
          <div className="relative bg-[#121318] border border-white/[0.08] flex w-full max-w-md lg:max-w-[460px] mx-auto flex-col justify-center rounded-[28px] p-7 sm:p-9 lg:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] lg:h-full">
            {/* Ambient Top Glow Line */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-[28px]" />

            {/* Centered Icon & Header Title */}
            <div className="mb-6 sm:mb-7 flex flex-col items-center text-center">
              <div className="mb-3.5 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl glass-icon">
                <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Đăng nhập Cổng Khảo thí
              </h2>
              <p className="mt-2 text-sm sm:text-[15px] text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
                Vui lòng nhập thông tin xác thực để truy cập môi trường khảo thí và học vụ
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center text-sm font-medium text-rose-300 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Tên đăng nhập */}
              <div className="space-y-2">
                <label
                  htmlFor="login-username"
                  className="block text-sm sm:text-[15px] font-semibold text-white"
                >
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Email/Username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="glass-input h-[50px] sm:h-[52px] w-full rounded-xl pl-11 pr-4 text-base text-white placeholder-[#9CA3AF] focus:outline-none transition-all font-medium"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-[#9CA3AF]">
                    <User className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-sm sm:text-[15px] font-semibold text-white"
                  >
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotNotice(!forgotNotice)}
                    className="text-xs sm:text-sm text-[#9CA3AF] hover:text-white font-medium transition cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {forgotNotice && (
                  <div className="rounded-xl glass-panel p-3 text-xs sm:text-sm text-white flex items-start gap-2">
                    <span className="shrink-0">💡</span>
                    <span>Vui lòng liên hệ Quản trị viên (Admin) để được cấp lại hoặc đặt lại mật khẩu mới.</span>
                  </div>
                )}

                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="glass-input h-[50px] sm:h-[52px] w-full rounded-xl pl-11 pr-11 text-base text-white placeholder-[#9CA3AF] focus:outline-none transition-all font-medium"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4 text-[#9CA3AF]">
                    <Lock className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2.2} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 z-10 flex items-center pr-3.5 text-[#9CA3AF] hover:text-indigo-300 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2.2} />
                    ) : (
                      <Eye className="h-5 w-5 text-[#9CA3AF]" strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-[50px] sm:h-[52px] w-full items-center justify-center gap-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0A0B0E] px-6 text-base sm:text-lg font-bold select-none cursor-pointer shadow-[0_2px_8px_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.4)] transition-all active:scale-[0.99]"
              >
                <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </form>

            {/* Subdued Glassmorphism Watermark */}
            <div className="pt-6 sm:pt-8 text-center select-none">
              <span className="font-mono text-xs sm:text-[11px] tracking-[0.25em] uppercase text-slate-500/60 hover:text-indigo-400/80 transition-colors duration-300 cursor-default">
                MADE BY HEU
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
          <div className="bg-[#121318] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300 sm:col-span-7 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl glass-icon">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Bóc tách Đề thi Đa định dạng
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
              Tự động nhận diện câu hỏi trắc nghiệm A-B-C-D và câu tự luận từ file Word (.docx), Excel (.xlsx) và PDF.
            </p>
          </div>

          <div className="bg-[#121318] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300 sm:col-span-5 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl glass-icon">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Phòng thi Thời gian thực
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#9CA3AF]">
              Đồng hồ đếm ngược chuẩn xác, tự động khóa và nộp bài khi hết giờ.
            </p>
          </div>

          <div className="bg-[#121318] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300 sm:col-span-12 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl glass-icon">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Chấm điểm Trắc nghiệm & Tự luận AI Tức thì
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[#9CA3AF]">
                Khóa điểm trắc nghiệm ngay khi nộp bài, kết hợp Gemini Pro chấm tự luận và trả lời phê chi tiết trong vòng dưới 30 giây.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
