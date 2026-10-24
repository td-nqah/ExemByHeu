"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

function SystemBackgroundContent() {
  const pathname = usePathname();
  // Giữ nền mưa sao băng khi ở màn hình đăng nhập (chưa vào hệ thống)
  const isLoginPage = pathname === "/" || pathname === "/login";

  if (isLoginPage) {
    // Mưa sao băng Uiverse (login background)
    return <div className="container" />;
  }

  // Nền Midnight Sky bầu trời đêm lấp lánh và sao băng khi đã đăng nhập (bỏ mặt trăng)
  return (
    <div className="uiverse-midnight-sky">
      <div className="sky-canvas">
        <div className="stars stars-1" />
        <div className="stars stars-2" />
        <div className="stars stars-3" />

        <div className="meteor m1" />
        <div className="meteor m2" />
        <div className="meteor m3" />
      </div>
    </div>
  );
}

export function SystemBackground() {
  return (
    <Suspense fallback={<div className="container" />}>
      <SystemBackgroundContent />
    </Suspense>
  );
}
