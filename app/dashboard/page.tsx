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
      { id: "all", slug: "", label: "Tất cả đề đánh giá" },
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
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* =========================================================================
          1. SECTION TITLE ROW & STATS OVERVIEW CARD
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#1F2128] flex items-center gap-2.5">
            {activeCategory
              ? `Học phần: ${currentCategoryObj.label}`
              : "Bài đánh giá học phần khả dụng"}
          </h2>
          <p className="mt-1 text-xs text-[#7A7D88]">
            {activeCategory
              ? `Đang lọc các bài đánh giá thuộc học phần "${currentCategoryObj.label}". Chọn đề bên dưới để bắt đầu làm bài.`
              : "Chọn bài đánh giá bên dưới để bắt đầu làm bài. Thời gian làm bài sẽ được tính tự động."}
          </p>
        </div>

        {/* Flat Minimal Stats Block */}
        <div className="flex items-center gap-6 bg-white border border-black/[0.06] rounded-xl px-4 py-2 shadow-xs text-xs select-none self-start md:self-auto">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#D9482B] shrink-0" />
            <span className="text-[#7A7D88]">
              Số bài đánh giá:{" "}
              <strong className="font-bold text-[#1F2128] text-sm tnum tabular-nums">
                {loading ? "..." : exams.length}
              </strong>
            </span>
          </div>

          <div className="h-4 w-px bg-black/[0.06]" />

          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[#2E9E5B] shrink-0" />
            <span className="text-[#7A7D88]">
              Đã hoàn thành:{" "}
              <strong className="font-bold text-[#2E9E5B] text-sm tnum tabular-nums">
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
                "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium text-center transition-colors shrink-0 select-none cursor-pointer",
                isActive
                  ? "bg-[#D9482B] text-white shadow-xs font-semibold"
                  : "bg-white border border-black/[0.06] shadow-sm text-[#7A7D88] hover:text-[#1F2128] hover:bg-[#F6F6F8]"
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
        <div className="bg-white border border-black/[0.06] shadow-sm flex h-48 items-center justify-center rounded-2xl">
          <p className="text-xs text-[#7A7D88]">Đang tải danh sách bài đánh giá...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white border border-black/[0.06] shadow-sm flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center space-y-3">
          <div className="p-3 rounded-xl bg-[#FBE3DC] text-[#D9482B] border border-[#D9482B]/20">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#1F2128]">
            {activeCategory
              ? `Chưa có bài đánh giá nào trong học phần "${currentCategoryObj.label}"`
              : "Chưa có bài đánh giá nào được ban hành"}
          </h3>
          <p className="max-w-md text-xs text-[#7A7D88]">
            {activeCategory
              ? "Hiện tại học phần này chưa có bài đánh giá nào được ban hành. Bạn có thể quay lại xem tất cả bài đánh giá hiện có."
              : "Vui lòng đăng nhập với quyền Quản trị viên để ban hành bài đánh giá mới."}
          </p>
          {activeCategory && (
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#D9482B] hover:bg-[#C43E23] px-4 py-2 text-xs font-semibold text-white transition-all cursor-pointer shadow-xs hover:-translate-y-0.5"
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
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="h-10 rounded-xl bg-[#151b27] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            <div className="h-40 rounded-2xl bg-[#151b27] animate-pulse" />
            <div className="h-40 rounded-2xl bg-[#151b27] animate-pulse" />
            <div className="h-40 rounded-2xl bg-[#151b27] animate-pulse" />
            <div className="h-40 rounded-2xl bg-[#151b27] animate-pulse" />
          </div>
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
