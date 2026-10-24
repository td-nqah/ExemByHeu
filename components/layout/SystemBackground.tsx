"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

function SystemBackgroundContent() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/" || pathname === "/login";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#E9EAEE] dark:bg-[#090A0E] transition-colors duration-300 select-none"
    >
      {/* Top-center ambient diffuse warm glow */}
      <div
        className="absolute -top-[20%] left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full opacity-60 dark:opacity-15 blur-[120px] transition-opacity duration-300"
        style={{
          background: isLoginPage
            ? "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Bottom-right subtle cool ambient tint */}
      <div
        className="absolute -bottom-[15%] -right-[10%] h-[500px] w-[700px] rounded-full opacity-50 dark:opacity-15 blur-[100px] transition-opacity duration-300"
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
    <Suspense
      fallback={
        <div className="fixed inset-0 -z-10 bg-[#E9EAEE] dark:bg-[#090A0E]" />
      }
    >
      <SystemBackgroundContent />
    </Suspense>
  );
}
