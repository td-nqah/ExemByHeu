import type { Metadata } from "next";
import { Suspense } from "react";
import { Lexend, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SystemBackground } from "@/components/layout/SystemBackground";

const lexend = Lexend({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["500", "600", "700"],
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
      className={`${lexend.variable} ${beVietnamPro.variable} ${jetBrainsMono.variable} scroll-smooth h-full antialiased`}
    >
      <body className="min-h-screen bg-[#E9EAEE] font-body text-slate-900 antialiased selection:bg-[#111827]/10 selection:text-[#111827] relative overflow-x-hidden custom-scrollbar">
        {/* Dynamic System Background: Soft neutral ambient light UI */}
        <SystemBackground />

        <div className="relative z-10 flex min-h-screen flex-col">
          <Suspense
            fallback={
              <div className="h-screen w-full flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#111827] border-t-transparent" />
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
