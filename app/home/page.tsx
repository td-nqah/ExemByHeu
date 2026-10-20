"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, getExams, getSubmissions } from "@/lib/store";
import { Profile } from "@/types/exam";
import {
  BookOpen,
  History,
  TrendingUp,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

function formatDisplayName(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/!+$/, "");
  const lower = cleaned.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "user1") return "User1";
  if (lower === "user2") return "User2";
  if (lower === "user3") return "User3";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

// Vietnam Time Logic (Asia/Ho_Chi_Minh - GMT+7)
const getVNTime = () => {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hour12: false,
  };
  return parseInt(new Intl.DateTimeFormat("en-US", options).format(new Date()), 10);
};

function getGreetingData(hour: number) {
  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Chào buổi sáng",
      emoji: "☀️",
      label: "Phiên học tập buổi sáng",
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      greeting: "Chào buổi chiều",
      emoji: "🌤️",
      label: "Phiên học tập buổi chiều",
    };
  } else {
    return {
      greeting: "Chào buổi tối",
      emoji: "🌙",
      label: "Phiên tự học buổi tối",
    };
  }
}

export default function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [examsCount, setExamsCount] = useState<number>(11);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [vnHour, setVnHour] = useState<number>(9);

  useEffect(() => {
    // 1. Calculate Vietnam Timezone
    try {
      const currentVnHour = getVNTime();
      if (!isNaN(currentVnHour)) {
        setVnHour(currentVnHour);
      }
    } catch {
      const now = new Date();
      setVnHour((now.getUTCHours() + 7) % 24);
    }

    // 2. Auth Check
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    // 3. Load stats
    async function loadStats() {
      try {
        const [exams, subs] = await Promise.all([
          getExams(true),
          getSubmissions(user?.id),
        ]);
        setExamsCount(exams.length);
        setSubmissionsCount(subs.length);
      } catch {
        // fallback defaults
      }
    }
    loadStats();
  }, [router]);

  const greetingInfo = useMemo(() => {
    return getGreetingData(vnHour);
  }, [vnHour]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)] flex flex-col justify-center items-center py-12">
      {/* =========================================================================
          HERO SECTION (LUNOR MATTE CHARCOAL AESTHETIC)
          ========================================================================= */}
      <div className="w-full text-center space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#18191E] border border-amber-500/20 text-amber-300">
            <span>{greetingInfo.emoji}</span>
            <span>{greetingInfo.greeting} • {greetingInfo.label}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-[#18191E] border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Asia/Ho_Chi_Minh (GMT+7)</span>
          </span>
        </div>

        {/* Prominent Greeting Headline Centered */}
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          <span>{greetingInfo.greeting}, </span>
          <span className="text-white">
            {formatDisplayName(currentUser?.username || "User1")}
          </span>
        </h1>

        {/* Subtitle Line Centered */}
        <p className="text-sm sm:text-base text-zinc-400 font-normal max-w-xl mx-auto leading-relaxed">
          Chào mừng quay trở lại hệ thống khảo thí và đánh giá học phần. Nền tảng học thuật tối giản, bảo mật và hỗ trợ phân tích AI.
        </p>

        {/* Centered Primary Actions (Lunor High-Contrast Pill Buttons) */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 active:bg-zinc-300 text-zinc-950 px-6 py-2.5 text-xs font-semibold shadow-sm transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            <span>Bắt đầu bài đánh giá</span>
            <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-full bg-[#18191E] hover:bg-zinc-800 border border-white/[0.06] text-zinc-300 hover:text-white px-5 py-2.5 text-xs font-medium transition-colors"
          >
            <History className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>Xem lịch sử đánh giá</span>
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-full bg-[#18191E] hover:bg-zinc-800 border border-white/[0.06] text-zinc-300 hover:text-white px-5 py-2.5 text-xs font-medium transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>Tiến độ học tập</span>
          </Link>
        </div>

        {/* =========================================================================
            QUICK STATS SUMMARY TILES (LUNOR SOLID MATTE SLATE WITH STRUCTURED WELLS)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto text-left">
          {/* Card 1: Exams */}
          <Link
            href="/dashboard"
            className="group rounded-2xl bg-[#18191E] border border-white/[0.06] hover:border-zinc-700 p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111215] border border-white/[0.08] text-[#3B82F6]">
                <BookOpen className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="font-heading text-2xl font-bold text-white tabular-nums">
                {examsCount}
              </span>
            </div>
            <h3 className="mt-3.5 text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors">
              Đề đánh giá Khả dụng
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Trắc nghiệm & tự luận theo học phần
            </p>
          </Link>

          {/* Card 2: Submissions */}
          <Link
            href="/history"
            className="group rounded-2xl bg-[#18191E] border border-white/[0.06] hover:border-zinc-700 p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111215] border border-white/[0.08] text-[#10B981]">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="font-heading text-2xl font-bold text-white tabular-nums">
                {submissionsCount}
              </span>
            </div>
            <h3 className="mt-3.5 text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors">
              Đã hoàn thành
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Lịch sử đánh giá và kết quả chi tiết
            </p>
          </Link>

          {/* Card 3: Standard Room */}
          <div className="rounded-2xl bg-[#18191E] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111215] border border-white/[0.08] text-[#D97706]">
                <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-medium">
                Sẵn sàng
              </span>
            </div>
            <h3 className="mt-3.5 text-sm font-semibold text-white">
              Môi trường Khảo thí
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Tính giờ tự động & Kiểm soát phiên thi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
