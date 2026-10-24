"use client";

import { useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, GraduationCap } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/store";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Send periodic presence heartbeat for any active logged-in user
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.username) return;

    let activity = "Đang trực tuyến";
    if (pathname.startsWith("/exam/")) activity = "Đang làm bài thi";
    else if (pathname.startsWith("/admin/permissions")) activity = "Quản lý Phân quyền";
    else if (pathname.startsWith("/admin/settings")) activity = "Cài đặt Hệ thống";
    else if (pathname.startsWith("/admin/dashboard")) activity = "Quản lý Đề thi";
    else if (pathname.startsWith("/admin/categories")) activity = "Quản lý Danh mục";
    else if (pathname.startsWith("/admin/materials")) activity = "Quản lý Tài liệu";
    else if (pathname.startsWith("/history")) activity = "Xem lịch sử làm bài";
    else if (pathname.startsWith("/analytics")) activity = "Xem phân tích kết quả";
    else if (pathname.startsWith("/home")) activity = "Trang chủ / Danh sách đề";

    const sendPing = () => {
      fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "heartbeat",
          username: user.username,
          activity,
        }),
      }).catch(() => {});
    };

    sendPing();
    const timer = setInterval(sendPing, 25000);
    return () => clearInterval(timer);
  }, [pathname]);

  // During a live exam session (except the result summary screen),
  // hide sidebar entirely so the test-taker has zero distractions.
  const isLiveExam =
    pathname.startsWith("/exam/") && !pathname.endsWith("/result");

  // On public login/landing page without login session, full page view
  const isLoginPage = pathname === "/" || pathname === "/login";

  if (isLiveExam || isLoginPage) {
    return (
      <main className="flex-1 w-full min-h-screen relative">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle size={12} />
        </div>
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Left Sidebar */}
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

      {/* Main Content Area */}
      <SidebarInset className="flex-1 flex flex-col min-h-screen w-full min-w-0 transition-all duration-300">
        {/* Mobile Top Header */}
        <header className="sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top,0px))] w-full items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-[#E9EAEE]/90 dark:bg-[#090A0E]/90 backdrop-blur-md px-4 pt-[env(safe-area-inset-top,0px)] md:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#14161D] text-[#111827] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] active:scale-95 transition-transform shadow-xs md:hidden">
              <Menu className="h-6 w-6" strokeWidth={2.25} />
            </SidebarTrigger>

            <Link
              href="/home"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg glass-icon">
                <GraduationCap className="h-5 w-5 text-[#111827] dark:text-white" strokeWidth={2} />
              </div>
              <span className="brand-logo font-heading text-[17px] font-bold tracking-tight select-none">
                <span className="text-[#111827] dark:text-white">Exam</span>
                <span className="text-[#9CA3AF]">By</span>
                <span className="text-[#111827] dark:text-white">Heu</span>
              </span>
            </Link>
          </div>

          {/* Mobile Right: Animated Day/Night Switch */}
          <div className="flex items-center shrink-0 ml-auto pl-2">
            <ThemeToggle size={12} />
          </div>
        </header>

        {/* Desktop Top Header Bar (Right-aligned ThemeToggle at top-right corner) */}
        <header className="sticky top-0 z-20 hidden md:flex h-14 w-full items-center justify-end px-6 lg:px-8 border-b border-black/[0.04] dark:border-white/[0.06] bg-[#E9EAEE]/80 dark:bg-[#090A0E]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <ThemeToggle size={12.5} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 w-full min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
