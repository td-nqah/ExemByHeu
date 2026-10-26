"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser, getExams, getSubmissions } from "@/lib/store";
import { Profile } from "@/types/exam";
import {
  BookOpen,
  History,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

function formatDisplayName(name?: string, role?: string): string {
  if (role === "admin") return "Admin";
  if (!name) return "";
  const cleaned = name.trim().replace(/!+$/, "");
  const lower = cleaned.toLowerCase();
  if (lower === "admin" || lower === "adm") return "Admin";
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
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300 backdrop-blur-md shadow-xs">
            <span>{greetingInfo.emoji}</span>
            <span>{greetingInfo.greeting} • {greetingInfo.label}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1.5 rounded-full font-medium backdrop-blur-md shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Hà Nội (GMT+7)</span>
          </span>
        </div>

        {/* Prominent Greeting Headline Centered */}
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          <span>{greetingInfo.greeting}, </span>
          <span className="text-[#818cf8]">
            {formatDisplayName(currentUser?.username || "Admin", currentUser?.role)}
          </span>
        </h1>

        {/* Subtitle Line Centered */}
        <p className="text-sm sm:text-base text-slate-400 font-normal max-w-xl mx-auto leading-relaxed">
          Chào mừng quay trở lại hệ thống khảo thí và đánh giá học phần.
        </p>

        {/* Centered Primary Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-100 active:bg-slate-200 text-black px-7 py-3.5 text-sm font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
            <span>Bắt đầu bài đánh giá</span>
            <ArrowRight className="h-4 w-4 ml-0.5" />
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-full bg-[#10131b]/80 border border-[#2a2f3c] hover:border-[#3b4252] hover:bg-[#161a24] text-white px-6 py-3.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm select-none cursor-pointer"
          >
            <History className="h-4 w-4 text-[#818cf8]" />
            <span>Xem lịch sử đánh giá</span>
          </Link>
        </div>

        {/* =========================================================================
            QUICK STATS SUMMARY TILES (DARK STARRY NIGHT CARDS)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto text-left">
          {/* Card 1: Exams */}
          <Link
            href="/dashboard"
            className="group rounded-3xl bg-[#161a24] border border-[#252a37] hover:border-indigo-500/40 p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-extrabold text-white tabular-nums drop-shadow-sm">
                {examsCount}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Đề đánh giá Khả dụng
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Trắc nghiệm &amp; tự luận theo học phần
            </p>
          </Link>

          {/* Card 2: Submissions */}
          <Link
            href="/history"
            className="group rounded-3xl bg-[#161a24] border border-[#252a37] hover:border-emerald-500/40 p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-heading text-2xl font-extrabold text-emerald-400 tabular-nums drop-shadow-sm">
                {submissionsCount}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Đã hoàn thành
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Lịch sử đánh giá và kết quả chi tiết
            </p>
          </Link>

          {/* Card 3: Standard Room */}
          <div className="rounded-3xl bg-[#161a24] border border-[#252a37] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-medium shadow-xs">
                Sẵn sàng
              </span>
            </div>
            <h2 className="mt-4 text-sm font-bold text-white">
              Môi trường Khảo thí
            </h2>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Tính giờ tự động &amp; Kiểm soát phiên thi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
