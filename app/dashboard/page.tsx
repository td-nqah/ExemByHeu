"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { getExams, getSubmissions, getCurrentUser, getCategories } from "@/lib/store";
import { Exam, Submission, Profile, Category } from "@/types/exam";
import { UserExamCard } from "@/components/dashboard/UserExamCard";
import {
  BookOpen,
  Clipboard,
  ClipboardCheck,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Layers,
  BookText,
  Clock,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper: Filter exams by category keywords or exact slug
function matchCategory(exam: Exam, categorySlug: string): boolean {
  if (!categorySlug || categorySlug === "all") return true;
  if (
    exam.category_slug &&
    exam.category_slug.toLowerCase() === categorySlug.toLowerCase()
  ) {
    return true;
  }
  const content = `${exam.title} ${exam.description || ""}`.toLowerCase();
  if (categorySlug === "cnxh") {
    return (
      content.includes("cnxh") ||
      content.includes("chủ nghĩa xã hội") ||
      content.includes("công nhân")
    );
  }
  return content.includes(categorySlug.toLowerCase());
}

// Client Vietnam Time Logic (Asia/Ho_Chi_Minh - GMT+7)
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
      icon: Sun,
      badgeText: "Buổi sáng năng lượng",
      badgeStyle:
        "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      gradient: "from-amber-400 via-orange-300 to-yellow-200",
      ambientGlow: "from-amber-500/15 via-transparent to-transparent",
      emoji: "☀️",
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      greeting: "Good Afternoon",
      icon: Sunset,
      badgeText: "Buổi chiều bứt phá",
      badgeStyle:
        "bg-orange-500/15 text-orange-300 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.25)]",
      gradient: "from-orange-400 via-amber-300 to-yellow-300",
      ambientGlow: "from-orange-500/15 via-transparent to-transparent",
      emoji: "🌤️",
    };
  } else {
    return {
      greeting: "Good Night",
      icon: Moon,
      badgeText: "Chế độ đêm tập trung",
      badgeStyle:
        "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.25)]",
      gradient: "from-indigo-400 via-purple-300 to-pink-300",
      ambientGlow: "from-indigo-600/15 via-transparent to-transparent",
      emoji: "🌙",
    };
  }
}

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // Vietnam Time state (default calculated from client)
  const [vnHour, setVnHour] = useState<number>(20);

  // Active Category from URL searchParams (e.g. ?category=cnxh)
  const activeCategory = searchParams ? searchParams.get("category") || "" : "";

  useEffect(() => {
    // 1. Calculate Vietnam Timezone strictly
    try {
      const currentVnHour = getVNTime();
      if (!isNaN(currentVnHour)) {
        setVnHour(currentVnHour);
      }
    } catch {
      const now = new Date();
      setVnHour((now.getUTCHours() + 7) % 24);
    }

    // 2. Auth check
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

    // 3. Load exam, submission, and dynamic categories data
    async function loadData() {
      try {
        const [examData, subData, catData] = await Promise.all([
          getExams(true, user?.id),
          getSubmissions(user?.id),
          getCategories(true),
        ]);
        setExams(examData);
        setSubmissions(subData);
        setCategories(catData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Filtered exams according to selected category
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => matchCategory(exam, activeCategory));
  }, [exams, activeCategory]);

  // Greeting Configuration based on Vietnam Hour
  const greetingInfo = useMemo(() => {
    return getGreetingData(vnHour);
  }, [vnHour]);

  const GreetingIcon = greetingInfo.icon;

  // Dynamic Category Pills for Filter Tags Bar (Default: Tất cả đề thi + CNXH)
  const categoryPills = useMemo(() => {
    return [
      { id: "all", slug: "", label: "Tất cả đề thi", icon: Layers },
      ...categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.name,
        icon: BookText,
      })),
    ];
  }, [categories]);

  // Active category display metadata
  const currentCategoryObj =
    categoryPills.find((c) => c.slug === activeCategory) || categoryPills[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* =========================================================================
          1. DYNAMIC HOME / DASHBOARD GREETING HEADER (VIETNAM TIMEZONE GMT+7)
          ========================================================================= */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950/90 via-indigo-950/30 to-slate-950/90 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl group"
      >
        {/* Glow ambient background effect */}
        <div
          className={cn(
            "pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-75",
            greetingInfo.ambientGlow
          )}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* Top Tag: Greeting slot + Vietnam Timezone */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md",
                  greetingInfo.badgeStyle
                )}
              >
                <GreetingIcon className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {greetingInfo.greeting} {greetingInfo.emoji}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/80 border border-white/10 px-3 py-1 rounded-full font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Asia/Ho_Chi_Minh (GMT+7)</span>
              </span>
            </div>

            {/* Dynamic Greeting alongside user display name */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>{greetingInfo.greeting},</span>
              <span
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm",
                  greetingInfo.gradient
                )}
              >
                {currentUser?.username || "user1"}!
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
              Welcome back to ExamByHeu! Ready for today&apos;s test?
            </p>
          </div>

          {/* Highlights in Top Header */}
          <div className="hidden lg:flex flex-col items-end gap-2 shrink-0">
            <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-slate-300 shadow-md">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Chế độ Tập trung Toàn màn hình</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-slate-300 shadow-md">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span>Đồng hồ đếm ngược tự động</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* =========================================================================
          2. TITLE ROW & READ-ONLY STATS OVERVIEW CARD
          ========================================================================= */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
            {activeCategory ? (
              <>
                <span>Chuyên mục: {currentCategoryObj.label}</span>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-normal">
                  {filteredExams.length} đề thi
                </span>
              </>
            ) : (
              <>
                <span>Đề thi thử Khả dụng</span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-normal">
                  Hệ thống sẵn sàng
                </span>
              </>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {activeCategory
              ? `Đang lọc các đề thi thuộc chủ đề "${currentCategoryObj.label}". Chọn đề bên dưới để bắt đầu làm bài.`
              : "Chọn đề thi bên dưới để bắt đầu làm bài. Hệ thống sẽ tự động kích hoạt đồng hồ đếm ngược."}
          </p>
        </div>

        {/* Read-only Stats Overview Card (Preserved exact dimensions and icons) */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 w-full sm:w-[360px] md:w-[380px] bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 px-5 sm:px-6 shadow-xl select-none self-start md:self-auto cursor-default">
          {/* Cụm Đề hiện có */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Clipboard className="h-5 w-5 text-indigo-400 shrink-0 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <div className="text-sm font-medium text-slate-300 whitespace-nowrap">
              <span>Đề hiện có: </span>
              <strong className="text-base md:text-lg font-bold text-white tracking-wide">
                {loading ? "..." : exams.length}
              </strong>
            </div>
          </div>

          {/* Đường phân cách */}
          <div className="h-6 w-px bg-white/10 shrink-0" />

          {/* Cụm Hoàn thành */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ClipboardCheck className="h-5 w-5 text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <div className="text-sm font-medium text-slate-300 whitespace-nowrap">
              <span>Hoàn thành: </span>
              <strong className="text-base md:text-lg font-bold text-emerald-400 tracking-wide">
                {loading ? "..." : submissions.length}
              </strong>
            </div>
          </div>
        </div>
      </motion.div>

      {/* =========================================================================
          3. CATEGORY FILTER TABS / PILLS (SYNCHRONIZED WITH SIDEBAR ACCORDION)
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
        {categoryPills.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const CatIcon = cat.icon;
          const count = exams.filter((e) => matchCategory(e, cat.slug)).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                if (cat.slug) {
                  router.push(`/dashboard?category=${cat.slug}`);
                } else {
                  router.push("/dashboard");
                }
              }}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 shrink-0 select-none",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.35)]"
                  : "bg-slate-900/70 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-white/20"
              )}
            >
              <CatIcon
                className={cn(
                  "h-3.5 w-3.5 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400"
                )}
              />
              <span>{cat.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          4. EXAM CARDS GRID
          ========================================================================= */}
      {loading ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 flex h-48 items-center justify-center rounded-2xl">
          <p className="text-sm text-slate-400">
            Đang tải danh sách đề thi thử...
          </p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeCategory
              ? `Chưa có đề thi nào trong danh mục "${currentCategoryObj.label}"`
              : "Chưa có đề thi thử nào được xuất bản"}
          </h3>
          <p className="max-w-md text-xs text-slate-400">
            {activeCategory
              ? "Hiện tại chuyên đề này chưa có bài thi nào được xuất bản. Bạn có thể quay lại xem tất cả các đề thi hiện có."
              : "Vui lòng đăng nhập với quyền Quản trị viên để tải lên hoặc tạo đề thi mới từ tệp Word, Excel hoặc PDF."}
          </p>
          {activeCategory && (
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Hiển thị tất cả đề thi</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam, idx) => (
            <UserExamCard key={exam.id} exam={exam} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="h-40 rounded-2xl bg-slate-900/60 animate-pulse" />
          <div className="h-14 rounded-2xl bg-slate-900/40 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 rounded-2xl bg-slate-900/50 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-900/50 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-900/50 animate-pulse" />
          </div>
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
