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
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090D16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href={user ? (user.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/"}
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              ExamByHeu
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
              v2.0 Cyber
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {user.role === "admin" ? (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname === "/admin" ||
                    pathname.startsWith("/admin/dashboard") ||
                    pathname.startsWith("/admin/exams")
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Quản lý Đề thi
                </Link>
                <Link
                  href="/admin/submissions"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname.startsWith("/admin/submissions")
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
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
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  Đề thi khả dụng
                </Link>
                <Link
                  href="/history"
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    pathname.startsWith("/history")
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
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
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
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
                className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 px-3 py-1.5 rounded-xl text-sm transition-all"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
