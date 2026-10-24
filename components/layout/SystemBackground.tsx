"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

function SystemBackgroundContent() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/" || pathname === "/login";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#E9EAEE]"
    >
      {/* Subtle top-center ambient diffuse warm glow */}
      <div
        className="absolute -top-[20%] left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
        style={{
          background: isLoginPage
            ? "radial-gradient(circle, rgba(217,72,43,0.08) 0%, rgba(251,227,220,0.5) 45%, transparent 70%)"
            : "radial-gradient(circle, rgba(217,72,43,0.05) 0%, rgba(246,246,248,0.8) 50%, transparent 70%)",
        }}
      />

      {/* Subtle bottom-right cool ambient tint */}
      <div
        className="absolute -bottom-[15%] -right-[10%] h-[500px] w-[700px] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(111,160,216,0.06) 0%, transparent 65%)",
        }}
      />
    </div>
  );
}

export function SystemBackground() {
  return (
    <Suspense fallback={<div className="fixed inset-0 -z-10 bg-[#E9EAEE]" />}>
      <SystemBackgroundContent />
    </Suspense>
  );
}
