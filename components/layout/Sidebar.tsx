"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { getCurrentUser, setCurrentUser, getCategories, getExams } from "@/lib/store";
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
  History,
  BookOpen,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Menu,
  Shield,
  FileText,
  BarChart2,
  GraduationCap,
} from "lucide-react";

export interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function formatDisplayName(name?: string, role?: string): string {
  if (role === "admin") return "Admin";
  if (!name) return "";
  const cleaned = name.trim().replace(/!+$/, "");
  const lower = cleaned.toLowerCase();
  if (lower === "admin" || lower === "adm") return "Admin";
  if (lower === "user1") return "User1";
  if (lower === "user2") return "User2";
  if (lower === "user3") return "User3";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}


function SidebarActivePill() {
  return (
    <motion.span
      layoutId="sidebar-flying-pill"
      className="absolute inset-0 rounded-xl bg-indigo-600 shadow-sm shadow-black/30 border border-indigo-400/30 pointer-events-none group-data-[collapsible=icon]:rounded-full z-0"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      }}
    />
  );
}

function SidebarSubActivePill() {
  return (
    <motion.span
      layoutId="sidebar-sub-flying-pill"
      className="absolute inset-0 rounded-lg bg-indigo-600/60 border border-indigo-400/25 shadow-xs pointer-events-none z-0"
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 26,
        mass: 0.7,
      }}
    />
  );
}

export function Sidebar({ onCloseMobile }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams ? searchParams.get("category") || "" : "";

  const { isMobile, setOpenMobile } = useSidebar();

  const [user, setUser] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [examsCount, setExamsCount] = useState<number>(14);
  const [examsExpanded, setExamsExpanded] = useState<boolean>(() => {
    return pathname === "/dashboard" || pathname.startsWith("/exam");
  });

  const closeSidebarOnNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    onCloseMobile?.();
  };

  useEffect(() => {
    setUser(getCurrentUser());
  }, [pathname]);

  // Tự động mở rộng khi vào mục Ngân hàng đề thi, tự động thu gọn khi chọn chức năng khác
  useEffect(() => {
    if (pathname === "/dashboard" || pathname.startsWith("/exam")) {
      setExamsExpanded(true);
    } else {
      setExamsExpanded(false);
    }
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

    // Fetch exam count for the badge next to "Đề thi"
    getExams(false)
      .then((list) => {
        if (list && list.length > 0) {
          setExamsCount(list.length);
        }
      })
      .catch(() => {});

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

  // Navigation Active States
  const getActiveNavKey = (): string => {
    if (pathname === "/home") return "/home";
    if (pathname.startsWith("/history")) return "/history";
    if (pathname.startsWith("/knowledge")) return "/knowledge";
    if (pathname === "/dashboard" || pathname.startsWith("/exam")) return "/dashboard";
    if (pathname.startsWith("/admin/categories")) return "/admin/categories";
    if (
      pathname === "/admin" ||
      pathname === "/admin/dashboard" ||
      (pathname.startsWith("/admin/exams") &&
        !pathname.startsWith("/admin/exams/create"))
    ) {
      return "/admin/dashboard";
    }
    if (pathname.startsWith("/admin/materials")) return "/admin/materials";
    if (pathname.startsWith("/admin/permissions")) return "/admin/permissions";
    if (pathname.startsWith("/admin/settings")) return "/admin/settings";
    return "";
  };

  const [activeNavKey, setActiveNavKey] = useState<string>(() => getActiveNavKey());

  useEffect(() => {
    const current = getActiveNavKey();
    if (current) {
      setActiveNavKey(current);
    }
  }, [pathname]);

  const [activeSubKey, setActiveSubKey] = useState<string>(() =>
    pathname === "/dashboard" ? activeCategory : ""
  );

  useEffect(() => {
    if (pathname === "/dashboard") {
      setActiveSubKey(activeCategory);
    } else {
      setActiveSubKey("");
    }
  }, [pathname, activeCategory]);

  const handleNavClick = (href: string) => {
    setActiveNavKey(href);
    if (href === "/dashboard") {
      setExamsExpanded(true);
    } else {
      setExamsExpanded(false);
    }
    closeSidebarOnNavigate();
  };

  const handleSubClick = (catKey: string) => {
    setActiveSubKey(catKey);
    setActiveNavKey("/dashboard");
    setExamsExpanded(true);
    closeSidebarOnNavigate();
  };

  // Group 1: TỔNG QUAN / BÁO CÁO (Đã bỏ Kết quả học tập)
  const overviewNavLinks = [
    {
      title: "Trang chủ",
      href: "/home",
      icon: Home,
    },
    {
      title: "Lịch sử đánh giá",
      href: "/history",
      icon: History,
    },
  ];

  // Group 3: QUẢN LÝ HỆ THỐNG
  const systemManagementNavLinks = [
    {
      title: "Danh mục",
      href: "/admin/categories",
      icon: Menu,
    },
    {
      title: "Đề thi",
      href: "/admin/dashboard",
      icon: FileText,
      badge: examsCount,
    },
    {
      title: "Tài liệu",
      href: "/admin/materials",
      icon: BarChart2,
    },
  ];

  // Group 4: CẤU HÌNH HỆ THỐNG
  const systemConfigNavLinks = [
    {
      title: "Phân quyền",
      href: "/admin/permissions",
      icon: User,
    },
    {
      title: "Cài đặt",
      href: "/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <ShadcnSidebar collapsible="icon">
      {/* 1. Header: Logo / Brand & Toggle Trigger */}
      <SidebarHeader className="border-b border-[#1f2937]/70 px-3.5 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2.5">
        {/* In Expanded Mode */}
        <div className="relative flex items-center justify-between w-full min-h-[44px] group-data-[collapsible=icon]:hidden">
          {/* Brand Logo & Name: Exam (Trắng) ByHeu (Tím) */}
          <Link
            href="/home"
            onClick={() => handleNavClick("/home")}
            title="ExamByHeu - Hệ thống đánh giá"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none min-w-0"
          >
            {/* Squircle Glowing Purple Icon Box */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-black/40 border border-indigo-400/20">
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.2} />
            </div>

            {/* Brand Text: Exam Trắng - ByHeu Tím */}
            <div className="flex flex-col min-w-0">
              <span className="brand-logo font-heading text-[19px] font-black tracking-tight leading-none select-none">
                <span className="text-white">Exam</span>
                <span className="text-[#818cf8]">ByHeu</span>
              </span>
              <span className="text-[11px] font-medium text-[#9ca3af] leading-none mt-1">
                Hệ thống đánh giá
              </span>
            </div>
          </Link>

          {/* Squircle Close / Toggle Button bên phải */}
          <SidebarTrigger
            title="Thu nhỏ sidebar (Ctrl+B)"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#334155]/60 bg-[#1e293b]/50 hover:bg-[#1e293b] text-slate-300 hover:text-white active:scale-95 transition cursor-pointer select-none shadow-sm ml-2"
          >
            <Menu className="h-4.5 w-4.5" strokeWidth={2.2} />
          </SidebarTrigger>
        </div>

        {/* In Collapsed Icon Mode */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center gap-2.5 py-1 w-full">
          <Link
            href="/home"
            onClick={() => handleNavClick("/home")}
            title="ExamByHeu - Trang chủ"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-black/40 hover:scale-105 active:scale-95 transition-all select-none border border-indigo-400/20"
          >
            <GraduationCap className="h-5 w-5" />
          </Link>

          <SidebarTrigger
            title="Mở rộng sidebar (Ctrl+B)"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#334155]/60 bg-[#1e293b]/50 hover:bg-[#1e293b] text-slate-300 hover:text-white active:scale-95 transition shadow-sm cursor-pointer select-none"
          >
            <Menu className="h-4.5 w-4.5" strokeWidth={2.2} />
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      {/* 2. Content: Groups & Navigation Menu (Khung tím bay lướt khi ấn chọn chức năng) */}
      <SidebarContent className="px-2.5 py-3 custom-scrollbar space-y-2">
        <LayoutGroup id="sidebar-nav">
          {/* Nhóm 1: TỔNG QUAN / BÁO CÁO */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[#818cf8] text-[11px] font-bold tracking-wider uppercase px-2.5 mb-1">
              TỔNG QUAN / BÁO CÁO
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {overviewNavLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNavKey === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link
                          href={item.href}
                          onClick={() => handleNavClick(item.href)}
                          className="relative flex items-center gap-2.5 w-full"
                        >
                          {isActive && <SidebarActivePill />}
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors relative z-10",
                              isActive ? "text-white" : "text-slate-300"
                            )}
                          />
                          <span
                            className={cn(
                              "truncate group-data-[collapsible=icon]:hidden relative z-10",
                              isActive
                                ? "text-white font-semibold"
                                : "text-slate-300"
                            )}
                          >
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

          {/* Gạch ngang phân cách giữa Nhóm 1 và Nhóm 2 */}
          <SidebarSeparator className="my-2 bg-[#334155]/60" />

          {/* Nhóm 2: HỌC LIỆU / ĐÁNH GIÁ */}
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[#818cf8] text-[11px] font-bold tracking-wider uppercase px-2.5 mb-1">
              HỌC LIỆU / ĐÁNH GIÁ
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {/* Mục 1: Tài liệu ôn tập */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeNavKey === "/knowledge"}
                    tooltip="Tài liệu ôn tập"
                  >
                    <Link
                      href="/knowledge"
                      onClick={() => handleNavClick("/knowledge")}
                      className="relative flex items-center gap-2.5 w-full"
                    >
                      {activeNavKey === "/knowledge" && <SidebarActivePill />}
                      <BookOpen
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors relative z-10",
                          activeNavKey === "/knowledge"
                            ? "text-white"
                            : "text-slate-300"
                        )}
                      />
                      <span
                        className={cn(
                          "truncate group-data-[collapsible=icon]:hidden relative z-10",
                          activeNavKey === "/knowledge"
                            ? "text-white font-semibold"
                            : "text-slate-300"
                        )}
                      >
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
                      isActive={activeNavKey === "/dashboard"}
                      tooltip="Ngân hàng đề thi"
                      className="flex-1"
                    >
                      <Link
                        href="/dashboard"
                        onClick={() => {
                          handleNavClick("/dashboard");
                        }}
                        className="relative flex items-center gap-2.5 w-full"
                      >
                        {activeNavKey === "/dashboard" && <SidebarActivePill />}
                        <Shield
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors relative z-10",
                            activeNavKey === "/dashboard"
                              ? "text-white"
                              : "text-slate-300"
                          )}
                        />
                        <span
                          className={cn(
                            "truncate group-data-[collapsible=icon]:hidden relative z-10",
                            activeNavKey === "/dashboard"
                              ? "text-white font-semibold"
                              : "text-slate-300"
                          )}
                        >
                          Ngân hàng đề thi
                        </span>
                      </Link>
                    </SidebarMenuButton>

                    {/* Nút bấm Chevron sổ xuống */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExamsExpanded((prev) => !prev);
                      }}
                      aria-label="Mở hoặc đóng danh mục đề thi"
                      title={examsExpanded ? "Thu gọn danh mục" : "Mở rộng danh mục"}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer group-data-[collapsible=icon]:hidden mr-1"
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
                        <SidebarMenuSub className="pl-6 pr-1 py-1 space-y-1">
                          <LayoutGroup id="sidebar-sub-nav">
                            {categories.map((cat) => {
                              const catKey = cat.slug || cat.id;
                              const isSubActive = activeSubKey === catKey;

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
                                      onClick={() => handleSubClick(catKey)}
                                      className="relative flex items-center justify-between w-full text-xs py-1"
                                    >
                                      {isSubActive && (
                                        <SidebarSubActivePill />
                                      )}
                                      <span
                                        className={cn(
                                          "truncate relative z-10",
                                          isSubActive
                                            ? "text-white font-medium"
                                            : "text-slate-300"
                                        )}
                                      >
                                        {cat.name}
                                      </span>
                                      {isSubActive && (
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white relative z-10" />
                                      )}
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </LayoutGroup>
                        </SidebarMenuSub>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Nhóm 3: QUẢN LÝ HỆ THỐNG */}
          {user?.role === "admin" && (
            <>
              {/* Gạch ngang phân cách giữa Nhóm 2 và Nhóm 3 */}
              <SidebarSeparator className="my-2 bg-[#334155]/60" />

              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="text-[#818cf8] text-[11px] font-bold tracking-wider uppercase px-2.5 mb-1">
                  QUẢN LÝ HỆ THỐNG
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {systemManagementNavLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNavKey === item.href;

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Link
                              href={item.href}
                              onClick={() => handleNavClick(item.href)}
                              className="relative flex items-center gap-2.5 w-full"
                            >
                              {isActive && <SidebarActivePill />}
                              <Icon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors relative z-10",
                                  isActive
                                    ? "text-white"
                                    : "text-slate-300"
                                )}
                              />
                              <span
                                className={cn(
                                  "truncate group-data-[collapsible=icon]:hidden relative z-10",
                                  isActive
                                    ? "text-white font-semibold"
                                    : "text-slate-300"
                                )}
                              >
                                {item.title}
                              </span>
                              {/* Badge số lượng đề thi */}
                              {item.badge !== undefined && (
                                <span className="ml-auto flex items-center justify-center min-w-[22px] h-5 px-2 rounded-full bg-rose-600 text-white text-xs font-bold font-heading shadow-xs group-data-[collapsible=icon]:hidden relative z-10">
                                  {item.badge}
                                </span>
                              )}
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

          {/* Nhóm 4: CẤU HÌNH HỆ THỐNG */}
          {user?.role === "admin" && (
            <>
              {/* Gạch ngang phân cách giữa Nhóm 3 và Nhóm 4 */}
              <SidebarSeparator className="my-2 bg-[#334155]/60" />

              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="text-[#818cf8] text-[11px] font-bold tracking-wider uppercase px-2.5 mb-1">
                  CẤU HÌNH HỆ THỐNG
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {systemConfigNavLinks.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNavKey === item.href;

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Link
                              href={item.href}
                              onClick={() => handleNavClick(item.href)}
                              className="relative flex items-center gap-2.5 w-full"
                            >
                              {isActive && <SidebarActivePill />}
                              <Icon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors relative z-10",
                                  isActive
                                    ? "text-white"
                                    : "text-slate-300"
                                )}
                              />
                              <span
                                className={cn(
                                  "truncate group-data-[collapsible=icon]:hidden relative z-10",
                                  isActive
                                    ? "text-white font-semibold"
                                    : "text-slate-300"
                                )}
                              >
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
        </LayoutGroup>
      </SidebarContent>

      {/* 3. Footer: User Profile & Đăng xuất */}
      <SidebarFooter className="border-t border-[#1f2937]/70 p-2.5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:items-center">
        {user ? (
          <div className="flex flex-col gap-2 w-full group-data-[collapsible=icon]:items-center">
            {/* User Profile Info */}
            <div className="flex items-center justify-between px-2 py-1.5 w-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
              <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                <div
                  title={`${formatDisplayName(user.username, user.role)} (${user.role === "admin" ? "Quản trị viên" : "Người dùng"})`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200 font-bold text-xs select-none shadow-xs cursor-default group-data-[collapsible=icon]:mx-auto"
                >
                  {formatDisplayName(user.username, user.role).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-xs font-semibold text-white">
                    {formatDisplayName(user.username, user.role)}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button - Red Border Outline matching Image 1 */}
            <button
              type="button"
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-rose-500/10 text-[#f43f5e] border border-[#f43f5e]/40 hover:border-[#f43f5e] px-3 py-2 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-98 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:mx-auto"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] hover:bg-[#6366f1] px-3 py-2 text-xs font-semibold text-white transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:mx-auto"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Đăng nhập</span>
          </Link>
        )}
      </SidebarFooter>
    </ShadcnSidebar>
  );
}
