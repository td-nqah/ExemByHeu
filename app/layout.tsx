import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${inter.variable} ${plusJakartaSans.variable} ${geistMono.variable} dark scroll-smooth h-full antialiased`}
    >
      <body className="min-h-screen bg-transparent font-sans text-[#e5e7eb] antialiased selection:bg-[#4f46e5] selection:text-white relative overflow-x-hidden custom-scrollbar">
        {/* Fixed Background Scaffold (Obsidian Isometric Cube Flow) */}
        <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden select-none">
          {/* Layer 1: Diagonal Repeating Gradient Stripe Base */}
          <div className="absolute inset-0 bg-obsidian-pattern" />

          {/* Layer 2: Animated Floating Isometric 3D Cube Mesh */}
          <svg
            preserveAspectRatio="xMidYMid slice"
            height="100%"
            width="100%"
            className="absolute inset-0 w-[200%] h-[200%] -left-[30%] -top-[20%] opacity-[0.32] animate-cube-float pointer-events-none"
            viewBox="0 0 120 104"
          >
            <defs>
              <linearGradient y2="100%" x2="100%" y1="0%" x1="0%" id="cube-dark">
                <stop stopColor="#080B11" offset="0%" />
                <stop stopColor="#101524" offset="100%" />
              </linearGradient>
              <linearGradient y2="0%" x2="100%" y1="100%" x1="0%" id="cube-mid">
                <stop stopColor="#1E2744" offset="0%" />
                <stop stopColor="#0C1222" offset="100%" />
              </linearGradient>
              <linearGradient y2="100%" x2="0%" y1="0%" x1="100%" id="cube-light">
                <stop stopColor="#4F46E5" stopOpacity="0.45" offset="0%" />
                <stop stopColor="#1E1B4B" offset="100%" />
              </linearGradient>

              <pattern id="cube-mesh" width="120" height="104" patternUnits="userSpaceOnUse">
                {/* Center Hexagonal Isometric Cube */}
                <path d="M 60 0 L 120 26 L 60 52 L 0 26 Z" fill="url(#cube-light)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />
                <path d="M 0 26 L 60 52 L 60 104 L 0 78 Z" fill="url(#cube-mid)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />
                <path d="M 60 52 L 120 26 L 120 78 L 60 104 Z" fill="url(#cube-dark)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />

                {/* Staggered Corner Fillers for Seamless Tiling */}
                <path d="M 0 0 L 60 26 L 0 52 Z" fill="url(#cube-dark)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />
                <path d="M 120 0 L 60 26 L 120 52 Z" fill="url(#cube-mid)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />
                <path d="M 0 52 L 60 78 L 0 104 Z" fill="url(#cube-light)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />
                <path d="M 120 52 L 60 78 L 120 104 Z" fill="url(#cube-light)" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cube-mesh)" />
          </svg>

          {/* Layer 3: Ambient Indigo Radial Glow & Edge Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15)_0%,transparent_60%),radial-gradient(ellipse_at_center,transparent_0%,rgba(4,6,10,0.75)_100%)]" />
        </div>

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
