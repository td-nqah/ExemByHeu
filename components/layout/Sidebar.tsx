"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentUser, setCurrentUser, getCategories } from "@/lib/store";
import { Profile, Category } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  History,
  BarChart2,
  ShieldCheck,
  FolderTree,
  Settings,
  LogOut,
  User,
  X,
  ChevronDown,
  Library,
  Layers,
  Sliders,
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
  if (lower === "user2") return "User2";
  if (lower === "user3") return "User3";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams ? searchParams.get("category") || "" : "";

  const [user, setUser] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [examsExpanded, setExamsExpanded] = useState<boolean>(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  // Load categories and sync dynamically with admin updates
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getCategories(true);
        setCategories(cats);
      } catch {}
    }
    fetchCategories();

    const handleUpdate = () => {
      fetchCategories();
    };
    window.addEventListener("categories_updated", handleUpdate);
    return () => window.removeEventListener("categories_updated", handleUpdate);
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setUser(null);
    router.push("/");
  };

  // Group 1: TỔNG QUAN / BÁO CÁO
  const overviewNavLinks = [
    {
      title: "Trang chủ",
      href: "/home",
      icon: Home,
      active: pathname === "/home",
    },
    {
      title: "Lịch sử làm bài",
      href: "/history",
      icon: History,
      active: pathname.startsWith("/history"),
    },
    {
      title: "Phân tích & Thống kê",
      href: "/analytics",
      icon: BarChart2,
      active: pathname.startsWith("/analytics"),
    },
  ];

  const isExamsRoute = pathname === "/dashboard" || pathname.startsWith("/exam");
  const isParentActive =
    (pathname === "/dashboard" && !activeCategory) || pathname.startsWith("/exam");

  // Group 3: QUẢN LÝ HỆ THỐNG
  const systemManagementNavLinks = [
    {
      title: "Danh mục",
      href: "/admin/categories",
      icon: FolderTree,
      active: pathname.startsWith("/admin/categories"),
    },
    {
      title: "Đề thi",
      href: "/admin/dashboard",
      icon: ShieldCheck,
      active:
        pathname === "/admin" ||
        pathname === "/admin/dashboard" ||
        (pathname.startsWith("/admin/exams") &&
          !pathname.startsWith("/admin/exams/create")),
    },
    {
      title: "Tài liệu",
      href: "/admin/materials",
      icon: Library,
      active: pathname.startsWith("/admin/materials"),
    },
  ];

  // Group 4: CẤU HÌNH HỆ THỐNG
  const systemConfigNavLinks = [
    {
      title: "Phân quyền",
      href: "/admin/permissions",
      icon: Sliders,
      active: pathname.startsWith("/admin/permissions"),
    },
    {
      title: "Cài đặt",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 sm:p-5 select-none overflow-y-auto custom-scrollbar">
      {/* Top Section */}
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="relative flex items-center justify-center pb-2 pt-1 w-full">
          <Link
            href="/home"
            onClick={onCloseMobile}
            className="w-full flex items-center justify-center transition-all duration-200 hover:opacity-90 active:scale-98 py-1 text-center"
          >
            <span className="font-heading text-2xl sm:text-[27px] font-black tracking-tight select-none">
              <span className="text-[#818cf8]">Exam</span>
              <span className="text-white">By</span>
              <span className="text-[#818cf8]">Heu</span>
            </span>
          </Link>

          {/* Close button on Mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-[#1f2937] hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. TỔNG QUAN / BÁO CÁO */}
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-extrabold tracking-wider text-[#818cf8] uppercase">
            TỔNG QUAN / BÁO CÁO
          </p>
          <nav className="space-y-1">
            {overviewNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-colors",
                    item.active
                      ? "bg-[#4f46e5]/15 text-indigo-300 font-semibold border border-[#4f46e5]/30 shadow-sm"
                      : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      item.active ? "text-[#6366f1]" : "text-[#9ca3af] group-hover:text-white"
                    )}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 2. LÝ THUYẾT / BÀI TẬP */}
        <div className="space-y-1.5 pt-2 border-t border-[#1f2937]">
          <p className="px-3 text-[11px] font-extrabold tracking-wider text-[#818cf8] uppercase">
            LÝ THUYẾT / BÀI TẬP
          </p>
          <div className="space-y-1">
            {/* Mục 1: Tổng hợp kiến thức */}
            <Link
              href="/knowledge"
              onClick={onCloseMobile}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-colors select-none",
                pathname.startsWith("/knowledge")
                  ? "bg-[#4f46e5]/15 text-indigo-300 font-semibold border border-[#4f46e5]/30 shadow-sm"
                  : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
              )}
            >
              <BookOpen
                className={cn(
                  "h-4 w-4 shrink-0",
                  pathname.startsWith("/knowledge")
                    ? "text-[#6366f1]"
                    : "text-[#9ca3af] group-hover:text-[#6366f1]"
                )}
              />
              <span className="truncate">Tổng hợp kiến thức</span>
            </Link>

            {/* Mục 2: Accordion Parent: Danh sách Đề thi */}
            <div
              className={cn(
                "group flex h-9 items-center justify-between rounded-xl px-3 text-xs font-medium transition-colors select-none",
                isParentActive
                  ? "bg-[#4f46e5]/15 text-indigo-300 font-semibold border border-[#4f46e5]/30 shadow-sm"
                  : isExamsRoute
                  ? "text-slate-200 hover:bg-[#111827]"
                  : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
              )}
            >
              <Link
                href="/dashboard"
                onClick={() => {
                  onCloseMobile();
                }}
                className="flex h-full flex-1 items-center gap-3 truncate"
              >
                <Layers
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isParentActive || isExamsRoute
                      ? "text-[#6366f1]"
                      : "text-[#9ca3af] group-hover:text-white"
                  )}
                />
                <span className="truncate">Danh sách Đề thi</span>
              </Link>

              {/* Chevron toggle button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExamsExpanded((prev) => !prev);
                }}
                aria-label="Mở hoặc đóng danh mục đề thi"
                className="flex h-5 w-5 shrink-0 items-center justify-center -mr-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                    examsExpanded && "rotate-180 text-white"
                  )}
                />
              </button>
            </div>

            {/* Sub-menu: Dynamic Categories (Tree View with Scroll Down Animation) */}
            <AnimatePresence>
              {examsExpanded && categories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="relative mt-1 ml-5 pl-2.5 space-y-1 border-l border-[#1f2937] overflow-hidden"
                >
                  {categories.map((cat) => {
                    const isSubActive =
                      pathname === "/dashboard" &&
                      (activeCategory === cat.slug || activeCategory === cat.id);
                    return (
                      <Link
                        key={cat.id}
                        href={`/dashboard?category=${encodeURIComponent(cat.slug || cat.id)}`}
                        onClick={onCloseMobile}
                        className={cn(
                          "group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                          isSubActive
                            ? "bg-[#4f46e5]/15 text-white font-semibold border border-[#4f46e5]/30"
                            : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
                        )}
                      >
                        <span className="truncate">{cat.name}</span>
                        {isSubActive && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366f1] shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        )}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. QUẢN LÝ HỆ THỐNG (Only when Admin) */}
        {user?.role === "admin" && (
          <div className="space-y-1.5 pt-2 border-t border-[#1f2937]">
            <p className="px-3 text-[11px] font-extrabold tracking-wider text-[#818cf8] uppercase">
              QUẢN LÝ HỆ THỐNG
            </p>
            <nav className="space-y-1">
              {systemManagementNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-colors",
                      item.active
                        ? "bg-[#4f46e5]/15 text-indigo-300 font-semibold border border-[#4f46e5]/30 shadow-sm"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.active ? "text-[#6366f1]" : "text-[#9ca3af] group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* 4. CẤU HÌNH HỆ THỐNG (Only when Admin) */}
        {user?.role === "admin" && (
          <div className="space-y-1.5 pt-2 border-t border-[#1f2937]">
            <p className="px-3 text-[11px] font-extrabold tracking-wider text-[#818cf8] uppercase">
              CẤU HÌNH HỆ THỐNG
            </p>
            <nav className="space-y-1">
              {systemConfigNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "group flex h-9 items-center gap-3 rounded-xl px-3 text-xs font-medium transition-colors",
                      item.active
                        ? "bg-[#4f46e5]/15 text-indigo-300 font-semibold border border-[#4f46e5]/30 shadow-sm"
                        : "text-[#9ca3af] hover:text-white hover:bg-[#111827]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.active ? "text-[#6366f1]" : "text-[#9ca3af] group-hover:text-white"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Bottom Section: Minimal Profile & Logout */}
      <div className="space-y-2.5 pt-3 border-t border-[#1f2937]">
        {user ? (
          <>
            <div className="flex items-center justify-between rounded-xl bg-[#0b0f19] border border-[#1f2937] p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1f2937] border border-[#1f2937] font-bold text-white text-xs">
                  {formatDisplayName(user.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {formatDisplayName(user.username)}
                  </p>
                  <p className="text-[10px] text-[#9ca3af] truncate">
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </button>
          </>
        ) : (
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] hover:bg-[#6366f1] px-3 py-2 text-xs font-semibold text-white transition-colors"
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
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col bg-[#111827]/95 backdrop-blur-xl border-r border-[#1f2937]">
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
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-[#111827]/98 backdrop-blur-2xl border-r border-[#1f2937]">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
