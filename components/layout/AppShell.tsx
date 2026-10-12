"use client";

import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Menu, GraduationCap } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="min-h-screen w-full relative flex bg-transparent">
      {/* Left Sidebar */}
      <Suspense fallback={null}>
        <Sidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full transition-all duration-300">
        {/* Mobile Top Header */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-[#141829]/90 backdrop-blur-md px-4 md:hidden">
          <Link
            href="/home"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2538] border border-white/[0.08] text-white">
              <GraduationCap className="h-4.5 w-4.5 text-slate-200" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              ExamByHeu
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở Menu điều hướng"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-[#151b27] text-slate-300 hover:text-white hover:bg-[#1e2538] transition"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}
