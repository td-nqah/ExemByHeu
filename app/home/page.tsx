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
          HERO SECTION CENTERED IN THE MIDDLE OF THE PAGE
          ========================================================================= */}
      <div className="w-full text-center space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#14161D] border border-white/[0.08] text-white shadow-xs">
            <span>{greetingInfo.emoji}</span>
            <span>{greetingInfo.greeting} • {greetingInfo.label}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs text-white bg-[#14161D] border border-white/[0.08] shadow-xs px-3 py-1 rounded-full font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
            <span>Hà Nội (GMT+7)</span>
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
        <p className="text-sm sm:text-base text-[#9CA3AF] font-normal max-w-xl mx-auto leading-relaxed">
          Tính giờ tự động & Kiểm soát phiên thi
        </p>

        {/* Centered Primary Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A0B0E] px-5 py-2.5 text-xs sm:text-sm font-bold cursor-pointer shadow-[0_2px_8px_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_14px_rgba(255,255,255,0.25),0_6px_20px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all active:scale-[0.98]"
          >
            <Play className="h-3.5 w-3.5 fill-current text-[#0A0B0E] ml-0.5" />
            <span>Bắt đầu bài đánh giá</span>
            <ArrowRight className="h-4 w-4 ml-0.5 text-[#0A0B0E]" />
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-[#FAFAFC] border border-black/[0.1] text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-[0_1px_2px_rgba(17,24,39,0.04),0_3px_8px_rgba(17,24,39,0.04),inset_0_1px_0_#FFFFFF] hover:shadow-[0_2px_4px_rgba(17,24,39,0.04),0_6px_14px_rgba(17,24,39,0.06),inset_0_1px_0_#FFFFFF] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_0_1px_3px_rgba(17,24,39,0.08)]"
          >
            <History className="h-4 w-4 text-white" />
            <span>Xem lịch đánh giá</span>
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-[#FAFAFC] border border-black/[0.1] text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-[0_1px_2px_rgba(17,24,39,0.04),0_3px_8px_rgba(17,24,39,0.04),inset_0_1px_0_#FFFFFF] hover:shadow-[0_2px_4px_rgba(17,24,39,0.04),0_6px_14px_rgba(17,24,39,0.06),inset_0_1px_0_#FFFFFF] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_0_1px_3px_rgba(17,24,39,0.08)]"
          >
            <TrendingUp className="h-4 w-4 text-white" />
            <span>Tiến độ học tập</span>
          </Link>
        </div>

        {/* =========================================================================
            QUICK STATS SUMMARY TILES (FLAT MINIMALIST)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto text-left">
          {/* Card 1: Exams */}
          <Link
            href="/dashboard"
            className="group rounded-[20px] bg-[#121318] border border-white/[0.08] shadow-[0_2px_4px_rgba(0,0,0,0.4),0_8px_24px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.5),0_16px_36px_-2px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/[0.18] hover:-translate-y-1.5 p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0A0B0E] shadow-[0_2px_6px_rgba(255,255,255,0.2)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-mono text-2xl font-bold text-white tabular-nums">
                {examsCount}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white transition-colors">
              Đề đánh giá Khả dụng
            </h3>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Trắc nghiệm & tự luận theo học phần
            </p>
          </Link>

          {/* Card 2: Submissions */}
          <Link
            href="/history"
            className="group rounded-[20px] bg-[#121318] border border-white/[0.08] shadow-[0_2px_4px_rgba(0,0,0,0.4),0_8px_24px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.5),0_16px_36px_-2px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-white/[0.18] hover:-translate-y-1.5 p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0A0B0E] shadow-[0_2px_6px_rgba(255,255,255,0.2)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-mono text-2xl font-bold text-white tabular-nums">
                {submissionsCount}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white transition-colors">
              Đã hoàn thành
            </h3>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Lịch sử đánh giá và kết quả chi tiết
            </p>
          </Link>

          {/* Card 3: Standard Room */}
          <div className="rounded-[20px] bg-[#121318] border border-white/[0.08] shadow-[0_2px_4px_rgba(0,0,0,0.4),0_8px_24px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0A0B0E] shadow-[0_2px_6px_rgba(255,255,255,0.2)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-[#0A0B0E] font-mono text-[10px] font-bold uppercase tracking-wider shadow-xs border border-white">
                SẴN SÀNG
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">
              Môi trường Khảo thí
            </h3>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Tính giờ tự động & Kiểm soát phiên thi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
