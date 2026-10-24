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
    <ShadcnSidebar collapsible="icon">
      {/* 1. Header: Logo / Brand & Toggle Trigger */}
      <SidebarHeader className="border-b border-black/[0.04] px-4 py-3.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2.5">
        {/* In Expanded Mode */}
        <div className="relative flex items-center justify-between w-full min-h-[40px] group-data-[collapsible=icon]:hidden">
          {/* Brand Logo & Name: Căn giữa sidebar trên cả mobile và máy tính */}
          <Link
            href="/home"
            onClick={closeSidebarOnNavigate}
            title="ExamByHeu - Nền tảng Ôn luyện"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full glass-icon">
              <GraduationCap className="h-5 w-5 text-[#111827] dark:text-white" strokeWidth={2} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="brand-logo font-heading text-[17px] font-black tracking-tight leading-tight select-none">
                <span className="text-[#111827] dark:text-white">Exam</span>
                <span className="text-[#9CA3AF]">By</span>
                <span className="text-[#111827] dark:text-white">Heu</span>
              </span>
            </div>
          </Link>

          {/* Nút Hamburger bên phải: Bỏ dấu X, tròn và autofit với sidebar */}
          <SidebarTrigger
            title="Thu nhỏ sidebar (Ctrl+B)"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#14161D] text-[#111827] dark:text-white hover:bg-[#F6F6F8] dark:hover:bg-white/[0.08] shadow-xs active:scale-95 transition cursor-pointer select-none"
          >
            <Menu className="h-4.5 w-4.5" strokeWidth={2.25} />
          </SidebarTrigger>
        </div>

        {/* In Collapsed Icon Mode: Hiện logo cái mũ cử nhân + nút 3 gạch bo tròn */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center gap-2.5 py-1 w-full">
          {/* Logo cái mũ cử nhân */}
          <Link
            href="/home"
            onClick={closeSidebarOnNavigate}
            title="ExamByHeu - Trang chủ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full glass-icon hover:scale-105 active:scale-95 transition-all select-none"
          >
            <GraduationCap className="h-5 w-5 text-[#111827] dark:text-white" strokeWidth={2} />
          </Link>

          {/* Nút 3 gạch mở rộng */}
          <SidebarTrigger
            title="Mở rộng sidebar (Ctrl+B)"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#111827] hover:bg-[#F6F6F8] shadow-xs active:scale-95 transition shadow-sm cursor-pointer select-none"
          >
            <Menu className="h-4.5 w-4.5" strokeWidth={2.25} />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      {/* 2. Content: Groups & Navigation Menu */}
      <SidebarContent className="px-2.5 py-3 custom-scrollbar">
        {/* Nhóm 1: TỔNG QUAN / BÁO CÁO */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#9CA3AF]">
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
                            item.active ? "text-white dark:text-[#0A0B0E]" : "text-[#4B5563] dark:text-[#9CA3AF]"
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
          <SidebarGroupLabel className="text-[#9CA3AF]">
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
                        pathname.startsWith("/knowledge") ? "text-white dark:text-[#0A0B0E]" : "text-[#4B5563] dark:text-[#9CA3AF]"
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
                          isParentActive ? "text-white dark:text-[#0A0B0E]" : "text-[#4B5563] dark:text-[#9CA3AF]"
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
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer group-data-[collapsible=icon]:hidden mr-1"
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        examsExpanded && "rotate-180"
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
                                  className="flex items-center justify-between w-full"
                                >
                                  <span className="truncate">{cat.name}</span>
                                  {isSubActive && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white dark:bg-[#0A0B0E]" />
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
              <SidebarGroupLabel className="text-[#9CA3AF]">
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
                                item.active ? "text-white dark:text-[#0A0B0E]" : "text-[#4B5563] dark:text-[#9CA3AF]"
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
              <SidebarGroupLabel className="text-[#9CA3AF]">
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
                                item.active ? "text-white dark:text-[#0A0B0E]" : "text-[#4B5563] dark:text-[#9CA3AF]"
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
      <SidebarFooter className="border-t border-black/[0.06] p-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2.5 group-data-[collapsible=icon]:items-center">
        {user ? (
          <div className="flex flex-col gap-2 w-full group-data-[collapsible=icon]:items-center">
            {/* User Profile Card */}
            <div className="flex items-center justify-between rounded-2xl bg-[#F1F2F5] dark:bg-[#121318] border border-black/[0.1] dark:border-white/[0.12] shadow-xs dark:shadow-[0_2px_8px_rgba(0,0,0,0.45)] p-2.5 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:w-full">
              <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                <div
                  title={`${formatDisplayName(user.username)} (${user.role === "admin" ? "Quản trị viên" : "Người dùng"})`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white dark:bg-[#1A1C24] border border-black/[0.08] dark:border-white/[0.1] font-bold text-[#111827] dark:text-white text-xs select-none cursor-default shadow-2xs group-data-[collapsible=icon]:mx-auto"
                >
                  {formatDisplayName(user.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-xs font-semibold text-[#111827] dark:text-white">
                    {formatDisplayName(user.username)}
                  </p>
                  <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button - Styled in prominent Red */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 dark:bg-rose-500/15 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white border border-rose-500/20 dark:border-rose-500/30 hover:border-rose-600 dark:hover:border-rose-600 px-3 py-2 text-xs font-semibold transition-all cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:mx-auto"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <Link
            href="/"
            title="Đăng nhập hệ thống"
            onClick={closeSidebarOnNavigate}
            className="flex w-full items-center justify-center gap-2 rounded-xl glass-btn px-3 py-2 text-xs font-semibold text-[#111827] transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:mx-auto"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Đăng nhập</span>
          </Link>
        )}
      </SidebarFooter>

    </ShadcnSidebar>
  );
}
