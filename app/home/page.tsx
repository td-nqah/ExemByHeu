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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-black/[0.06] text-[#1F2128] shadow-xs">
            <span>{greetingInfo.emoji}</span>
            <span>{greetingInfo.greeting} • {greetingInfo.label}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs text-[#2E9E5B] bg-white border border-black/[0.06] shadow-xs px-3 py-1 rounded-full font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2E9E5B] animate-pulse" />
            <span>Hà Nội (GMT+7)</span>
          </span>
        </div>

        {/* Prominent Greeting Headline Centered */}
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#1F2128] leading-tight">
          <span>{greetingInfo.greeting}, </span>
          <span className="text-[#D9482B]">
            {formatDisplayName(currentUser?.username || "User1")}
          </span>
        </h1>

        {/* Subtitle Line Centered */}
        <p className="text-sm sm:text-base text-[#7A7D88] font-normal max-w-xl mx-auto leading-relaxed">
          Chào mừng quay trở lại hệ thống khảo thí và đánh giá học phần.
        </p>

        {/* Centered Primary Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D9482B] hover:bg-[#C43E23] active:bg-[#B3351C] text-white px-6 py-3 text-sm font-semibold shadow-[0_4px_14px_rgba(217,72,43,0.3)] transition-all hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4 fill-current ml-0.5" />
            <span>Bắt đầu bài đánh giá</span>
            <ArrowRight className="h-4 w-4 ml-0.5" />
          </Link>

          <Link
            href="/history"
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-[#F6F6F8] border border-black/[0.08] text-[#1F2128] hover:text-[#D9482B] px-5 py-3 text-sm font-medium transition-all shadow-xs hover:-translate-y-0.5"
          >
            <History className="h-4 w-4 text-[#7A7D88]" />
            <span>Xem lịch sử đánh giá</span>
          </Link>

          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-[#F6F6F8] border border-black/[0.08] text-[#1F2128] hover:text-[#D9482B] px-5 py-3 text-sm font-medium transition-all shadow-xs hover:-translate-y-0.5"
          >
            <TrendingUp className="h-4 w-4 text-[#7A7D88]" />
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
            className="group rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.04),0_12px_30px_rgba(20,20,40,0.09)] hover:-translate-y-1 p-4 sm:p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBE3DC] text-[#D9482B]">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-mono text-xl font-bold text-[#1F2128] tabular-nums">
                {examsCount}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#1F2128] group-hover:text-[#D9482B] transition-colors">
              Đề đánh giá Khả dụng
            </h3>
            <p className="mt-0.5 text-xs text-[#7A7D88]">
              Trắc nghiệm & tự luận theo học phần
            </p>
          </Link>

          {/* Card 2: Submissions */}
          <Link
            href="/history"
            className="group rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.04),0_12px_30px_rgba(20,20,40,0.09)] hover:-translate-y-1 p-4 sm:p-5 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF2E5] text-[#2E9E5B]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="font-mono text-xl font-bold text-[#2E9E5B] tabular-nums">
                {submissionsCount}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#1F2128] group-hover:text-[#2E9E5B] transition-colors">
              Đã hoàn thành
            </h3>
            <p className="mt-0.5 text-xs text-[#7A7D88]">
              Lịch sử đánh giá và kết quả chi tiết
            </p>
          </Link>

          {/* Card 3: Standard Room */}
          <div className="rounded-2xl bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6EBC8] text-[#B8962E]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xs bg-[#DDF2E5] text-[#2E9E5B] border border-[#2E9E5B]/20 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider">
                Sẵn sàng
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#1F2128]">
              Môi trường Khảo thí
            </h3>
            <p className="mt-0.5 text-xs text-[#7A7D88]">
              Tính giờ tự động & Kiểm soát phiên thi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
