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
  Clock,
  Sparkles,
} from "lucide-react";

function formatDisplayName(name?: string): string {
  if (!name) return "";
  const cleaned = name.trim().replace(/!+$/, "");
  const lower = cleaned.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "user1") return "User1";
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
      greeting: "Good Morning",
      emoji: "☀️",
      label: "Buổi sáng năng lượng",
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      greeting: "Good Afternoon",
      emoji: "🌤️",
      label: "Buổi chiều bứt phá",
    };
  } else {
    return {
      greeting: "Good Night",
      emoji: "🌙",
      label: "Chế độ đêm tập trung",
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#24221b] border border-amber-500/20 text-amber-300">
            <span>{greetingInfo.emoji}</span>
            <span>{greetingInfo.greeting} • {greetingInfo.label}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-[#162723] border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Asia/Ho_Chi_Minh (GMT+7)</span>
          </span>
        </div>

        {/* Prominent Greeting Headline Centered */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          <span>{greetingInfo.greeting}, </span>
          <span className="text-[#818cf8]">
            {formatDisplayName(currentUser?.username || "User1")}
          </span>
        </h1>

        {/* Subtitle Line Centered */}
        <p className="text-base sm:text-lg text-slate-400 font-normal max-w-xl mx-auto leading-relaxed">
          Welcome back to ExamByHeu! Ready for today&apos;s test?
        </p>

        {/* Centered Primary Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#4f57ea] hover:bg-[#434ac9] active:bg-[#3d43b6] text-white px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
            <span>Vào làm bài thi ngay</span>
            <ArrowRight className="h-4 w-4 ml-0.5" />
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-xl bg-[#151b27] hover:bg-[#1c2333] border border-white/[0.08] text-slate-300 hover:text-white px-5 py-3 text-sm font-medium transition-colors"
          >
            <History className="h-4 w-4 text-slate-400" />
            <span>Xem lịch sử thi</span>
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-[#151b27] hover:bg-[#1c2333] border border-white/[0.08] text-slate-300 hover:text-white px-5 py-3 text-sm font-medium transition-colors"
          >
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <span>Phân tích phong độ</span>
          </Link>
        </div>

        {/* =========================================================================
            QUICK STATS SUMMARY TILES (FLAT MINIMALIST)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-3xl mx-auto text-left">
          {/* Card 1: Exams */}
          <Link
            href="/dashboard"
            className="group rounded-2xl bg-[#151b27] border border-white/[0.06] hover:border-white/10 hover:bg-[#171e2c] p-4 sm:p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202738] text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold font-mono text-white">
                {examsCount}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Đề thi Khả dụng
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Trắc nghiệm & tự luận đa dạng chuyên đề
            </p>
          </Link>

          {/* Card 2: Submissions */}
          <Link
            href="/history"
            className="group rounded-2xl bg-[#151b27] border border-white/[0.06] hover:border-white/10 hover:bg-[#171e2c] p-4 sm:p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202738] text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {submissionsCount}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Đã hoàn thành
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Lịch sử làm bài và kết quả chi tiết
            </p>
          </Link>

          {/* Card 3: Standard Room */}
          <div className="rounded-2xl bg-[#151b27] border border-white/[0.06] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202738] text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Sẵn sàng
              </span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">
              Phòng thi Chuẩn mực
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Đồng hồ tự động & Chống gian lận
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
