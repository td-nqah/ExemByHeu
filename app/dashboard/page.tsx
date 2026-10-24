"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getExams, getSubmissions, getCurrentUser, getCategories, sortExamsAscending } from "@/lib/store";
import { Exam, Submission, Category } from "@/types/exam";
import { UserExamCard } from "@/components/dashboard/UserExamCard";
import {
  BookOpen,
  ClipboardList,
  CheckSquare,
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

function UserDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Category from URL searchParams (e.g. ?category=cnxh)
  const activeCategory = searchParams ? searchParams.get("category") || "" : "";

  useEffect(() => {
    // 1. Auth check
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }

    // 2. Load exam, submission, and dynamic categories data
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

  // Filtered exams according to selected category and sorted ascending (Đề 1 -> Đề 5)
  const filteredExams = useMemo(() => {
    const matched = exams.filter((exam) => matchCategory(exam, activeCategory));
    return sortExamsAscending(matched);
  }, [exams, activeCategory]);

  // Dynamic Category Pills for Filter Tags Bar
  const categoryPills = useMemo(() => {
    return [
      { id: "all", slug: "", label: "Tất cả các đánh giá" },
      ...categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        label: c.name,
      })),
    ];
  }, [categories]);

  // Active category display metadata
  const currentCategoryObj =
    categoryPills.find((c) => c.slug === activeCategory) || categoryPills[0];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 pt-5 pb-6 space-y-6">
      {/* =========================================================================
          1. SECTION TITLE ROW & STATS OVERVIEW CARD
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:pr-24 lg:md:pr-28">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#111827] dark:text-white flex items-center gap-2.5">
            {activeCategory
              ? `Học phần: ${currentCategoryObj.label}`
              : "Bài đánh giá học phần khả dụng"}
          </h2>
          <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            {activeCategory
              ? `Đang lọc các bài đánh giá thuộc học phần "${currentCategoryObj.label}". Chọn đề bên dưới để bắt đầu làm bài.`
              : "Chọn bài đánh giá bên dưới để bắt đầu làm bài. Thời gian làm bài sẽ được tính tự động."}
          </p>
        </div>

        {/* Flat Minimal Stats Block - Separate Monochrome Pills */}
        <div className="flex items-center gap-3 select-none self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-[#121318] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-1.5 shadow-xs text-xs">
            <ClipboardList className="h-4 w-4 text-[#111827] dark:text-white shrink-0" />
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">
              Số bài đánh giá:{" "}
              <strong className="font-bold text-[#111827] dark:text-white text-sm tabular-nums">
                {loading ? "..." : exams.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-[#121318] border border-black/[0.08] dark:border-white/[0.08] rounded-xl px-3.5 py-1.5 shadow-xs text-xs">
            <CheckSquare className="h-4 w-4 text-[#111827] dark:text-white shrink-0" />
            <span className="text-[#6B7280] dark:text-[#9CA3AF]">
              Đã hoàn thành:{" "}
              <strong className="font-bold text-[#111827] dark:text-white text-sm tabular-nums">
                {loading ? "..." : submissions.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. CATEGORY FILTER TABS / PILLS
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-1.5 scrollbar-none">
        {categoryPills.map((cat) => {
          const isActive = activeCategory === cat.slug;

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
                "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs text-center shrink-0 select-none cursor-pointer transition-colors",
                isActive
                  ? "bg-[#111827] text-white border border-black/80 dark:bg-white dark:text-[#0A0B0E] dark:border-white font-bold shadow-xs"
                  : "bg-white text-[#111827] border border-black/[0.08] hover:bg-[#FAFAFC] dark:bg-[#14161D] dark:text-[#9CA3AF] dark:hover:text-white dark:border-white/[0.08] dark:hover:bg-white/[0.06] font-medium shadow-xs"
              )}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          3. EXAM CARDS GRID (RESPONSIVE DYNAMIC GRID: 1 -> 2 -> 3 -> 4 COLS)
          ========================================================================= */}
      {loading ? (
        <div className="bg-white dark:bg-[#121318] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex h-48 items-center justify-center rounded-2xl">
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Đang tải danh sách bài đánh giá...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white dark:bg-[#121318] border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center space-y-3">
          <div className="p-3 rounded-xl glass-badge text-[#111827] dark:text-white border border-white/[0.1]">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#111827] dark:text-white">
            {activeCategory
              ? `Chưa có bài đánh giá nào trong học phần "${currentCategoryObj.label}"`
              : "Chưa có bài đánh giá nào được ban hành"}
          </h3>
          <p className="max-w-md text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            {activeCategory
              ? "Hiện tại học phần này chưa có bài đánh giá nào được ban hành. Bạn có thể quay lại xem tất cả bài đánh giá hiện có."
              : "Vui lòng đăng nhập với quyền Quản trị viên để ban hành bài đánh giá mới."}
          </p>
          {activeCategory && (
            <button
              onClick={() => router.push("/dashboard")}
              className="glass-btn mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Hiển thị tất cả đề đánh giá</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 pt-5 pb-6 space-y-6">
          <div className="h-10 rounded-xl bg-white/[0.06] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            <div className="h-40 rounded-2xl bg-white/[0.06] animate-pulse" />
            <div className="h-40 rounded-2xl bg-white/[0.06] animate-pulse" />
            <div className="h-40 rounded-2xl bg-white/[0.06] animate-pulse" />
            <div className="h-40 rounded-2xl bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
