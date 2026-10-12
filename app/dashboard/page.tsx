"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getExams, getSubmissions, getCurrentUser, getCategories } from "@/lib/store";
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

  // Filtered exams according to selected category
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => matchCategory(exam, activeCategory));
  }, [exams, activeCategory]);

  // Dynamic Category Pills for Filter Tags Bar
  const categoryPills = useMemo(() => {
    return [
      { id: "all", slug: "", label: "Tất cả đề thi" },
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
    <div className="mx-auto w-full max-w-[1750px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* =========================================================================
          1. SECTION TITLE ROW & STATS OVERVIEW CARD
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {activeCategory
              ? `Chuyên mục: ${currentCategoryObj.label}`
              : "Đề thi thử Khả dụng"}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {activeCategory
              ? `Đang lọc các đề thi thuộc chủ đề "${currentCategoryObj.label}". Chọn đề bên dưới để bắt đầu làm bài.`
              : "Chọn đề thi bên dưới để bắt đầu làm bài. Hệ thống sẽ tự động kích hoạt đồng hồ đếm ngược."}
          </p>
        </div>

        {/* Flat Minimal Stats Block */}
        <div className="flex items-center gap-6 bg-[#151b27] border border-white/[0.06] rounded-xl px-4 py-2 text-xs select-none self-start md:self-auto">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="text-slate-300">
              Đề hiện có:{" "}
              <strong className="font-bold text-white text-sm">
                {loading ? "..." : exams.length}
              </strong>
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Hoàn thành:{" "}
              <strong className="font-bold text-emerald-400 text-sm">
                {loading ? "..." : submissions.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. CATEGORY FILTER TABS / PILLS
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                "inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium text-center transition-colors shrink-0 select-none",
                isActive
                  ? "bg-[#4f57ea] text-white shadow-sm"
                  : "bg-[#151b27] border border-white/[0.06] text-slate-300 hover:text-white hover:bg-[#1b2230]"
              )}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          3. EXAM CARDS GRID (5 COLUMNS ULTRA-COMPACT UNIFORM TILES)
          ========================================================================= */}
      {loading ? (
        <div className="bg-[#151b27] border border-white/[0.06] flex h-48 items-center justify-center rounded-2xl">
          <p className="text-xs text-slate-400">Đang tải danh sách đề thi thử...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-[#151b27] border border-white/[0.06] flex flex-col items-center justify-center rounded-2xl py-12 px-4 text-center space-y-3">
          <div className="p-3 rounded-2xl bg-[#1b2230] text-indigo-400">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeCategory
              ? `Chưa có đề thi nào trong danh mục "${currentCategoryObj.label}"`
              : "Chưa có đề thi thử nào được xuất bản"}
          </h3>
          <p className="max-w-md text-xs text-slate-400">
            {activeCategory
              ? "Hiện tại chuyên đề này chưa có bài thi nào được xuất bản. Bạn có thể quay lại xem tất cả các đề thi hiện có."
              : "Vui lòng đăng nhập với quyền Quản trị viên để tải lên hoặc tạo đề thi mới."}
          </p>
          {activeCategory && (
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#4f57ea] hover:bg-[#434ac9] px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Hiển thị tất cả đề thi</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
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
        <div className="mx-auto w-full max-w-[1750px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="h-10 rounded-xl bg-[#151b27] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            <div className="h-40 rounded-2xl bg-[#151b27] animate-pulse" />
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
