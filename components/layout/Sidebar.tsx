"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentUser, setCurrentUser, getCategories } from "@/lib/store";
import { Profile, Category } from "@/types/exam";
import { cn } from "@/lib/utils";
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
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
  GraduationCap,
  Menu,
} from "lucide-react";

export interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
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

export function Sidebar({ mobileOpen: _legacyMobileOpen, onCloseMobile: _legacyOnCloseMobile }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams ? searchParams.get("category") || "" : "";

  const { isMobile, setOpenMobile } = useSidebar();

  const [user, setUser] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [examsExpanded, setExamsExpanded] = useState<boolean>(false);

  const closeSidebarOnNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    _legacyOnCloseMobile?.();
  };

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
    closeSidebarOnNavigate();
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
      title: "Lịch sử đánh giá",
      href: "/history",
      icon: History,
      active: pathname.startsWith("/history"),
    },
    {
      title: "Kết quả học tập",
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

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-[#1f2937] bg-[#111827]">
      {/* 1. Header: Logo / Brand & Toggle Trigger */}
      <SidebarHeader className="border-b border-[#1f2937]/70 p-3.5">
        <div className="relative flex items-center justify-center w-full min-h-[36px] group-data-[collapsible=icon]:justify-center">
          {/* Brand Logo & Name: Căn giữa sidebar trên cả mobile và máy tính */}
          <Link
            href="/home"
            onClick={closeSidebarOnNavigate}
            title="ExamByHeu - Nền tảng Ôn luyện"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none group-data-[collapsible=icon]:hidden"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-heading text-xl font-black tracking-tight leading-tight select-none">
                <span className="text-[#818cf8]">Exam</span>
                <span className="text-white">By</span>
                <span className="text-[#818cf8]">Heu</span>
              </span>
            </div>
          </Link>

          {/* Nút Hamburger bên phải: Bỏ dấu X, dùng nút Hamburger đóng/thu nhỏ cho cả điện thoại và máy tính */}
          <SidebarTrigger
            title="Thu nhỏ / Đóng sidebar (Ctrl+B)"
            className="absolute right-0 flex h-8 w-8 items-center justify-center rounded-xl border border-[#1f2937] bg-[#111827] text-slate-400 hover:text-white hover:bg-[#1f2937] active:scale-95 transition cursor-pointer select-none group-data-[collapsible=icon]:hidden"
          >
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        </div>

        {/* In Collapsed Icon Mode: Centered Trigger Button */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center pt-0.5">
          <SidebarTrigger
            title="Mở rộng sidebar (Ctrl+B)"
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      {/* 2. Content: Groups & Navigation Menu */}
      <SidebarContent className="px-2 py-3 custom-scrollbar">
        {/* Nhóm 1: TỔNG QUAN / BÁO CÁO */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#818cf8]">
            TỔNG QUAN / BÁO CÁO
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {overviewNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.title}
                    >
                      <Link href={item.href} onClick={closeSidebarOnNavigate}>
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            item.active ? "text-[#6366f1]" : "text-[#9ca3af]"
                          )}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        {/* Nhóm 2: HỌC LIỆU / ĐÁNH GIÁ */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#818cf8]">
            HỌC LIỆU / ĐÁNH GIÁ
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Mục 1: Tài liệu ôn tập */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/knowledge")}
                  tooltip="Tài liệu ôn tập"
                >
                  <Link href="/knowledge" onClick={closeSidebarOnNavigate}>
                    <BookOpen
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        pathname.startsWith("/knowledge")
                          ? "text-[#6366f1]"
                          : "text-[#9ca3af]"
                      )}
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Tài liệu ôn tập
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Mục 2: Ngân hàng đề thi */}
              <SidebarMenuItem>
                <div className="flex w-full items-center">
                  <SidebarMenuButton
                    asChild
                    isActive={isParentActive}
                    tooltip="Ngân hàng đề thi"
                    className="flex-1"
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => {
                        setExamsExpanded((prev) => !prev);
                        closeSidebarOnNavigate();
                      }}
                    >
                      <Layers
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isParentActive || isExamsRoute
                            ? "text-[#6366f1]"
                            : "text-[#9ca3af]"
                        )}
                      />
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        Ngân hàng đề thi
                      </span>
                    </Link>
                  </SidebarMenuButton>

                  {/* Nút bấm Chevron sổ xuống (chỉ hiện khi sidebar mở rộng) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExamsExpanded((prev) => !prev);
                    }}
                    aria-label="Mở hoặc đóng danh mục đề thi"
                    title={examsExpanded ? "Thu gọn danh mục" : "Mở rộng danh mục"}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer group-data-[collapsible=icon]:hidden mr-1"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        examsExpanded && "rotate-180 text-white"
                      )}
                    />
                  </button>
                </div>

                {/* Submenu: Dynamic Categories */}
                <AnimatePresence>
                  {examsExpanded && categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden group-data-[collapsible=icon]:hidden"
                    >
                      <SidebarMenuSub>
                        {categories.map((cat) => {
                          const isSubActive =
                            pathname === "/dashboard" &&
                            (activeCategory === cat.slug || activeCategory === cat.id);
                          return (
                            <SidebarMenuSubItem key={cat.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                              >
                                <Link
                                  href={`/dashboard?category=${encodeURIComponent(
                                    cat.slug || cat.id
                                  )}`}
                                  onClick={closeSidebarOnNavigate}
                                  className="flex items-center justify-between"
                                >
                                  <span className="truncate">{cat.name}</span>
                                  {isSubActive && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6366f1] shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Nhóm 3: QUẢN LÝ HỆ THỐNG (Chỉ dành cho Quản trị viên) */}
        {user?.role === "admin" && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[#818cf8]">
                QUẢN LÝ HỆ THỐNG
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemManagementNavLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.active}
                          tooltip={item.title}
                        >
                          <Link href={item.href} onClick={closeSidebarOnNavigate}>
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                item.active ? "text-[#6366f1]" : "text-[#9ca3af]"
                              )}
                            />
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Nhóm 4: CẤU HÌNH HỆ THỐNG (Chỉ dành cho Quản trị viên) */}
        {user?.role === "admin" && (
          <>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[#818cf8]">
                CẤU HÌNH HỆ THỐNG
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemConfigNavLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.active}
                          tooltip={item.title}
                        >
                          <Link href={item.href} onClick={closeSidebarOnNavigate}>
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                item.active ? "text-[#6366f1]" : "text-[#9ca3af]"
                              )}
                            />
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* 3. Footer: User Profile & Đăng xuất */}
      <SidebarFooter className="border-t border-[#1f2937] p-3">
        {user ? (
          <div className="flex flex-col gap-2">
            {/* User Profile Card */}
            <div className="flex items-center justify-between rounded-xl bg-[#0b0f19] border border-[#1f2937] p-2.5 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-transparent">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  title={`${formatDisplayName(user.username)} (${user.role === "admin" ? "Quản trị viên" : "Người dùng"})`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1f2937] border border-[#1f2937] font-bold text-white text-xs select-none shadow-sm cursor-default"
                >
                  {formatDisplayName(user.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-xs font-semibold text-white">
                    {formatDisplayName(user.username)}
                  </p>
                  <p className="text-[10px] text-[#9ca3af] truncate">
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:mx-auto"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <Link
            href="/"
            title="Đăng nhập hệ thống"
            onClick={closeSidebarOnNavigate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] hover:bg-[#6366f1] px-3 py-2 text-xs font-semibold text-white transition-colors group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:mx-auto"
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Đăng nhập</span>
          </Link>
        )}
      </SidebarFooter>

      {/* 4. Rail: Expand/Collapse hover drag bar */}
      <SidebarRail />
    </ShadcnSidebar>
  );
}
