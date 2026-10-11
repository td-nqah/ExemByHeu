"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser } from "@/lib/store";
import { Profile } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  GraduationCap,
  Home,
  BookOpen,
  History,
  BarChart2,
  ShieldCheck,
  FolderTree,
  Wand2,
  Target,
  Settings,
  LogOut,
  User,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function formatDisplayName(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/!+$/, "");
  const lower = cleaned.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "user1") return "User1";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
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

  // Exactly 4 streamlined menu items: 'Trang chủ', 'Đề thi', 'Lịch sử', 'Phân tích'
  const userNavLinks = [
    {
      title: "Trang chủ",
      href: "/dashboard",
      icon: Home,
      active: false,
    },
    {
      title: "Đề thi",
      href: "/dashboard",
      icon: BookOpen,
      active: pathname === "/dashboard" || pathname.startsWith("/exam"),
    },
    {
      title: "Lịch sử",
      href: "/history",
      icon: History,
      active: pathname.startsWith("/history"),
    },
    {
      title: "Phân tích",
      href: "/analytics",
      icon: BarChart2,
      active: pathname.startsWith("/analytics"),
    },
  ];

  const adminNavLinks = [
    {
      title: "Quản lý Đề thi",
      href: "/admin",
      icon: ShieldCheck,
      badge: "ADMIN",
      active:
        pathname === "/admin" ||
        pathname === "/admin/dashboard" ||
        (pathname.startsWith("/admin/exams") &&
          !pathname.startsWith("/admin/exams/create")),
    },
    {
      title: "Quản lý Danh mục",
      href: "/admin/categories",
      icon: FolderTree,
      badge: "MỚI",
      active: pathname.startsWith("/admin/categories"),
    },
    {
      title: "Tạo Đề thi mới",
      href: "/admin/create",
      icon: Wand2,
      badge: "AI",
      active:
        pathname === "/admin/create" ||
        pathname.startsWith("/admin/create") ||
        pathname.startsWith("/admin/exams/create"),
    },
    {
      title: "Phòng Chấm bài",
      href: "/admin/grading",
      icon: Target,
      badge: "DUYỆT",
      active:
        pathname.startsWith("/admin/grading") ||
        pathname.startsWith("/admin/submissions"),
    },
    {
      title: "Cài đặt Hệ thống",
      href: "/admin/settings",
      icon: Settings,
      badge: "HỆ THỐNG",
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 sm:p-5 select-none">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href={user?.role === "admin" ? "/admin" : "/dashboard"}
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2538] border border-white/[0.08] text-white">
              <GraduationCap className="h-4.5 w-4.5 text-slate-200" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              ExamByHeu
            </span>
          </Link>

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-[#161c28] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Navigation Items (Only 4 items) */}
        <nav className="space-y-1">
          {userNavLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                  item.active
                    ? "bg-[#1e2538] text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-[#151b27]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    item.active ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Section (Only when Admin) */}
        {user?.role === "admin" && (
          <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              QUẢN TRỊ & CHẤM THI
            </p>
            <nav className="space-y-1">
              {adminNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                      item.active
                        ? "bg-[#1e2538] text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-[#151b27]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-white" />
                      <span className="truncate">{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0",
                          item.active
                            ? "bg-white/20 text-white"
                            : "bg-[#1f2637] text-slate-400 border border-white/[0.05]"
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

      {/* Bottom Section: Minimal Profile & Logout */}
      <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
        {user ? (
          <>
            <div className="flex items-center justify-between rounded-xl bg-[#151b27] border border-white/[0.06] p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#202738] font-bold text-white text-xs">
                  {formatDisplayName(user.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {formatDisplayName(user.username)}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 px-3 py-2 text-xs font-semibold transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất / Thoát</span>
            </button>
          </>
        ) : (
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f57ea] hover:bg-[#434ac9] px-3 py-2 text-xs font-semibold text-white transition-colors"
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
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col bg-[#10141e] border-r border-white/[0.06]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-[#10141e] border-r border-white/[0.06]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
