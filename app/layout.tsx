import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SystemBackground } from "@/components/layout/SystemBackground";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["600", "700", "800"],
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
      className={`${plusJakartaSans.variable} ${beVietnamPro.variable} ${jetBrainsMono.variable} dark scroll-smooth h-full antialiased`}
    >
      <body className="min-h-screen bg-transparent font-body text-[#e5e7eb] antialiased selection:bg-[#4f46e5] selection:text-white relative overflow-x-hidden custom-scrollbar">
        {/* Dynamic System Background: Mưa sao băng on login, Midnight Sky when logged in */}
        <SystemBackground />

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
