"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getExams,
  getSubmissions,
  getCurrentUser,
  getCategories,
  sortExamsAscending,
} from "@/lib/store";
import { Exam, Submission, Category, Profile } from "@/types/exam";
import { UserExamCard } from "@/components/dashboard/UserExamCard";
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Zap,
  RotateCcw,
  Search,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Category tag colors matching sidebar
const CATEGORY_COLORS = [
  "#3B82F6", // Electric Blue
  "#64748B", // Slate
  "#D97706", // Warm Amber
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#F43F5E", // Rose
];

function formatDisplayName(name?: string): string {
  if (!name) return "Student";
  const cleaned = name.trim().replace(/!+$/, "");
  const lower = cleaned.toLowerCase();
  if (lower === "admin") return "Admin";
  if (lower === "user1") return "User1";
  if (lower === "user2") return "User2";
  if (lower === "user3") return "User3";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

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

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");


  const activeCategory = searchParams ? searchParams.get("category") || "" : "";

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setCurrentUser(user);

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

  // Aggregate Metrics for KPI Cards
  const totalExamsCount = exams.length;
  const totalSubmissionsCount = submissions.length;

  const averageScore = useMemo(() => {
    if (submissions.length === 0) return 0;
    const sum = submissions.reduce(
      (acc, s) => acc + (Number(s.total_score) || 0),
      0
    );
    return Number((sum / submissions.length).toFixed(1));
  }, [submissions]);

  const completionRate = useMemo(() => {
    if (totalExamsCount === 0) return 0;
    const completedIds = new Set(
      submissions.map((s) => s.exam_id || s.exam?.id).filter(Boolean)
    );
    return Math.min(100, Math.round((completedIds.size / totalExamsCount) * 100));
  }, [submissions, totalExamsCount]);

  

  // Filtered exams according to selected category and search input
  const filteredExams = useMemo(() => {
    let matched = exams.filter((exam) => matchCategory(exam, activeCategory));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matched = matched.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return sortExamsAscending(matched);
  }, [exams, activeCategory, searchQuery]);

  // Category Pills
  const categoryPills = useMemo(() => {
    return [
      { id: "all", slug: "", label: "Tất cả đề đánh giá" },
      ...categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.name,
      })),
    ];
  }, [categories]);

  const currentCategoryObj =
    categoryPills.find((c) => c.slug === activeCategory) || categoryPills[0];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* =========================================================================
          1. GREETING HEADER & MINIMALIST BREADCRUMB
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {/* Minimalist breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mb-1.5">
            <Link href="/home" className="hover:text-zinc-300 transition-colors">
              Platform
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
            <span className="text-zinc-400">Assessments</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" strokeWidth={1.5} />
            <span className="text-white font-medium">Overview</span>
          </div>

          {/* Bold Welcoming Header */}
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Welcome back, {formatDisplayName(currentUser?.username)}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
            Track your assessment trajectory, analyze performance scores, and test academic knowledge.
          </p>
        </div>

        {/* Status indicator on right edge */}
        <div className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 rounded-full bg-[#18191E] border border-white/[0.06] text-xs font-mono text-zinc-400 select-none">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Evaluation Room Ready</span>
        </div>
      </div>

      {/* =========================================================================
          2. STAT / KPI METRIC CARDS (LUNOR 4-COLUMN SURFACE)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Assessments */}
        <div className="rounded-2xl bg-[#18191E] border border-white/[0.06] p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Available Assessments
            </p>
            <h3 className="mt-2 text-3xl font-bold text-white tracking-tight tabular-nums">
              {loading ? "..." : totalExamsCount}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Active test modules
            </p>
          </div>
          {/* Miniature dark structured icon box */}
          <div className="h-11 w-11 rounded-xl bg-[#111215] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center text-zinc-300 shrink-0">
            <BookOpen className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Card 2: Completed Sessions */}
        <div className="rounded-2xl bg-[#18191E] border border-white/[0.06] p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Completed Sessions
            </p>
            <h3 className="mt-2 text-3xl font-bold text-white tracking-tight tabular-nums">
              {loading ? "..." : totalSubmissionsCount}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Graded submissions
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#111215] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center text-zinc-300 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-[#10B981]" strokeWidth={1.5} />
          </div>
        </div>

        {/* Card 3: Average Score */}
        <div className="rounded-2xl bg-[#18191E] border border-white/[0.06] p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Average Score
            </p>
            <h3 className="mt-2 text-3xl font-bold text-white tracking-tight tabular-nums">
              {loading ? "..." : averageScore}{" "}
              <span className="text-sm font-normal text-zinc-500">/ 10</span>
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              GPA rating scale
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#111215] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center text-zinc-300 shrink-0">
            <TrendingUp className="h-5 w-5 text-[#D97706]" strokeWidth={1.5} />
          </div>
        </div>

        {/* Card 4: Progress / Completion Rate */}
        <div className="rounded-2xl bg-[#18191E] border border-white/[0.06] p-5 flex items-center justify-between hover:border-zinc-700 transition-colors">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Completion Rate
            </p>
            <h3 className="mt-2 text-3xl font-bold text-white tracking-tight tabular-nums">
              {loading ? "..." : `${completionRate}%`}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Assessment bank coverage
            </p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-[#111215] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] flex items-center justify-center text-zinc-300 shrink-0">
            <Zap className="h-5 w-5 text-[#8B5CF6]" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FILTER TABS & SEARCH BAR
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Dynamic Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto sm:flex-wrap pb-1 scrollbar-none">
          {categoryPills.map((cat, idx) => {
            const isActive = activeCategory === cat.slug;
            const badgeColor =
              cat.slug === ""
                ? "#FFFFFF"
                : CATEGORY_COLORS[(idx - 1) % CATEGORY_COLORS.length];

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.slug) {
                    router.push(`/dashboard?category=${cat.slug}`);
                  } else {
                    router.push("/dashboard");
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shrink-0 select-none cursor-pointer",
                  isActive
                    ? "bg-white text-zinc-950 font-semibold shadow-xs"
                    : "bg-[#18191E] border border-white/[0.06] text-zinc-400 hover:text-white hover:border-zinc-700"
                )}
              >
                {cat.slug && (
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: badgeColor }}
                  />
                )}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* In-page keyword filter input */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc theo tên bài đánh giá..."
            className="w-full rounded-full bg-[#18191E] border border-white/[0.06] pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* =========================================================================
          5. CONTENT CARDS & ACTION ITEMS (BOTTOM GRID)
          ========================================================================= */}
      {loading ? (
        <div className="bg-[#18191E] border border-white/[0.06] flex h-48 items-center justify-center rounded-2xl">
          <p className="text-xs text-zinc-400">Đang tải danh sách bài đánh giá...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-[#18191E] border border-white/[0.06] flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center space-y-3">
          <div className="p-3 rounded-xl bg-[#111215] text-zinc-400 border border-white/[0.08]">
            <BookOpen className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-semibold text-white">
            {activeCategory
              ? `Chưa có bài đánh giá nào trong học phần "${currentCategoryObj.label}"`
              : "Không tìm thấy bài đánh giá phù hợp"}
          </h3>
          <p className="max-w-md text-xs text-zinc-400">
            {activeCategory
              ? "Hiện tại học phần này chưa có bài đánh giá nào được kích hoạt. Bạn có thể quay lại xem tất cả bài đánh giá."
              : "Vui lòng thử lại với từ khóa tìm kiếm khác hoặc làm mới bộ lọc."}
          </p>
          {(activeCategory || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                router.push("/dashboard");
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Hiển thị tất cả đề thi</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
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
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="h-10 rounded-xl bg-[#18191E] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-28 rounded-2xl bg-[#18191E] animate-pulse" />
            <div className="h-28 rounded-2xl bg-[#18191E] animate-pulse" />
            <div className="h-28 rounded-2xl bg-[#18191E] animate-pulse" />
            <div className="h-28 rounded-2xl bg-[#18191E] animate-pulse" />
          </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="h-52 rounded-2xl bg-[#18191E] animate-pulse" />
            <div className="h-52 rounded-2xl bg-[#18191E] animate-pulse" />
            <div className="h-52 rounded-2xl bg-[#18191E] animate-pulse" />
            <div className="h-52 rounded-2xl bg-[#18191E] animate-pulse" />
          </div>
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
