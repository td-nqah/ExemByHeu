"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser } from "@/lib/store";
import { Profile } from "@/types/exam";
import {
  GraduationCap,
  CheckCircle2,
  History,
  BookOpen,
  LogOut,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    router.push("/");
  };

  // Do not show full navbar if on live exam room to minimize distraction
  const isExamRoom = pathname.startsWith("/exam/") && !pathname.endsWith("/result");

  if (isExamRoom) {
    return null;
  }

  return (
    <header className="glass-nav sticky top-0 z-40 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href={user ? (user.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/"}
            className="flex items-center gap-2.5 font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-none tracking-tight text-white">
                ExamTestByHeu
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-zinc-400">
                Thi thử Trực tuyến
              </span>
            </div>
          </Link>

          {/* Navigation Links based on role (No "Tạo đề mới" button on main navbar) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1.5">
              {user.role === "admin" ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      pathname.startsWith("/admin/dashboard") || pathname.startsWith("/admin/exams")
                        ? "border border-white/20 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-white" />
                    Quản lý Đề thi
                  </Link>
                  <Link
                    href="/admin/submissions"
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      pathname.startsWith("/admin/submissions")
                        ? "border border-white/20 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    Phòng Chấm bài
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      pathname === "/dashboard"
                        ? "border border-white/20 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-white" />
                    Đề thi khả dụng
                  </Link>
                  <Link
                    href="/history"
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      pathname.startsWith("/history")
                        ? "border border-white/20 bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <History className="h-3.5 w-3.5 text-white" />
                    Lịch sử làm bài
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* User Status and Controls */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Role Badge */}
              <div className="glass-pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-zinc-200">
                {user.role === "admin" ? (
                  <ShieldAlert className="h-3.5 w-3.5 text-white" />
                ) : (
                  <UserCheck className="h-3.5 w-3.5 text-white" />
                )}
                <span className="hidden sm:inline text-zinc-300">
                  {user.role === "admin" ? "Quản trị viên" : "Thí sinh"}:
                </span>
                <span className="font-bold text-white">{user.username}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="glass-pill inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-white/30 hover:bg-white/12 hover:text-white active:scale-[0.98]"
                title="Đăng xuất"
              >
                <LogOut className="h-3.5 w-3.5 text-white" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-bold text-zinc-950 shadow-xs transition hover:bg-zinc-200 active:scale-[0.98]"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
