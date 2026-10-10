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
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Brand & Platform Highlights (On mobile: order-2 below login) */}
        <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Nền tảng Khảo thí Thế hệ mới</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl md:text-5xl dark:text-zinc-50">
            Hệ thống Khảo thí & Chấm thi Trực tuyến Chuẩn Mực
          </h1>

          <p className="max-w-2xl text-base text-zinc-600 leading-relaxed dark:text-zinc-300">
            Bóc tách đề thi tự động từ file Word (.docx), Excel (.xlsx), PDF. Tự động chấm điểm trắc nghiệm thời gian thực, phòng thi bảo mật có đồng hồ đếm ngược và bảng chấm bài tự luận chuyên nghiệp dành cho giảng viên.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 mb-2 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Bóc tách Đa định dạng</h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                Tự nhận diện câu hỏi, đáp án A-B-C-D và câu tự luận.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
              <Clock className="h-5 w-5 text-blue-600 mb-2 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Phòng thi Thời gian thực</h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                Đồng hồ đếm ngược chính xác, lưu trạng thái bài thi liên tục.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
              <FileText className="h-5 w-5 text-amber-600 mb-2 dark:text-amber-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Chấm thi Kết hợp</h3>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                Khóa điểm trắc nghiệm tức thì, giáo viên chấm tự luận có phản hồi.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card (On mobile: order-1 on top) */}
        <div className="order-1 lg:order-2 lg:col-span-5">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 mb-3 shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Đăng nhập hệ thống
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Nhập thông tin tài khoản để truy cập hệ thống.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <span>{loading ? "Đang xác thực..." : "Đăng nhập ngay"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
