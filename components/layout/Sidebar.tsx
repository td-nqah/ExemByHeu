"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentUser, setCurrentUser } from "@/lib/store";
import { Profile } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  BookOpen,
  Bookmark,
  History,
  TrendingUp,
  ShieldCheck,
  Wand2,
  Target,
  Settings,
  FilePlus2,
  CheckCircle2,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Code2,
  Boxes,
  BookText,
  Languages,
  Layers,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
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

  const searchParams = useSearchParams();
  const activeCategory = searchParams ? searchParams.get("category") || "" : "";
  const isDashboardRoute = pathname === "/dashboard";
  const [isExamsOpen, setIsExamsOpen] = useState(true);

  useEffect(() => {
    if (pathname === "/dashboard") {
      setIsExamsOpen(true);
    }
  }, [pathname, activeCategory]);

  const EXAM_SUB_CATEGORIES = [
    {
      title: "Tất cả đề thi",
      slug: "",
      href: "/dashboard",
      icon: Layers,
    },
    {
      title: "Lập trình Web",
      slug: "web",
      href: "/dashboard?category=web",
      icon: Code2,
    },
    {
      title: "Lập trình OOP",
      slug: "oop",
      href: "/dashboard?category=oop",
      icon: Boxes,
    },
    {
      title: "Chủ nghĩa xã hội (CNXH)",
      slug: "cnxh",
      href: "/dashboard?category=cnxh",
      icon: BookText,
    },
    {
      title: "Triết học Mác - Lênin",
      slug: "triet-hoc",
      href: "/dashboard?category=triet-hoc",
      icon: Sparkles,
    },
    {
      title: "Tiếng Anh Chuyên ngành",
      slug: "tieng-anh",
      href: "/dashboard?category=tieng-anh",
      icon: Languages,
    },
  ];

  const secondaryNavLinks = [
    {
      title: "Các câu đánh dấu",
      href: "/bookmarks",
      icon: Bookmark,
      badge: "Mới",
      active: pathname.startsWith("/bookmarks"),
    },
    {
      title: "Phân tích phong độ",
      href: "/analytics",
      icon: TrendingUp,
      badge: "Hot",
      active: pathname.startsWith("/analytics"),
    },
    {
      title: "Lịch sử làm bài",
      href: "/history",
      icon: History,
      badge: null,
      active: pathname.startsWith("/history"),
    },
  ];

  const adminNavLinks = [
    {
      title: "Quản lý Đề thi",
      href: "/admin",
      icon: ShieldCheck,
      badge: "Admin",
      active:
        pathname === "/admin" ||
        pathname.startsWith("/admin/dashboard") ||
        pathname.startsWith("/admin/exams"),
    },
    {
      title: "Tạo Đề thi mới",
      href: "/admin/create",
      icon: Wand2,
      badge: "AI",
      active:
        pathname.startsWith("/admin/create") ||
        pathname.startsWith("/admin/exams/create"),
    },
    {
      title: "Phòng Chấm bài",
      href: "/admin/grading",
      icon: Target,
      badge: "Duyệt",
      active:
        pathname.startsWith("/admin/grading") ||
        pathname.startsWith("/admin/submissions"),
    },
    {
      title: "Cài đặt Hệ thống",
      href: "/admin/settings",
      icon: Settings,
      badge: "Hệ thống",
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 sm:p-5">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand & Version */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href={user?.role === "admin" ? "/admin" : "/dashboard"}
            onClick={onCloseMobile}
            className="group flex items-center gap-3 transition-opacity hover:opacity-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all group-hover:border-indigo-500/40 group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                  ExamByHeu
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.2 rounded-full font-medium">
                  v2.0 Cyber
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng
                </span>
              </div>
            </div>
          </Link>

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section: Main Navigation (Chỉ hiển thị cho người dùng thông thường) */}
        {user?.role !== "admin" && (
          <div className="space-y-1.5">
            <p className="px-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
              ĐIỀU HƯỚNG CHÍNH
            </p>

            <nav className="space-y-1">
              {/* Accordion Item: Đề thi khả dụng */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isDashboardRoute) {
                      router.push("/dashboard");
                      setIsExamsOpen(true);
                    } else {
                      setIsExamsOpen((prev) => !prev);
                    }
                  }}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200 select-none",
                    isDashboardRoute
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                      : "text-slate-300 hover:bg-slate-900/80 hover:text-white hover:border hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen
                      className={cn(
                        "h-4 w-4 transition-transform group-hover:scale-110",
                        isDashboardRoute ? "text-white" : "text-indigo-400"
                      )}
                    />
                    <span>Đề thi khả dụng</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        isDashboardRoute
                          ? "bg-white/25 text-white border border-white/40 shadow-sm"
                          : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      )}
                    >
                      Thi thử
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        isExamsOpen
                          ? "rotate-180 text-white"
                          : "rotate-0 text-slate-400 group-hover:text-white"
                      )}
                    />
                  </div>
                </button>

                {/* Sub-menu with smooth downward expansion */}
                <AnimatePresence initial={false}>
                  {isExamsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 pl-3 border-l border-white/10 my-1 space-y-0.5">
                        {EXAM_SUB_CATEGORIES.map((sub) => {
                          const isSubActive =
                            isDashboardRoute && activeCategory === sub.slug;
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.slug || "all"}
                              href={sub.href}
                              onClick={onCloseMobile}
                              className={cn(
                                "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200",
                                isSubActive
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)] font-semibold"
                                  : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
                              )}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <SubIcon
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110",
                                    isSubActive ? "text-indigo-400" : "text-slate-500"
                                  )}
                                />
                                <span className="truncate">{sub.title}</span>
                              </div>
                              {isSubActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other Navigation items */}
              {secondaryNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                      item.active
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                        : "text-slate-300 hover:bg-slate-900/80 hover:text-white hover:border hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-transform group-hover:scale-110",
                          item.active ? "text-white" : "text-indigo-400"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          item.active
                            ? "bg-white/25 text-white border border-white/40 shadow-sm"
                            : "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Section: Admin Navigation (CHỈ HIỂN THỊ DUY NHẤT cho tài khoản Admin) */}
        {user?.role === "admin" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3">
              <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                QUẢN TRỊ & CHẤM THI
              </p>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[9px] font-semibold text-amber-300">
                Admin
              </span>
            </div>

            <nav className="space-y-1">
              {adminNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                      item.active
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_18px_rgba(99,102,241,0.35)]"
                        : "text-slate-300 hover:bg-slate-900/80 hover:text-white hover:border hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-transform group-hover:scale-110",
                          item.active ? "text-white" : "text-indigo-400"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          item.active
                            ? "bg-white/20 text-white"
                            : "bg-slate-900 text-slate-300 border border-white/5"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Section: User Profile & Logout */}
      <div className="mt-6 space-y-3 pt-4 border-t border-white/10">
        {user ? (
          <>
            <div className="flex items-center justify-between rounded-xl bg-slate-950/60 border border-white/10 p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-white text-xs shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 px-3 py-2 text-xs font-semibold transition-all active:scale-[0.99]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất / Thoát</span>
            </button>
          </>
        ) : (
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
          >
            <User className="h-3.5 w-3.5" />
            <span>Đăng nhập hệ thống</span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col bg-slate-950/80 backdrop-blur-xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
