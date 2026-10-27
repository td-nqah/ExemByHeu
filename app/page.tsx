"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { loginUser, getCurrentUser } from "@/lib/store";
import {
  GraduationCap,
  ArrowRight,
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

function DotsSpinner({ className = "h-5 w-5 text-black" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="3.5" r="1.8" opacity="1.0" />
      <circle cx="18.01" cy="5.99" r="1.8" opacity="0.875" />
      <circle cx="20.5" cy="12" r="1.8" opacity="0.75" />
      <circle cx="18.01" cy="18.01" r="1.8" opacity="0.625" />
      <circle cx="12" cy="20.5" r="1.8" opacity="0.5" />
      <circle cx="5.99" cy="18.01" r="1.8" opacity="0.375" />
      <circle cx="3.5" cy="12" r="1.8" opacity="0.25" />
      <circle cx="5.99" cy="5.99" r="1.8" opacity="0.125" />
    </svg>
  );
}

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
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const [user] = await Promise.all([
        loginUser(username, password),
        new Promise((resolve) => setTimeout(resolve, 600)),
      ]);
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
    <div className="relative flex min-h-[100dvh] w-full flex-col justify-center items-center px-4 py-8 sm:py-12 pb-safe pt-safe overflow-x-hidden">
      {/* 1. Centered System Heading on Top */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl text-center space-y-2.5 sm:space-y-3 mb-6 sm:mb-8"
      >
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#10131b] border border-[#252a37] px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-white shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-white" />
          <span>
            <span className="text-white font-bold">Exam</span>
            <span className="text-[#9ca3af] font-bold">ByHeu</span>{" "}
            <span className="text-white font-medium">v2.0 – Thi thử &amp; Đánh giá</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Hệ thống Thi thử &amp; Đánh giá
        </h1>
      </motion.div>

      {/* 2. Centered Login Card */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[450px] sm:max-w-[470px] md:max-w-[490px]"
      >
        <div className="relative">
          {/* Subtle Ambient Glow Behind Card */}
          <div
            className="pointer-events-none absolute -inset-1 rounded-[32px] bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent blur-xl opacity-75 -z-10"
            aria-hidden="true"
          />

          <div className="relative bg-[#141722]/95 backdrop-blur-2xl border border-[#262c3c] hover:border-[#30384c] transition-all duration-300 rounded-[28px] sm:rounded-3xl p-7 sm:p-9 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.05)]">
            {/* Ambient Top Subtle Line */}
            <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-3xl" />

            {/* Logo with ExamByHeu beside it, followed by divider line and "Đăng nhập hệ thống" below */}
            <div className="mb-6 sm:mb-7 flex flex-col items-center text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#1c2230] to-[#10131b] border border-[#2e3648] text-white shadow-md shadow-black/40 ring-1 ring-white/5">
                  <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.2} />
                </div>
                <span className="brand-logo font-heading text-2xl sm:text-[27px] font-black tracking-tight select-none">
                  <span className="text-white">Exam</span>
                  <span className="text-[#9ca3af]">ByHeu</span>
                </span>
              </div>

              {/* Gạch giữa giống trong sidebar */}
              <div className="w-full my-4.5 sm:my-5 h-[1px] bg-[#252a37]" />

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Đăng nhập hệ thống
              </h2>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-500/30 bg-[#232836] p-3.5 text-center text-sm font-medium text-rose-300 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Tên đăng nhập */}
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="login-username"
                  className="block text-[13px] sm:text-sm font-semibold text-slate-200"
                >
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Email/Username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="h-[48px] sm:h-[52px] w-full rounded-xl bg-[#0e1119] border border-[#252a37] pl-11 pr-4 text-base text-white placeholder-slate-500 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none hover:border-[#333a4c] transition-all font-medium"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5 text-[#8b93a5] group-focus-within:text-white transition-colors">
                    <User className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="login-password"
                  className="block text-[13px] sm:text-sm font-semibold text-slate-200"
                >
                  Mật khẩu
                </label>

                <div className="relative group">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-[48px] sm:h-[52px] w-full rounded-xl bg-[#0e1119] border border-[#252a37] pl-11 pr-11 text-base text-white placeholder-slate-500 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none hover:border-[#333a4c] transition-all font-medium"
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3.5 text-[#8b93a5] group-focus-within:text-white transition-colors">
                    <Lock className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 z-10 flex items-center pr-3.5 text-[#8b93a5] hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={2.2} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={2.2} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button with press-down (chìm xuống) and rotating dots spinner */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={reduceMotion ? undefined : { scale: 0.95, y: 2 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={`mt-6 flex h-[48px] sm:h-[52px] w-full items-center justify-center gap-2.5 rounded-full bg-white hover:bg-slate-100 px-6 text-base sm:text-lg font-bold text-black select-none cursor-pointer shadow-md transition-all active:scale-[0.95] active:translate-y-1 active:shadow-inner ${
                  loading
                    ? "cursor-not-allowed scale-[0.98] translate-y-0.5 shadow-inner bg-slate-100 opacity-90"
                    : ""
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center gap-2.5"
                    >
                      <DotsSpinner className="h-5 w-5 text-black" />
                      <span>Đang đăng nhập...</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Đăng nhập</span>
                      <ArrowRight className="h-5 w-5" strokeWidth={2.2} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Dòng Quên mật khẩu bên dưới nút Đăng nhập */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setForgotNotice(!forgotNotice)}
                  className="text-xs sm:text-[13px] text-slate-400 hover:text-white font-medium transition-colors cursor-pointer select-none inline-flex items-center gap-1.5"
                >
                  <span>Quên mật khẩu?</span>
                </button>
              </div>

              {forgotNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-[#0e1119] border border-[#252a37] p-3 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5 shadow-sm text-left"
                >
                  <span className="shrink-0 text-base leading-none">💡</span>
                  <span className="leading-relaxed">Vui lòng liên hệ Quản trị viên (Admin) để được cấp lại hoặc đặt lại mật khẩu mới.</span>
                </motion.div>
              )}
            </form>
          </div>
        </div>
      </motion.div>

      {/* 3. Text ExamByHeu (Exam Trắng, ByHeu Tím) at Bottom Right of Screen */}
      <div className="fixed bottom-3.5 right-4 sm:bottom-6 sm:right-8 z-20 select-none pointer-events-none">
        <span className="brand-logo font-heading text-xs sm:text-sm md:text-base font-black tracking-tight opacity-85 sm:opacity-95">
          <span className="text-white">Exam</span>
          <span className="text-[#818cf8]">ByHeu</span>
        </span>
      </div>
    </div>
  );
}
