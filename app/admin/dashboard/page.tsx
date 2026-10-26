"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  getExams,
  toggleExamStatus,
  toggleAllExamsShuffle,
  toggleSingleExamShuffle,
  deleteExam,
  getCurrentUser,
  getCategories,
  createExam,
  assignExamCategory,
  sortExamsAscending,
} from "@/lib/store";
import { Exam, Category } from "@/types/exam";
import { formatDuration } from "@/lib/utils";
import {
  BookOpen,
  FilePlus2,
  Eye,
  Trash2,
  AlertTriangle,
  X,
  Pencil,
  FolderPlus,
  CheckCircle2,
  Shuffle,
  LockOpen,
  Lock,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverSelect } from "@/components/ui/PopoverSelect";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { ComboboxInput } from "@/components/ui/ComboboxInput";

export default function AdminDashboardPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [exams, setExams] = useState<Exam[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Exam Creation Modal State
  const [isQuickExamModalOpen, setIsQuickExamModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategorySlug, setQuickCategorySlug] = useState("cnxh");
  const [quickDuration, setQuickDuration] = useState(60);
  const [quickQuestionCount, setQuickQuestionCount] = useState(75);
  const [quickQuestionType, setQuickQuestionType] = useState<"multiple_choice" | "essay" | "mixed">("multiple_choice");
  const [quickExpiresAt, setQuickExpiresAt] = useState("2026-10-11T23:59");
  const [quickStatus, setQuickStatus] = useState<"published" | "draft">("published");
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);
  const [showAdvancedQuick, setShowAdvancedQuick] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");

  // Sorted exams in ascending order (Đề 1 -> Đề 5), filtered by searchKeyword
  const sortedExams = useMemo(() => {
    let list = sortExamsAscending(exams);
    if (searchKeyword.trim()) {
      const q = searchKeyword.trim().toLowerCase();
      list = list.filter((e) => {
        const titleMatch = e.title.toLowerCase().includes(q);
        const descMatch = (e.description || "").toLowerCase().includes(q);
        const catMatch = (e.category_slug || "").toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch;
      });
    }
    return list;
  }, [exams, searchKeyword]);

  // Shuffle Exam States & Handlers
  const [isTogglingGlobalShuffle, setIsTogglingGlobalShuffle] = useState(false);

  const shuffledCount = useMemo(() => {
    return exams.filter((e) => Boolean(e.is_shuffled)).length;
  }, [exams]);

  const handleToggleGlobalShuffle = async () => {
    setIsTogglingGlobalShuffle(true);
    try {
      const nextState = shuffledCount < exams.length;
      const updated = await toggleAllExamsShuffle(nextState);
      setExams(updated);
    } catch (err) {
      console.error("Error toggling global shuffle:", err);
    } finally {
      setIsTogglingGlobalShuffle(false);
    }
  };

  const handleToggleSingleShuffle = async (examId: string) => {
    try {
      const updated = await toggleSingleExamShuffle(examId);
      if (updated) {
        setExams((prev) =>
          prev.map((e) => (e.id === examId ? updated : e))
        );
      }
    } catch (err) {
      console.error("Error toggling single shuffle:", err);
    }
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }

    async function loadData() {
      try {
        const [allExams, allCats] = await Promise.all([
          getExams(false),
          getCategories(false),
        ]);
        setExams(allExams);
        setCategories(allCats);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleToggleStatus = async (examId: string) => {
    const updated = await toggleExamStatus(examId);
    if (updated) {
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? updated : e))
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExam(examToDelete.id);
      setExams((prev) => prev.filter((e) => e.id !== examToDelete.id));
      setExamToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Exam submit
  const handleCreateQuickExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isCreatingQuick) return;

    setIsCreatingQuick(true);
    try {
      const selectedCat = categories.find((c) => c.slug === quickCategorySlug);
      const catId = selectedCat?.id || "";
      const catSlug = selectedCat?.slug || quickCategorySlug;

      const existingMatch = exams.find(
        (ex) => ex.title.trim().toLowerCase() === quickTitle.trim().toLowerCase()
      );

      if (existingMatch) {
        const updated = await assignExamCategory(existingMatch.id, catId, catSlug);
        if (updated) {
          setExams((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
        }
      } else {
        const created = await createExam(
          {
            title: quickTitle.trim(),
            description: `Bộ đề ôn tập & khảo thí môn ${selectedCat?.name || "Chuyên đề"}.`,
            duration_minutes: Number(quickDuration) || 60,
            category_id: catId,
            category_slug: catSlug,
            question_count: Number(quickQuestionCount) || 75,
            question_type: quickQuestionType,
            expires_at: quickExpiresAt ? new Date(quickExpiresAt).toISOString() : null,
            status: quickStatus,
          },
          Array.from({ length: Math.min(Number(quickQuestionCount) || 5, 5) }).map((_, idx) => ({
            id: `quick_q_${Date.now()}_${idx}`,
            content: `Câu hỏi ôn tập số ${idx + 1} môn ${selectedCat?.name || "Chuyên đề"}: Khái niệm và nguyên lý cốt lõi.`,
            options: [
              "A. Phương án đáp án mẫu A",
              "B. Phương án đáp án mẫu B",
              "C. Phương án đáp án mẫu C",
              "D. Phương án đáp án mẫu D",
            ],
            correct_answer: "A",
            type: (quickQuestionType === "essay" ? "essay" : "multiple_choice") as "multiple_choice" | "essay",
            max_score: 2.0,
          }))
        );

        setExams((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);
      }

      setIsQuickExamModalOpen(false);
      setQuickTitle("");
    } finally {
      setIsCreatingQuick(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Page Header Title Block */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white flex flex-wrap items-center gap-3">
              Quản lý Đề thi
              <span className="text-[11px] bg-[#10131B] text-[#9CA3AF] border border-[#252A37] px-3 py-1 rounded-full font-mono">
                Admin Panel
              </span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#9CA3AF] max-w-xl">
              Tổng quan hệ thống ExamByHeu, quản lý ngân hàng đề thi và phân loại danh mục.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#252A37] bg-[#10131B] px-4 py-2 text-xs text-[#9CA3AF] font-mono select-none">
              <BookOpen className="h-4 w-4 text-white shrink-0" />
              <span>Tổng số đề: <strong className="text-white font-bold tabular-nums">{loading ? "..." : exams.length}</strong></span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Exams Management Section */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border border-[#252A37] bg-[#161A24] overflow-hidden shadow-xl"
      >
        <div className="flex flex-col gap-3 border-b border-[#252A37] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Ngân hàng Đề thi
              <span className="text-xs font-bold font-mono text-white bg-[#10131B] border border-[#252A37] px-2.5 py-0.5 rounded-full">
                {sortedExams.length}{searchKeyword ? `/${exams.length}` : ""} đề
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-[#9CA3AF]">
              Xem trước cấu trúc đề, chỉnh sửa câu hỏi, đóng/mở xuất bản hoặc gán chuyên mục.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="pointer-events-none absolute left-3.5 top-3 h-3.5 w-3.5 text-[#8B93A5]" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm theo tên đề..."
                className="h-10 w-full rounded-full bg-[#10131B] border border-[#252A37] pl-9 pr-8 text-xs text-white placeholder-[#8B93A5] focus:outline-none focus:border-white/50 transition-colors"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword("")}
                  className="absolute right-3 top-2.5 text-[#8B93A5] hover:text-white text-xs p-0.5"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Nút Bật/Tắt Đảo Câu Hỏi */}
            <div
              className="inline-flex items-center gap-2 rounded-full border border-[#252A37] bg-[#10131B] px-4 py-2 text-xs select-none transition-colors"
            >
              <Shuffle className="h-4 w-4 text-white shrink-0" />
              <span className="font-medium text-slate-200">Đảo thứ tự câu hỏi</span>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={shuffledCount > 0}
                onClick={handleToggleGlobalShuffle}
                disabled={isTogglingGlobalShuffle}
                className={cn(
                  "relative ml-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                  shuffledCount > 0 ? "bg-white" : "bg-[#232836]"
                )}
                title="Bật/Tắt chế độ đảo thứ tự câu hỏi cho toàn bộ đề thi"
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out",
                    shuffledCount > 0 ? "translate-x-4 bg-black" : "translate-x-0 bg-white"
                  )}
                />
              </button>
            </div>

            <button
              onClick={() => {
                setQuickTitle("");
                setIsQuickExamModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#10131B] border border-[#2A2F3C] text-white hover:bg-[#161A24] font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 text-white shrink-0" />
              <span>Thêm vào Danh mục</span>
            </button>

            <Link
              href="/admin/exams/create"
              className="inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-200 text-[#05070D] font-bold px-5 py-2 text-xs transition-colors shadow-lg"
            >
              <FilePlus2 className="h-4 w-4 text-[#05070D]" />
              <span>Tạo đề</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-xs text-[#9CA3AF]">Đang tải dữ liệu...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-[#8B93A5]" />
            <p className="text-xs font-semibold text-slate-300">
              Chưa có đề thi nào
            </p>
            <button
              onClick={() => setIsQuickExamModalOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white text-black font-bold px-5 py-2 text-xs hover:bg-slate-200 transition"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Tạo đề thi đầu tiên
            </button>
          </div>
        ) : sortedExams.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Search className="mx-auto h-8 w-8 text-[#8B93A5]" />
            <p className="text-xs font-semibold text-slate-300">
              Không tìm thấy đề thi phù hợp với từ khóa &quot;{searchKeyword}&quot;
            </p>
            <button
              type="button"
              onClick={() => setSearchKeyword("")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#10131B] border border-[#252A37] text-white px-4 py-2 text-xs font-medium transition cursor-pointer"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#10131B] text-[#8B93A5] font-mono uppercase tracking-wider text-[11px] font-bold border-b border-[#252A37] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3.5 px-4 font-bold">TÊN ĐỀ THI</th>
                  <th className="py-3.5 px-4 font-bold">DANH MỤC</th>
                  <th className="py-3.5 px-4 font-bold">THỜI LƯỢNG</th>
                  <th className="py-3.5 px-4 font-bold">SỐ CÂU HỎI</th>
                  <th className="py-3.5 px-4 font-bold">DẠNG ĐỀ</th>
                  <th className="py-3.5 px-4 font-bold">TRẠNG THÁI</th>
                  <th className="py-3.5 px-4 text-right font-bold">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A37]">
                {sortedExams.map((exam, idx) => {
                  const isPublished = exam.status === "published";
                  const questionCount =
                    exam.question_count || exam.questions?.length || 0;
                  const catSlug = exam.category_slug || (exam.title.toLowerCase().includes("cnxh") ? "cnxh" : "Khác");
                  const catName =
                    categories.find((c) => c.slug === catSlug)?.name ||
                    (catSlug === "cnxh" ? "Chủ nghĩa xã hội (CNXH)" : catSlug);

                  return (
                    <tr
                      key={exam.id}
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-[#141824]" : "bg-[#161A24]",
                        "hover:bg-[#191E2B]"
                      )}
                    >
                      <td className="max-w-xs truncate py-3.5 px-4 font-bold text-white transition-colors">
                        {exam.title}
                      </td>

                      <td className="whitespace-nowrap py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#10131B] text-slate-200 border border-[#252A37]">
                          {catName}
                        </span>
                      </td>

                      <td className="whitespace-nowrap py-3.5 px-4 text-[#9CA3AF] font-mono tabular-nums">
                        {formatDuration(exam.duration_minutes)}
                      </td>

                      <td className="py-3.5 px-4 text-[#9CA3AF] font-mono tabular-nums">
                        <span className="text-white font-bold">{questionCount}</span> câu
                      </td>

                      <td className="py-3.5 px-4 text-[#9CA3AF]">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="capitalize font-medium text-slate-300">
                            {exam.question_type === "essay"
                              ? "Tự luận"
                              : exam.question_type === "mixed"
                              ? "Kết hợp"
                              : "Trắc nghiệm"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSingleShuffle(exam.id)}
                            className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border transition cursor-pointer select-none",
                              exam.is_shuffled
                                ? "bg-[#232836] text-white border-[#2A2F3C]"
                                : "bg-[#10131B] text-[#9CA3AF] border-[#252A37] hover:text-white hover:border-white/30"
                            )}
                            title={exam.is_shuffled ? "Đề này đang bật đảo câu hỏi (bấm để tắt nhanh)" : "Đề này đang tắt đảo câu hỏi (bấm để bật nhanh)"}
                          >
                            <Shuffle className="h-2.5 w-2.5 shrink-0" />
                            <span>{exam.is_shuffled ? "Đảo câu: Bật" : "Cố định"}</span>
                          </button>
                        </div>
                      </td>

                      <td className="whitespace-nowrap py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exam.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition cursor-pointer",
                            isPublished
                              ? "bg-[#232836] text-white border-[#2A2F3C] hover:border-white/30"
                              : "border-[#252A37] bg-[#10131B] text-[#9CA3AF] hover:text-white hover:border-white/30"
                          )}
                          title="Bấm để bật/tắt xuất bản đề thi"
                        >
                          {isPublished ? (
                            <>
                              <LockOpen className="h-3 w-3 text-emerald-400" />
                              Đã xuất bản
                            </>
                          ) : (
                            <>
                              <Lock className="h-3 w-3 text-[#8B93A5]" />
                              Bản nháp
                            </>
                          )}
                        </button>
                      </td>

                      <td className="whitespace-nowrap py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/exams/preview?id=${exam.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#10131B] border border-[#252A37] text-slate-300 hover:text-white hover:bg-[#161A24] px-3 py-1.5 text-xs font-medium transition-colors"
                            title="Xem trước toàn bộ câu hỏi và đáp án"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem trước</span>
                          </Link>

                          <Link
                            href={`/admin/exams/${exam.id}/edit`}
                            className="inline-flex items-center justify-center rounded-full bg-[#10131B] border border-[#252A37] text-slate-400 hover:text-white hover:bg-[#161A24] p-2 text-xs font-medium transition-colors"
                            title="Chỉnh sửa chi tiết đề thi"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setExamToDelete(exam)}
                            className="inline-flex items-center justify-center rounded-full bg-[#10131B] border border-[#252A37] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 text-xs transition-colors cursor-pointer"
                            title="Xóa đề thi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* 3. Modal: Quick Exam Creation assigned to Category */}
      <AnimatePresence>
        {isQuickExamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-[#161A24] border border-[#252A37] p-6 sm:p-7 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#252A37]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FolderPlus className="h-4.5 w-4.5 text-white shrink-0" />
                  <span>Thêm bài thi mới vào Chuyên mục</span>
                </h3>
                <button
                  onClick={() => setIsQuickExamModalOpen(false)}
                  className="p-1.5 rounded-full text-[#9CA3AF] hover:text-white hover:bg-[#10131B] transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickExam} className="space-y-4 mt-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                      Tiêu đề bài thi (Title) *
                    </label>
                    <span className="text-[11px] text-[#9CA3AF]">
                      Gõ tên mới hoặc chọn đề có sẵn
                    </span>
                  </div>
                  <ComboboxInput
                    required
                    value={quickTitle}
                    onChange={setQuickTitle}
                    placeholder="Nhập tên đề (Ví dụ: Đề cương CTMT: Đề 1)"
                    suggestions={sortedExams.map((ex) => ({
                      id: ex.id,
                      title: ex.title,
                      subtitle: `${ex.duration_minutes || 45} phút • ${ex.questions?.length || 40} câu`,
                    }))}
                  />
                </div>

                {/* Sub-category Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                    Chọn Danh mục con (Sub-category selection) *
                  </label>
                  <PopoverSelect
                    className="w-full"
                    buttonClassName="w-full"
                    menuClassName="w-full"
                    value={quickCategorySlug}
                    onChange={(val) => setQuickCategorySlug(val)}
                    options={categories.map((c) => ({
                      value: c.slug,
                      label: c.name,
                      description: `Mã: ${c.slug}`,
                    }))}
                  />
                </div>

                {/* Collapsible Advanced Settings (Optional) */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedQuick(!showAdvancedQuick)}
                    className="text-xs text-white hover:text-slate-200 flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                  >
                    <span>
                      {showAdvancedQuick
                        ? "▾ Thu gọn cấu hình nâng cao"
                        : "▸ + Cấu hình nâng cao (Thời lượng, số câu, hạn thi...)"}
                    </span>
                  </button>

                  {showAdvancedQuick && (
                    <div className="mt-3 space-y-4 p-4 rounded-2xl bg-[#10131B] border border-[#252A37]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Duration */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] block">
                            Thời lượng làm bài (phút)
                          </label>
                          <NumberStepper
                            value={quickDuration}
                            onChange={setQuickDuration}
                            min={1}
                            max={300}
                            step={5}
                            className="w-full justify-between"
                          />
                        </div>

                        {/* Question Count */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5] block">
                            Số lượng câu hỏi
                          </label>
                          <NumberStepper
                            value={quickQuestionCount}
                            onChange={setQuickQuestionCount}
                            min={1}
                            max={500}
                            step={1}
                            className="w-full justify-between"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Question Type */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                            Dạng câu hỏi
                          </label>
                          <PopoverSelect<"multiple_choice" | "essay" | "mixed">
                            className="w-full"
                            buttonClassName="w-full"
                            menuClassName="w-full"
                            value={quickQuestionType}
                            onChange={(val) => setQuickQuestionType(val)}
                            options={[
                              { value: "multiple_choice", label: "Trắc nghiệm" },
                              { value: "essay", label: "Tự luận" },
                              { value: "mixed", label: "Kết hợp Trắc nghiệm & Tự luận" },
                            ]}
                          />
                        </div>

                        {/* Expiration / Scheduled Date-Time */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                            Hạn thi / Lên lịch
                          </label>
                          <input
                            type="datetime-local"
                            value={quickExpiresAt}
                            onChange={(e) => setQuickExpiresAt(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#161A24] border border-[#252A37] rounded-full text-xs text-white focus:outline-none focus:border-white/50"
                          />
                        </div>
                      </div>

                      {/* Status action: Save draft vs Publish */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
                          Trạng thái xuất bản
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setQuickStatus("published")}
                            className={cn(
                              "py-2.5 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer",
                              quickStatus === "published"
                                ? "bg-white text-black border-transparent shadow-sm"
                                : "bg-[#161A24] border-[#252A37] text-[#9CA3AF] hover:text-white"
                            )}
                          >
                            Xuất bản ngay (Mở thi)
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickStatus("draft")}
                            className={cn(
                              "py-2.5 px-3 rounded-full border text-xs font-semibold transition-all cursor-pointer",
                              quickStatus === "draft"
                                ? "bg-white text-black border-transparent shadow-sm"
                                : "bg-[#161A24] border-[#252A37] text-[#9CA3AF] hover:text-white"
                            )}
                          >
                            Lưu bản nháp (Đóng)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#252A37]">
                  <button
                    type="button"
                    onClick={() => setIsQuickExamModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-xs text-[#9CA3AF] hover:text-white hover:bg-[#10131B] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingQuick}
                    className="px-6 py-2.5 bg-white hover:bg-slate-200 text-[#05070D] font-bold text-xs rounded-full shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                    <span>{isCreatingQuick ? "Đang lưu..." : "✓ Xác nhận & Thêm vào Danh mục"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Delete Confirmation Modal */}
      <AnimatePresence>
        {examToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-[#161A24] border border-[#252A37] p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setExamToDelete(null)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-[#9CA3AF] hover:bg-[#10131B] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-500/30 bg-[#10131B] text-rose-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Xác nhận xóa đề thi
                  </h3>
                  <p className="text-xs text-[#9CA3AF]">
                    Thao tác này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-[#252A37] bg-[#10131B] p-4 text-xs leading-relaxed text-slate-300">
                Bạn có chắc chắn muốn xóa đề thi{" "}
                <strong className="text-white">
                  &ldquo;{examToDelete.title}&rdquo;
                </strong>
                ? Toàn bộ câu hỏi và lịch sử bài nộp liên quan đến đề thi này sẽ bị xóa tự động.
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExamToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-full bg-[#10131B] border border-[#252A37] px-5 py-2 text-xs font-semibold text-[#9CA3AF] transition hover:bg-[#161A24] hover:text-white cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isDeleting ? "Đang xóa..." : "Xác nhận xóa"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
