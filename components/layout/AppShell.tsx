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

  // Global Clipboard Guardrail: Restrict Ctrl+C, Ctrl+V, Cut & Paste for all non-admin accounts.
  // Only Admin accounts are allowed to use Ctrl+C and Ctrl+V.
  useEffect(() => {
    const isClipboardAllowed = () => {
      const user = getCurrentUser();
      // Not logged in (e.g. on public login/landing page) -> allow pasting login credentials
      if (!user) return true;
      // Only Admin has full permission for Ctrl+C and Ctrl+V
      return user.role === "admin";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();
      const code = e.code;

      const isCopy = isCtrlOrMeta && (keyLower === "c" || code === "KeyC");
      const isPaste =
        (isCtrlOrMeta && (keyLower === "v" || code === "KeyV")) ||
        (e.shiftKey && (e.key === "Insert" || code === "Insert" || code === "Numpad0"));
      const isCut = isCtrlOrMeta && (keyLower === "x" || code === "KeyX");

      if (isCopy || isPaste || isCut) {
        if (!isClipboardAllowed()) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleClipboardEvent = (e: ClipboardEvent) => {
      if (!isClipboardAllowed()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("copy", handleClipboardEvent, true);
    window.addEventListener("cut", handleClipboardEvent, true);
    window.addEventListener("paste", handleClipboardEvent, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("copy", handleClipboardEvent, true);
      window.removeEventListener("cut", handleClipboardEvent, true);
      window.removeEventListener("paste", handleClipboardEvent, true);
    };
  }, [pathname]);

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
        <header className="sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top,0px))] w-full items-center justify-between border-b border-[#1b1f2a] bg-[#0a0c12]/95 backdrop-blur-md px-4 pt-[env(safe-area-inset-top,0px)] md:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#252a37] bg-[#10131b] text-slate-300 hover:text-white hover:bg-[#161a24] active:scale-95 transition-transform shadow-sm md:hidden">
              <Menu className="h-6 w-6" strokeWidth={2.25} />
            </SidebarTrigger>

            <Link
              href="/home"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90 select-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10131b] border border-[#252a37] text-white">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="brand-logo font-heading text-[17px] font-bold tracking-tight select-none">
                <span className="text-white">Exam</span>
                <span className="text-[#9ca3af]">ByHeu</span>
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 w-full min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
