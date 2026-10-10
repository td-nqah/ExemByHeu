import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ExamByHeu - Nền tảng Thi thử Trực tuyến",
    template: "%s | ExamByHeu - Nền tảng Thi thử Trực tuyến",
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
      className={`${inter.variable} ${geistMono.variable} dark scroll-smooth h-full antialiased`}
    >
      <body className="min-h-screen bg-[#0B0F17] font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden custom-scrollbar">
        {/* Lightweight CSS Pure Gradient Ambient Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 opacity-85"
        />
        {/* Subtle 4rem Cyber Grid Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]"
        />

        <div className="relative z-10 flex min-h-screen flex-col">
          <Suspense
            fallback={
              <div className="sticky top-0 z-50 h-16 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80" />
            }
          >
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
