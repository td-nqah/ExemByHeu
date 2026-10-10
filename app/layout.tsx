import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ExamTestByHeu - Hệ thống Thi thử Trực tuyến",
    template: "%s | ExamTestByHeu - Hệ thống Thi thử Trực tuyến",
  },
  description: "Nền tảng thi thử và chấm điểm trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} dark scroll-smooth h-full antialiased`}
    >
      <body className="relative min-h-[100dvh] flex flex-col bg-[#0B0E14] font-sans text-zinc-100 selection:bg-white/25 selection:text-white">
        {/* Ambient Monochrome Subsurface Light Sources for Dark Frosted Glass Refraction */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-white/[0.04] blur-[140px]" />
          <div className="absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-slate-300/[0.03] blur-[150px]" />
          <div className="absolute -bottom-48 left-1/3 h-[500px] w-[500px] rounded-full bg-zinc-400/[0.04] blur-[150px]" />
        </div>

        <Suspense
          fallback={<div className="glass-nav sticky top-0 z-40 h-16 w-full" />}
        >
          <Navbar />
        </Suspense>
        <main className="relative z-10 flex-1">{children}</main>
      </body>
    </html>
  );
}
