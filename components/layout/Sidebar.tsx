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
  ChevronsUpDown,
  Search,
  Sparkles,
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

// Desaturated tag colors for folder categories (Lunor Palette)
const CATEGORY_COLORS = [
  "#3B82F6", // Electric Blue
  "#64748B", // Slate
  "#D97706", // Warm Amber
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#F43F5E", // Rose
  "#06B6D4", // Cyan
];

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

  // Group 1: OVERVIEW / REPORTS
  const overviewNavLinks = [
    {
      title: "Home",
      href: "/home",
      icon: Home,
      active: pathname === "/home",
    },
    {
      title: "Assessment History",
      href: "/history",
      icon: History,
      active: pathname.startsWith("/history"),
    },
    {
      title: "Learning Analytics",
      href: "/analytics",
      icon: BarChart2,
      active: pathname.startsWith("/analytics"),
    },
  ];

  const isExamsRoute = pathname === "/dashboard" || pathname.startsWith("/exam");
  const isParentActive =
    (pathname === "/dashboard" && !activeCategory) || pathname.startsWith("/exam");

  // Group 3: SYSTEM MANAGEMENT
  const systemManagementNavLinks = [
    {
      title: "Categories",
      href: "/admin/categories",
      icon: FolderTree,
      active: pathname.startsWith("/admin/categories"),
    },
    {
      title: "Exams",
      href: "/admin/dashboard",
      icon: ShieldCheck,
      active:
        pathname === "/admin" ||
        pathname === "/admin/dashboard" ||
        (pathname.startsWith("/admin/exams") &&
          !pathname.startsWith("/admin/exams/create")),
    },
    {
      title: "Materials",
      href: "/admin/materials",
      icon: Library,
      active: pathname.startsWith("/admin/materials"),
    },
  ];

  // Group 4: SYSTEM CONFIGURATION
  const systemConfigNavLinks = [
    {
      title: "Permissions",
      href: "/admin/permissions",
      icon: Sliders,
      active: pathname.startsWith("/admin/permissions"),
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  return (
    <ShadcnSidebar collapsible="icon" className="border-r border-white/[0.06] bg-[#121316]">
      {/* 1. Header: Workspace/User Switcher, Search Bar, & Toggle Trigger */}
      <SidebarHeader className="border-b border-white/[0.06] p-3 space-y-2.5">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center gap-2">
          {/* Workspace Switcher */}
          <Link
            href="/home"
            onClick={closeSidebarOnNavigate}
            title="ExamByHeu Workspace"
            className="flex items-center justify-between flex-1 min-w-0 p-1.5 rounded-xl bg-[#18191E] border border-white/[0.06] hover:border-zinc-700 transition-colors select-none group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-transparent"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#111215] border border-white/[0.08] text-white">
                <GraduationCap className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden text-left">
                <span className="font-heading text-xs font-semibold text-white tracking-tight leading-tight truncate">
                  ExamByHeu
                </span>
                <span className="text-[10px] text-zinc-500 truncate">
                  {user?.role === "admin" ? "Academic Admin" : "Student Workspace"}
                </span>
              </div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-500 shrink-0 ml-1.5 group-data-[collapsible=icon]:hidden" strokeWidth={1.5} />
          </Link>

          {/* Desktop Sidebar Collapse Trigger */}
          <SidebarTrigger
            title="Collapse / Expand sidebar (Ctrl+B)"
            className="hidden md:flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-[#18191E] border border-white/[0.06] text-zinc-400 hover:text-white transition group-data-[collapsible=icon]:hidden"
          >
            <Menu className="h-3.5 w-3.5" strokeWidth={1.5} />
          </SidebarTrigger>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={closeSidebarOnNavigate}
            aria-label="Close menu"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-[#18191E] border border-white/[0.06] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Collapsed Icon Mode: Center Trigger */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center pt-0.5">
          <SidebarTrigger
            title="Expand sidebar (Ctrl+B)"
            className="h-8 w-8 rounded-lg bg-[#18191E] border border-white/[0.06] text-zinc-400 hover:text-white"
          >
            <Menu className="h-3.5 w-3.5" strokeWidth={1.5} />
          </SidebarTrigger>
        </div>

        {/* Minimalist Search Bar with Inline Shortcut */}
        <div
          onClick={() => {
            closeSidebarOnNavigate();
            router.push("/dashboard");
          }}
          className="group-data-[collapsible=icon]:hidden flex items-center justify-between rounded-lg bg-[#111215] border border-white/[0.06] px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" strokeWidth={1.5} />
            <span className="truncate text-zinc-500 text-[11px]">Search assessments...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
            /
          </kbd>
        </div>
      </SidebarHeader>

      {/* 2. Content: Groups & Navigation Menu */}
      <SidebarContent className="px-2 py-3 custom-scrollbar">
        {/* Nhóm 1: OVERVIEW / REPORTS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
            OVERVIEW
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {overviewNavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.active}
                      tooltip={item.title}
                      className={cn(
                        "h-8.5 rounded-lg text-xs font-medium transition-colors",
                        item.active
                          ? "bg-white/[0.08] text-white border border-white/[0.06]"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      <Link href={item.href} onClick={closeSidebarOnNavigate}>
                        <Icon
                          strokeWidth={1.5}
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            item.active ? "text-white" : "text-zinc-400"
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

        <SidebarSeparator className="my-2 border-white/[0.04]" />

        {/* Nhóm 2: MATERIALS / ASSESSMENTS */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
            ASSESSMENTS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {/* Mục 1: Materials & Syllabi */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/knowledge")}
                  tooltip="Materials & Syllabi"
                  className={cn(
                    "h-8.5 rounded-lg text-xs font-medium transition-colors",
                    pathname.startsWith("/knowledge")
                      ? "bg-white/[0.08] text-white border border-white/[0.06]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <Link href="/knowledge" onClick={closeSidebarOnNavigate}>
                    <BookOpen
                      strokeWidth={1.5}
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        pathname.startsWith("/knowledge")
                          ? "text-white"
                          : "text-zinc-400"
                      )}
                    />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      Materials & Syllabi
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Mục 2: Assessment Bank with Accordion Folders */}
              <SidebarMenuItem>
                <div className="flex w-full items-center">
                  <SidebarMenuButton
                    asChild
                    isActive={isParentActive}
                    tooltip="Assessment Bank"
                    className={cn(
                      "flex-1 h-8.5 rounded-lg text-xs font-medium transition-colors",
                      isParentActive
                        ? "bg-white/[0.08] text-white border border-white/[0.06]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => {
                        setExamsExpanded((prev) => !prev);
                        closeSidebarOnNavigate();
                      }}
                    >
                      <Layers
                        strokeWidth={1.5}
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isParentActive || isExamsRoute
                            ? "text-white"
                            : "text-zinc-400"
                        )}
                      />
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        Assessment Bank
                      </span>
                    </Link>
                  </SidebarMenuButton>

                  {/* Toggle Accordion Chevron */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExamsExpanded((prev) => !prev);
                    }}
                    aria-label="Toggle exam categories"
                    title={examsExpanded ? "Collapse categories" : "Expand categories"}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer group-data-[collapsible=icon]:hidden mr-1"
                  >
                    <ChevronDown
                      strokeWidth={1.5}
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        examsExpanded && "rotate-180 text-white"
                      )}
                    />
                  </button>
                </div>

                {/* Submenu: Folder/Category accordion list with color-coded square badges */}
                <AnimatePresence>
                  {examsExpanded && categories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      className="overflow-hidden group-data-[collapsible=icon]:hidden pl-2"
                    >
                      <SidebarMenuSub className="border-l border-white/[0.06] pl-2 my-1 space-y-0.5">
                        {categories.map((cat, idx) => {
                          const isSubActive =
                            pathname === "/dashboard" &&
                            (activeCategory === cat.slug || activeCategory === cat.id);
                          const badgeColor =
                            CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

                          return (
                            <SidebarMenuSubItem key={cat.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className={cn(
                                  "h-7 rounded-md text-xs transition-colors",
                                  isSubActive
                                    ? "bg-white/[0.06] text-white font-medium"
                                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                                )}
                              >
                                <Link
                                  href={`/dashboard?category=${encodeURIComponent(
                                    cat.slug || cat.id
                                  )}`}
                                  onClick={closeSidebarOnNavigate}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="h-2 w-2 rounded-[2px] shrink-0"
                                      style={{ backgroundColor: badgeColor }}
                                    />
                                    <span className="truncate">{cat.name}</span>
                                  </div>
                                  {isSubActive && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
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

        {/* Nhóm 3: SYSTEM MANAGEMENT (Admin only) */}
        {user?.role === "admin" && (
          <>
            <SidebarSeparator className="my-2 border-white/[0.04]" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
                SYSTEM MANAGEMENT
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {systemManagementNavLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.active}
                          tooltip={item.title}
                          className={cn(
                            "h-8.5 rounded-lg text-xs font-medium transition-colors",
                            item.active
                              ? "bg-white/[0.08] text-white border border-white/[0.06]"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          <Link href={item.href} onClick={closeSidebarOnNavigate}>
                            <Icon
                              strokeWidth={1.5}
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                item.active ? "text-white" : "text-zinc-400"
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

        {/* Nhóm 4: SYSTEM CONFIGURATION (Admin only) */}
        {user?.role === "admin" && (
          <>
            <SidebarSeparator className="my-2 border-white/[0.04]" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1">
                SYSTEM CONFIGURATION
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {systemConfigNavLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.active}
                          tooltip={item.title}
                          className={cn(
                            "h-8.5 rounded-lg text-xs font-medium transition-colors",
                            item.active
                              ? "bg-white/[0.08] text-white border border-white/[0.06]"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          <Link href={item.href} onClick={closeSidebarOnNavigate}>
                            <Icon
                              strokeWidth={1.5}
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                item.active ? "text-white" : "text-zinc-400"
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

      {/* 3. Footer: Bottom CTA Card + User Profile & Sign Out */}
      <SidebarFooter className="border-t border-white/[0.06] p-3 space-y-2.5">
        {/* Bottom CTA Card: Minimalist SaaS Widget */}
        <div className="group-data-[collapsible=icon]:hidden rounded-xl bg-[#18191E] border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" strokeWidth={1.5} />
              <span>Assessment Pro</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            All question banks and AI analytics are fully unlocked.
          </p>
          <Link
            href="/analytics"
            onClick={closeSidebarOnNavigate}
            className="inline-flex w-full items-center justify-center rounded-full bg-white text-zinc-950 font-semibold text-xs py-1.5 px-3 hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
          >
            View Analytics
          </Link>
        </div>

        {/* User Profile & Sign Out */}
        {user ? (
          <div className="flex flex-col gap-2">
            {/* User Profile Card */}
            <div className="flex items-center justify-between rounded-xl bg-[#111215] border border-white/[0.06] p-2.5 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-transparent">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  title={`${formatDisplayName(user.username)} (${user.role === "admin" ? "Administrator" : "Student"})`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#18191E] border border-white/[0.08] font-bold text-white text-xs select-none shadow-sm cursor-default"
                >
                  {formatDisplayName(user.username).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-xs font-semibold text-white">
                    {formatDisplayName(user.username)}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {user.role === "admin" ? "Administrator" : "Student"}
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#18191E] hover:bg-[#202127] text-zinc-400 hover:text-white border border-white/[0.06] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:mx-auto"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="truncate group-data-[collapsible=icon]:hidden">Sign out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/"
            title="Sign in"
            onClick={closeSidebarOnNavigate}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white text-zinc-950 font-semibold text-xs py-2 px-3 hover:bg-zinc-200 transition-colors group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:mx-auto"
          >
            <User className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            <span className="truncate group-data-[collapsible=icon]:hidden">Sign in</span>
          </Link>
        )}
      </SidebarFooter>

      {/* 4. Rail: Expand/Collapse hover drag bar */}
      <SidebarRail />
    </ShadcnSidebar>
  );
}
