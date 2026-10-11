import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ObsidianCyberBackground } from "@/components/layout/ObsidianCyberBackground";

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
      <body className="min-h-screen bg-[#0d111a] font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden custom-scrollbar">
        {/* DYNAMIC OBSIDIAN CYBER BACKGROUND */}
        <ObsidianCyberBackground />

        <div className="relative z-10 flex min-h-screen flex-col">
          <Suspense
            fallback={
              <div className="h-screen w-full flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            }
          >
            <AppShell>{children}</AppShell>
          </Suspense>
        </div>
      </body>
    </html>
  );
}
