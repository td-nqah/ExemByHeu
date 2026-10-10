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
  User,
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
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href={user ? (user.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/"}
          className="group flex items-center gap-3 transition-opacity hover:opacity-95"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all group-hover:border-indigo-500/40">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex items-center">
            <span className="text-lg text-white font-bold tracking-tight drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              ExamByHeu
            </span>
            <span className="hidden sm:inline-block ml-2.5 text-[11px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium tracking-wide">
              v2.0 Cyber
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 backdrop-blur-md p-1 rounded-xl border border-slate-800/80">
            {user.role === "admin" ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname === "/admin" ||
                    pathname.startsWith("/admin/dashboard") ||
                    pathname.startsWith("/admin/exams")
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Quản lý Đề thi
                </Link>
                <Link
                  href="/admin/submissions"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname.startsWith("/admin/submissions")
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Phòng Chấm bài
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname === "/dashboard"
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Đề thi khả dụng
                </Link>
                <Link
                  href="/history"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname.startsWith("/history")
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <History className="h-4 w-4" />
                  Lịch sử làm bài
                </Link>
              </>
            )}
          </nav>
        )}

        {/* User Profile & Action */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl">
                {user.role === "admin" ? (
                  <ShieldAlert className="h-4 w-4 text-indigo-400" />
                ) : (
                  <User className="h-4 w-4 text-indigo-400" />
                )}
                <span className="text-sm font-medium text-slate-300">
                  <span className="hidden sm:inline">
                    {user.role === "admin" ? "Quản trị: " : "Thí sinh: "}
                  </span>
                  <strong className="text-white">{user.username}</strong>
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 px-3 py-1.5 rounded-xl text-sm transition-all"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-4 py-2 text-xs font-medium text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
