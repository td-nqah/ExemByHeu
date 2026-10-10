"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* 1. Mobile Order 1 / Desktop Top-Left: Page Title & Hero Intro */}
        <div className="order-1 lg:col-span-7 lg:row-start-1 space-y-4">
          <div className="glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-zinc-200">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>ExemTest • Thi thử Trực tuyến</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl leading-[1.12]">
            Hệ thống Thi thử & Chấm thi Trực tuyến Chuẩn Mực
          </h1>

          <p className="max-w-[58ch] text-sm sm:text-base text-zinc-300 leading-relaxed">
            Bóc tách đề thi tự động từ Word, Excel, PDF. Chấm điểm trắc nghiệm và tự luận bằng AI trong phòng thi bảo mật.
          </p>
        </div>

        {/* 2. Mobile Order 2 / Desktop Right Column: Frosted Glass Login Panel */}
        <div className="order-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-span-2 lg:self-center">
          <div className="glass-panel rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Đăng nhập hệ thống
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Nhập thông tin tài khoản để vào phòng thi thử hoặc quản trị.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200 backdrop-blur-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="block text-xs font-medium text-zinc-300"
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
                  className="block text-xs font-medium text-zinc-300"
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
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500 px-4 text-sm font-bold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_24px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 3. Mobile Order 3 / Desktop Bottom-Left: Asymmetric Bento Feature Highlights */}
        <div className="order-3 lg:col-span-7 lg:row-start-2 grid grid-cols-1 gap-3.5 sm:grid-cols-12 pt-1">
          <div className="glass-card-interactive sm:col-span-7 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Bóc tách Đề thi Đa định dạng
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Tự động nhận diện câu hỏi trắc nghiệm A-B-C-D và câu tự luận từ file Word (.docx), Excel (.xlsx) và PDF.
            </p>
          </div>

          <div className="glass-card-interactive sm:col-span-5 rounded-2xl p-4 sm:p-5">
            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Phòng thi Thời gian thực
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Đồng hồ đếm ngược chuẩn xác, tự động khóa và nộp bài khi hết giờ.
            </p>
          </div>

          <div className="glass-card-interactive sm:col-span-12 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3.5 bg-gradient-to-r from-emerald-950/35 via-zinc-900/50 to-zinc-900/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Chấm điểm Trắc nghiệm & Tự luận AI Tức thì
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">
                Khóa điểm trắc nghiệm ngay khi nộp bài, kết hợp Gemini Pro chấm tự luận trên thang điểm 5 và trả lời phê chi tiết trong vòng dưới 30 giây.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
