"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { loginUser, getCurrentUser } from "@/lib/store";
import {
  GraduationCap,
  Sparkles,
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

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  );
}

function TwitterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
    </svg>
  );
}

function GithubIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
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
  const [signupNotice, setSignupNotice] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
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
        className="w-full max-w-xl text-center flex flex-col items-center space-y-2.5 sm:space-y-3.5 mb-6 sm:mb-8"
      >
        {/* Badge v2.0 đưa lên trên đầu */}
        <div>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#10131b] border border-[#252a37] px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>v2.0 – Thi thử &amp; Đánh giá</span>
          </div>
        </div>

        {/* Dòng logo icon và tên ExamByHeu (cỡ chữ to ngang Heading Hệ thống) */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 lg:h-14 lg:w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10131b] border border-[#252a37] text-white shadow-sm">
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" strokeWidth={2.2} />
          </div>
          <span className="brand-logo font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight select-none">
            <span className="text-white">Exam</span>
            <span className="text-[#9ca3af]">ByHeu</span>
          </span>
        </div>

        {/* Heading Hệ thống */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Hệ thống Thi thử &amp; Đánh giá
        </h1>
      </motion.div>

      {/* 2. Centered Login Card (Matching system dark theme) */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[340px] sm:max-w-[365px]"
      >
        <div className="relative rounded-[20px] sm:rounded-2xl bg-[#161a24] border border-[#252a37] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
          {/* Title */}
          <h2 className="text-center text-2xl sm:text-[28px] font-bold text-white tracking-tight mb-5 sm:mb-6">
            Login
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-[#232836] p-3 text-center text-xs sm:text-sm font-medium text-rose-300 flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            {/* Username */}
            <div className="space-y-1">
              <label
                htmlFor="login-username"
                className="block text-xs sm:text-sm font-medium text-slate-300"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                autoCapitalize="none"
                autoCorrect="off"
                className="h-[42px] sm:h-[46px] w-full rounded-lg bg-[#10131b] border border-[#252a37] px-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa] focus:outline-none transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label
                htmlFor="login-password"
                className="block text-xs sm:text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="h-[42px] sm:h-[46px] w-full rounded-lg bg-[#10131b] border border-[#252a37] pl-3.5 pr-10 text-sm sm:text-base text-white placeholder-slate-500 focus:border-[#a78bfa] focus:ring-1 focus:ring-[#a78bfa] focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 z-10 flex items-center pr-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Forgot Password ? right-aligned */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotNotice(!forgotNotice);
                    setSignupNotice(false);
                    setSocialNotice(null);
                  }}
                  className="text-xs sm:text-[13px] font-medium text-slate-200 hover:text-[#a78bfa] hover:underline transition-colors cursor-pointer select-none"
                >
                  Forgot Password ?
                </button>
              </div>
            </div>

            {forgotNotice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-[#0e1119] border border-[#252a37] p-3 text-xs text-slate-300 flex items-start gap-2 shadow-sm text-left"
              >
                <span className="shrink-0 text-sm leading-none">💡</span>
                <span className="leading-relaxed">Vui lòng liên hệ Quản trị viên (Admin) để được cấp lại hoặc đặt lại mật khẩu mới.</span>
              </motion.div>
            )}

            {/* Sign in Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className={`w-full mt-2 flex h-[44px] sm:h-[48px] items-center justify-center rounded-lg bg-[#a78bfa] hover:bg-[#9678f8] py-2.5 sm:py-3 text-center text-sm sm:text-base font-bold text-slate-950 transition-all select-none cursor-pointer shadow-sm active:scale-[0.97] ${
                loading ? "opacity-85 cursor-not-allowed" : ""
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
                    className="flex items-center justify-center gap-2"
                  >
                    <DotsSpinner className="h-4 w-4 text-slate-950" />
                    <span>Signing in...</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                  >
                    Sign in
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Divider: Login with social accounts */}
          <div className="flex items-center my-5">
            <div className="flex-1 h-[1px] bg-[#252a37]" />
            <span className="px-3 text-xs text-slate-400 select-none">
              Login with social accounts
            </span>
            <div className="flex-1 h-[1px] bg-[#252a37]" />
          </div>

          {/* Social Icons (Google, Twitter, GitHub) */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <button
              type="button"
              onClick={() => {
                setSocialNotice(socialNotice === "Google" ? null : "Google");
                setForgotNotice(false);
                setSignupNotice(false);
              }}
              title="Login with Google"
              className="text-white hover:text-[#a78bfa] hover:scale-115 active:scale-95 transition-all cursor-pointer"
            >
              <GoogleIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSocialNotice(socialNotice === "Twitter" ? null : "Twitter");
                setForgotNotice(false);
                setSignupNotice(false);
              }}
              title="Login with Twitter"
              className="text-white hover:text-[#a78bfa] hover:scale-115 active:scale-95 transition-all cursor-pointer"
            >
              <TwitterIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setSocialNotice(socialNotice === "GitHub" ? null : "GitHub");
                setForgotNotice(false);
                setSignupNotice(false);
              }}
              title="Login with GitHub"
              className="text-white hover:text-[#a78bfa] hover:scale-115 active:scale-95 transition-all cursor-pointer"
            >
              <GithubIcon className="h-5 w-5" />
            </button>
          </div>

          {socialNotice && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-lg bg-[#0e1119] border border-[#252a37] p-2.5 text-xs text-slate-300 flex items-start gap-2 shadow-sm text-center justify-center"
            >
              <span>💡 Đăng nhập qua {socialNotice} dành cho tài khoản đã liên kết trong Cài đặt hệ thống.</span>
            </motion.div>
          )}

          {/* Don't have an account? Sign up */}
          <div className="text-center text-xs sm:text-[13px] text-slate-400">
            <span>Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={() => {
                setSignupNotice(!signupNotice);
                setForgotNotice(false);
                setSocialNotice(null);
              }}
              className="font-bold text-white hover:text-[#a78bfa] hover:underline transition-colors cursor-pointer"
            >
              Sign up
            </button>
          </div>

          {signupNotice && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-lg bg-[#0e1119] border border-[#252a37] p-3 text-xs text-slate-300 flex items-start gap-2 shadow-sm text-left"
            >
              <span className="shrink-0 text-sm leading-none">💡</span>
              <span className="leading-relaxed">Hệ thống cấp tài khoản qua Quản trị viên (Admin). Vui lòng liên hệ để được cấp tài khoản khảo thí.</span>
            </motion.div>
          )}
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
