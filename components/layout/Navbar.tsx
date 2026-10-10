"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser, SEED_PROFILES } from "@/lib/store";
import { Profile } from "@/types/exam";
import {
  GraduationCap,
  FilePlus2,
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href={user ? (user.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/"}
            className="flex items-center gap-2.5 font-bold tracking-tight text-zinc-900 transition-opacity hover:opacity-90 dark:text-zinc-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-none">ExamPulse</span>
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                Khảo thí Trực tuyến
              </span>
            </div>
          </Link>

          {/* Navigation Links based on role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {user.role === "admin" ? (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === "/admin/dashboard"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Đề thi
                  </Link>
                  <Link
                    href="/admin/exams/create"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === "/admin/exams/create"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Tạo đề mới
                  </Link>
                  <Link
                    href="/admin/submissions"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/submissions")
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Chấm bài
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname === "/dashboard"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <BookOpen className="h-4 w-4" />
                    Đề thi khả dụng
                  </Link>
                  <Link
                    href="/history"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      pathname.startsWith("/history")
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <History className="h-4 w-4" />
                    Lịch sử làm bài
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* User Status and Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                  user.role === "admin"
                    ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                    : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                }`}
              >
                {user.role === "admin" ? (
                  <ShieldAlert className="h-3 w-3" />
                ) : (
                  <UserCheck className="h-3 w-3" />
                )}
                <span>{user.role === "admin" ? "Quản trị viên" : "Thí sinh"}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  ({user.username})
                </span>
              </div>


              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 p-2 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-medium">Thoát</span>
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
