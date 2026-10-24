"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Search,
  ArrowRight,
  Tag,
  FolderTree,
  ChevronDown,
  CheckCircle2,
  Library,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudyMaterials, getCategories } from "@/lib/store";
import { Category, StudyMaterial } from "@/types/exam";
import { PopoverSelect } from "@/components/ui/PopoverSelect";

export default function KnowledgeHubPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "title">("newest");

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("materials_updated", handleUpdate);
    return () => window.removeEventListener("materials_updated", handleUpdate);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMats, allCats] = await Promise.all([
        getStudyMaterials(),
        getCategories(false),
      ]);
      setMaterials(allMats);
      setCategories(allCats);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort
  const filteredMaterials = materials
    .filter((item) => {
      let matchCat = true;
      if (selectedCategory === "none") {
        matchCat = item.category_id === "none" || item.category_slug === "none" || !item.category_id;
      } else if (selectedCategory !== "all") {
        matchCat = item.category_id === selectedCategory || item.category_slug === selectedCategory;
      }

      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.category_name && item.category_name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title, "vi");
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="min-fluid-h p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Section: Tiêu đề chính chỉ để dòng chữ Học liệu & Đề cương */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6F6F8] border border-black/[0.08] text-[#111827] shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827] flex items-center gap-2">
              Tài liệu ôn tập
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Hệ thống học liệu, đề cương chi tiết và tài liệu tham khảo theo học phần
            </p>
          </div>
        </div>

        <div className="text-xs text-[#6B7280]">
          Tổng số: <span className="font-bold text-[#111827]">{materials.length}</span> bài viết
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu, khái niệm, chuyên đề..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/[0.08] bg-white text-xs text-[#111827] placeholder-[#A4A7B0] focus:border-[#111827] shadow-xs focus:outline-none transition-colors"
            />
          </div>

          {/* Interactive Category Selector with Secondary Content Bars */}
          <div className="md:col-span-4 relative">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                selectedCategory !== "all"
                  ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827] shadow-xs"
                  : "bg-white border-black/[0.08] text-[#111827] hover:border-black/[0.15] shadow-xs"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderTree className="h-4 w-4 text-[#111827] shrink-0" />
                <span className="text-[#6B7280] font-normal">Danh mục:</span>
                <span className="font-bold text-[#111827] truncate">
                  {selectedCategory === "all"
                    ? "Tất cả học phần"
                    : selectedCategory === "none"
                    ? "Tài liệu chung (Không gắn học phần)"
                    : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded-md bg-black/[0.05] text-[10px] font-mono text-[#6B7280]">
                  {selectedCategory === "all"
                    ? materials.length
                    : selectedCategory === "none"
                    ? materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length
                    : materials.filter((m) => m.category_id === selectedCategory || m.category_slug === selectedCategory).length}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-[#6B7280] transition-transform duration-200", isCategoryMenuOpen && "rotate-180")} />
              </div>
            </button>

            {/* Secondary Content Bars Popover */}
            <AnimatePresence>
              {isCategoryMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsCategoryMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-black/[0.08] bg-white/98 backdrop-blur-xl p-2 shadow-2xl space-y-1.5 min-w-[280px] rounded-2xl"
                  >
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center justify-between border-b border-black/[0.06] pb-2">
                      <span>Chọn học phần đào tạo</span>
                      <span>{categories.length + 2} phân loại</span>
                    </div>

                    {/* Thanh nội dung phụ: Tất cả học phần */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setIsCategoryMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group",
                        selectedCategory === "all"
                          ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827] shadow-xs"
                          : "border-transparent bg-transparent hover:bg-black/[0.03] hover:border-black/[0.06] text-[#111827]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-[#F6F6F8] border border-black/[0.08] flex items-center justify-center text-[#111827] shrink-0">
                          <Library className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111827] group-hover:text-[#111827] transition">
                            Tất cả học phần
                          </p>
                          <p className="text-[10px] text-[#6B7280]">Toàn bộ tài liệu trong hệ thống</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#F6F6F8] border border-black/[0.08] text-[#111827] font-bold">
                          {materials.length} bài
                        </span>
                        {selectedCategory === "all" && (
                          <CheckCircle2 className="h-4 w-4 text-[#111827]" />
                        )}
                      </div>
                    </button>

                    {/* Thanh nội dung phụ: Tài liệu chung (Không gắn học phần) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("none");
                        setIsCategoryMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group",
                        selectedCategory === "none"
                          ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827] shadow-xs"
                          : "border-transparent bg-transparent hover:bg-black/[0.03] hover:border-black/[0.06] text-[#111827]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#F6F6F8] border border-black/[0.08] flex items-center justify-center text-[#111827] shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111827] group-hover:text-[#111827] transition truncate">
                            Tài liệu chung (Không gắn học phần)
                          </p>
                          <p className="text-[10px] text-[#6B7280] truncate">Ghi chú & cẩm nang chung</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#F6F6F8] border border-black/[0.08] text-[#111827] font-bold">
                          {materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length} bài
                        </span>
                        {selectedCategory === "none" && (
                          <CheckCircle2 className="h-4 w-4 text-[#111827]" />
                        )}
                      </div>
                    </button>

                    {/* Các thanh nội dung phụ cho từng Chuyên mục */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {categories.map((c) => {
                        const count = materials.filter(
                          (m) => m.category_id === c.id || m.category_slug === c.slug
                        ).length;
                        const isSelected = selectedCategory === c.id || selectedCategory === c.slug;

                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(c.id);
                              setIsCategoryMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group",
                              isSelected
                                ? "bg-[#F6F6F8] border-black/[0.08] text-[#111827] shadow-xs"
                                : "border-transparent bg-transparent hover:bg-black/[0.03] hover:border-black/[0.06] text-[#111827]"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-[#F6F6F8] border border-black/[0.08] flex items-center justify-center text-[#111827] shrink-0">
                                <Tag className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#111827] group-hover:text-[#111827] transition truncate">
                                  {c.name}
                                </p>
                                <p className="text-[10px] text-[#6B7280] font-mono truncate">
                                  Mã: {c.slug}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#F6F6F8] border border-black/[0.08] text-[#111827] font-bold">
                                {count} bài
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-[#111827]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Selector */}
          <div className="md:col-span-3 flex items-center justify-end gap-2 text-xs">
            <span className="text-[#6B7280] text-xs shrink-0">Sắp xếp:</span>
            <PopoverSelect<"newest" | "title">
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              align="right"
              options={[
                {
                  value: "newest",
                  label: "Mới cập nhật nhất",
                },
                {
                  value: "title",
                  label: "Tiêu đề (A - Z)",
                },
              ]}
            />
          </div>
        </div>

        {/* Active category filter pill */}
        {selectedCategory !== "all" && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <span>Đang lọc theo:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-chip text-[#111827] border border-black/[0.08] text-xs font-bold">
              <Tag className="h-3 w-3" />
              {selectedCategory === "none"
                ? "Tài liệu chung (Không gắn học phần)"
                : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="hover:text-white ml-1 p-0.5 cursor-pointer rounded hover:bg-white/10 transition"
                title="Bỏ lọc, xem tất cả"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Materials Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={idx}
              className="h-60 rounded-2xl border border-black/[0.06] bg-[#F6F6F8] animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.08] bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-[#6b7280] mb-3" />
          <h3 className="text-sm font-bold text-[#111827]">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            Thử thay đổi bộ lọc danh mục hoặc từ khóa tìm kiếm để khám phá các bài viết lý thuyết khác.
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl glass-btn text-[#111827] text-xs font-bold transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMaterials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col justify-between rounded-[20px] border border-black/[0.08] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:border-black/[0.15] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 p-5 group"
            >
              <div className="space-y-3">
                {/* Meta badges: Emerald Teal tag for subject category without reading time */}
                <div className="flex items-center justify-between gap-2">
                  {item.category_id === "none" || item.category_slug === "none" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#111827] text-white border border-[#111827] shadow-xs">
                      <FileText className="h-3 w-3 text-white" />
                      <span>{item.category_name || "Không thuộc môn nào"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#111827] text-white border border-[#111827] shadow-xs">
                      <Tag className="h-3 w-3 text-white" />
                      <span>{item.category_name || "Chuyên đề"}</span>
                    </span>
                  )}
                </div>

                {/* Article Title: Bold & High contrast */}
                <Link href={`/knowledge/${item.id}`} className="block">
                  <h2 className="font-heading text-base font-bold text-[#111827] group-hover:text-[#111827] transition line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                </Link>

                {/* Summary */}
                <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed">
                  {item.summary || "Tổng hợp kiến thức trọng tâm và các dạng bài thường gặp..."}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-black/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#111827] max-w-[140px] truncate">
                  <div className="h-6 w-6 rounded-lg bg-[#111827] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
                    {(item.author || "A")[0].toUpperCase()}
                  </div>
                  <span className="truncate text-xs font-medium text-[#111827]">
                    {item.author || "An Hiếu"}
                  </span>
                </div>

                <Link
                  href={`/knowledge/${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] hover:bg-black text-white px-3.5 py-1.5 text-xs font-semibold cursor-pointer shadow-xs hover:shadow-sm transition-all active:scale-[0.98]"
                >
                  <span>Đọc bài</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2] text-white" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
