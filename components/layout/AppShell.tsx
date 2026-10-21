"use client";

import { useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, GraduationCap } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/store";

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
    return <main className="flex-1 w-full min-h-screen">{children}</main>;
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
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#1f2937] bg-[#111827]/90 backdrop-blur-md px-4 md:hidden">
          <Link
            href="/home"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f2937] border border-[#1f2937] text-white">
              <GraduationCap className="h-4.5 w-4.5 text-slate-200" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight">
              <span className="text-[#818cf8]">Exam</span>
              <span className="text-white">By</span>
              <span className="text-[#818cf8]">Heu</span>
            </span>
          </Link>

          <SidebarTrigger className="flex h-9 w-9 md:hidden">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </header>

        {/* Page Content */}
        <div className="flex-1 w-full min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
