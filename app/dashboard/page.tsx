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
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "ALL">("1M");
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    title: string;
    score: number;
    date: string;
  } | null>(null);

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

  // Chart Spline Coordinates & Curve Computation
  const chartData = useMemo(() => {
    // Generate chronological data points from submissions or standard baseline
    const sorted = [...submissions].sort(
      (a, b) =>
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    );

    const pointsToUse =
      sorted.length > 0
        ? sorted.slice(-10).map((s, idx) => ({
            id: s.id || `pt-${idx}`,
            label: s.exam?.title || `Assessment #${idx + 1}`,
            date: new Date(s.submitted_at).toLocaleDateString("vi-VN", {
              month: "short",
              day: "numeric",
            }),
            score: Math.max(0, Math.min(10, Number(s.total_score || 0))),
          }))
        : [
            { id: "b1", label: "Baseline 1", date: "W1", score: 6.5 },
            { id: "b2", label: "Baseline 2", date: "W2", score: 7.2 },
            { id: "b3", label: "Baseline 3", date: "W3", score: 8.0 },
            { id: "b4", label: "Baseline 4", date: "W4", score: 7.8 },
            { id: "b5", label: "Baseline 5", date: "W5", score: 8.9 },
            { id: "b6", label: "Baseline 6", date: "W6", score: 9.4 },
          ];

    const width = 860;
    const height = 180;
    const padX = 40;
    const padY = 24;

    const count = pointsToUse.length;
    const stepX = count > 1 ? (width - padX * 2) / (count - 1) : 0;

    const coords = pointsToUse.map((pt, idx) => {
      const x = count === 1 ? width / 2 : padX + idx * stepX;
      // y ranges from height - padY (score 0) down to padY (score 10)
      const y = height - padY - (pt.score / 10) * (height - padY * 2);
      return { ...pt, x, y };
    });

    // Build Smooth Spline Path (Cubic Bezier)
    if (coords.length === 0) return { coords: [], pathD: "", areaD: "" };
    if (coords.length === 1) {
      return {
        coords,
        pathD: `M 40 ${coords[0].y} L 820 ${coords[0].y}`,
        areaD: `M 40 ${coords[0].y} L 820 ${coords[0].y} L 820 ${height - padY} L 40 ${height - padY} Z`,
      };
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = `${d} L ${last.x} ${height - padY} L ${first.x} ${height - padY} Z`;

    return { coords, pathD: d, areaD: area };
  }, [submissions]);

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
          3. CHART & ANALYTICS WIDGET ("Signed over time" Spline Style)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#18191E] border border-white/[0.06] p-5 sm:p-6 space-y-4">
        {/* Header with Title, Subtitle and Timeframe Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Activity & Performance Trajectory
              </h2>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full border border-white/[0.04]">
                Signed over time
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Cumulative examination scores and session consistency over the timeline.
            </p>
          </div>

          {/* Timeframe pill selector */}
          <div className="flex items-center gap-1 bg-[#111215] border border-white/[0.06] rounded-full p-1 self-start sm:self-auto">
            {(["1W", "1M", "3M", "ALL"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer",
                  timeRange === range
                    ? "bg-white text-zinc-950 font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Spline Line Chart Container */}
        <div className="relative w-full overflow-hidden pt-2">
          {/* Hover Tooltip Overlay */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none z-20 transform -translate-x-1/2 -translate-y-full mb-2 bg-[#111215] border border-white/[0.1] rounded-lg px-2.5 py-1.5 shadow-xl text-left"
              style={{
                left: `${(hoveredPoint.x / 860) * 100}%`,
                top: `${(hoveredPoint.y / 180) * 100}%`,
              }}
            >
              <p className="text-[11px] font-semibold text-white truncate max-w-[200px]">
                {hoveredPoint.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-0.5">
                <span>Điểm: <strong className="text-emerald-400">{hoveredPoint.score}/10</strong></span>
                <span>•</span>
                <span>{hoveredPoint.date}</span>
              </div>
            </div>
          )}

          <svg
            viewBox="0 0 860 180"
            className="w-full h-44 sm:h-52 overflow-visible select-none"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Subtle vertical hatched lines */}
              <pattern
                id="lunor-hatch"
                width="12"
                height="12"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="12"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1.2"
                />
              </pattern>

              {/* Area subtle gradient */}
              <linearGradient id="lunor-spline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Understated Y-Grid Lines */}
            {[24, 62, 100, 138, 156].map((gy, i) => (
              <line
                key={gy}
                x1="40"
                y1={gy}
                x2="820"
                y2={gy}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Y-axis Understated Labels */}
            <text x="15" y="30" className="text-[9px] font-mono fill-zinc-600">
              10
            </text>
            <text x="15" y="68" className="text-[9px] font-mono fill-zinc-600">
              7.5
            </text>
            <text x="15" y="106" className="text-[9px] font-mono fill-zinc-600">
              5.0
            </text>
            <text x="15" y="144" className="text-[9px] font-mono fill-zinc-600">
              2.5
            </text>
            <text x="15" y="160" className="text-[9px] font-mono fill-zinc-600">
              0
            </text>

            {/* Shaded Area under spline: Hatched + Gradient */}
            {chartData.areaD && (
              <>
                <path d={chartData.areaD} fill="url(#lunor-spline-grad)" />
                <path d={chartData.areaD} fill="url(#lunor-hatch)" />
              </>
            )}

            {/* Smooth Spline Curve Line */}
            {chartData.pathD && (
              <path
                d={chartData.pathD}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-300 drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]"
              />
            )}

            {/* Interactive Data Points */}
            {chartData.coords.map((pt) => (
              <g
                key={pt.id}
                className="cursor-pointer group"
                onMouseEnter={() =>
                  setHoveredPoint({
                    x: pt.x,
                    y: pt.y,
                    title: pt.label,
                    score: pt.score,
                    date: pt.date,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="7"
                  className="fill-transparent group-hover:fill-white/10 transition-colors"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  className="fill-[#111215] stroke-white stroke-2 transition-transform duration-200 group-hover:scale-125"
                />
              </g>
            ))}
          </svg>

          {/* X-axis Understated Timeline Labels */}
          <div className="flex items-center justify-between px-10 text-[10px] font-mono text-zinc-500 pt-1">
            {chartData.coords.map((pt) => (
              <span key={pt.id} className="truncate">
                {pt.date}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. FILTER TABS & SEARCH BAR
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
          <div className="h-56 rounded-2xl bg-[#18191E] animate-pulse" />
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
