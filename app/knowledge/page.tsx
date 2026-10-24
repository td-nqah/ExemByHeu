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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F6F6F8] dark:bg-[#14161D] border border-white/[0.08] text-[#111827] dark:text-white shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white flex items-center gap-2">
              Tài liệu ôn tập
            </h1>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              Hệ thống học liệu, đề cương chi tiết và tài liệu tham khảo theo học phần
            </p>
          </div>
        </div>

        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          Tổng số: <span className="font-bold text-[#111827] dark:text-white">{materials.length}</span> bài viết
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu, khái niệm, chuyên đề..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#14161D] text-xs text-[#111827] dark:text-white placeholder-[#A4A7B0] dark:placeholder-[#6B7280] focus:border-black/30 dark:focus:border-white/40 shadow-xs focus:outline-none transition-colors"
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
                  ? "bg-[#111827] text-white border-black/80 dark:bg-white dark:text-[#0A0B0E] dark:border-white shadow-xs"
                  : "bg-white dark:bg-[#14161D] border-black/[0.08] dark:border-white/[0.1] text-[#111827] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.06] shadow-xs"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderTree className="h-4 w-4 text-[#111827] dark:text-white shrink-0" />
                <span className="text-[#6B7280] dark:text-[#9CA3AF] font-normal">Danh mục:</span>
                <span className="font-bold text-[#111827] dark:text-white truncate">
                  {selectedCategory === "all"
                    ? "Tất cả học phần"
                    : selectedCategory === "none"
                    ? "Tài liệu chung (Không gắn học phần)"
                    : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] font-mono text-[#6B7280] dark:text-[#9CA3AF]">
                  {selectedCategory === "all"
                    ? materials.length
                    : selectedCategory === "none"
                    ? materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length
                    : materials.filter((m) => m.category_id === selectedCategory || m.category_slug === selectedCategory).length}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-[#6B7280] dark:text-[#9CA3AF] transition-transform duration-200", isCategoryMenuOpen && "rotate-180")} />
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
                    className="absolute left-0 right-0 top-full mt-2 z-40 rounded-2xl border border-white/[0.1] bg-white dark:bg-[#1A1D26]/98 backdrop-blur-xl p-2 shadow-2xl space-y-1.5 min-w-[280px] rounded-2xl"
                  >
                    <div className="px-2.5 py-1.5 text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider flex items-center justify-between border-b border-white/[0.08] pb-2">
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
                          ? "bg-white text-[#0A0B0E] border-white shadow-xs"
                          : "border-transparent bg-transparent hover:bg-white/[0.06] hover:border-white/[0.08] text-[#111827] dark:text-white/90"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", selectedCategory === "all" ? "bg-[#0A0B0E] text-[#111827] dark:text-white" : "bg-white/[0.08] border border-white/[0.1] text-[#111827] dark:text-white")}>
                          <Library className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={cn("text-xs font-bold transition", selectedCategory === "all" ? "text-[#0A0B0E]" : "text-[#111827] dark:text-white")}>
                            Tất cả học phần
                          </p>
                          <p className={cn("text-[10px]", selectedCategory === "all" ? "text-[#4B5563]" : "text-[#6B7280] dark:text-[#9CA3AF]")}>Toàn bộ tài liệu trong hệ thống</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-mono font-bold", selectedCategory === "all" ? "bg-[#0A0B0E] text-[#111827] dark:text-white" : "bg-white/[0.08] border border-white/[0.1] text-[#111827] dark:text-white")}>
                          {materials.length} bài
                        </span>
                        {selectedCategory === "all" && (
                          <CheckCircle2 className="h-4 w-4 text-[#0A0B0E]" />
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
                          ? "bg-white text-[#0A0B0E] border-white shadow-xs"
                          : "border-transparent bg-transparent hover:bg-white/[0.06] hover:border-white/[0.08] text-[#111827] dark:text-white/90"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", selectedCategory === "none" ? "bg-[#0A0B0E] text-[#111827] dark:text-white" : "bg-white/[0.08] border border-white/[0.1] text-[#111827] dark:text-white")}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-bold transition truncate", selectedCategory === "none" ? "text-[#0A0B0E]" : "text-[#111827] dark:text-white")}>
                            Tài liệu chung (Không gắn học phần)
                          </p>
                          <p className={cn("text-[10px] truncate", selectedCategory === "none" ? "text-[#4B5563]" : "text-[#6B7280] dark:text-[#9CA3AF]")}>Ghi chú & cẩm nang chung</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-mono font-bold", selectedCategory === "none" ? "bg-[#0A0B0E] text-[#111827] dark:text-white" : "bg-white/[0.08] border border-white/[0.1] text-[#111827] dark:text-white")}>
                          {materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length} bài
                        </span>
                        {selectedCategory === "none" && (
                          <CheckCircle2 className="h-4 w-4 text-[#0A0B0E]" />
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
                                ? "bg-white text-[#0A0B0E] border-white shadow-xs"
                                : "border-transparent bg-transparent hover:bg-white/[0.06] hover:border-white/[0.08] text-[#111827] dark:text-white/90"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", isSelected ? "bg-[#0A0B0E] text-[#111827] dark:text-white" : "bg-white/[0.08] border border-white/[0.1] text-[#111827] dark:text-white")}>
                                <Tag className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className={cn("text-xs font-bold transition truncate", isSelected ? "text-[#0A0B0E]" : "text-[#111827] dark:text-white")}>
                                  {c.name}
                                </p>
                                <p className={cn("text-[10px] font-mono truncate", isSelected ? "text-[#4B5563]" : "text-[#6B7280] dark:text-[#9CA3AF]")}>
                                  Mã: {c.slug}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-mono font-bold", isSelected ? "bg-[#0A0B0E] text-[#111827] dark:text-white" : "bg-white/[0.08] border border-white/[0.1] text-[#111827] dark:text-white")}>
                                {count} bài
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-[#0A0B0E]" />
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
            <span className="text-[#6B7280] dark:text-[#9CA3AF] text-xs shrink-0">Sắp xếp:</span>
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
          <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            <span>Đang lọc theo:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-chip text-[#111827] dark:text-white border border-white/[0.08] text-xs font-bold">
              <Tag className="h-3 w-3" />
              {selectedCategory === "none"
                ? "Tài liệu chung (Không gắn học phần)"
                : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="hover:text-[#111827] dark:text-white ml-1 p-0.5 cursor-pointer rounded hover:bg-white/10 transition"
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
              className="h-60 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/[0.1] dark:border-white/[0.1] bg-[#F6F6F8] dark:bg-[#1A1D26] p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-[#6b7280] mb-3" />
          <h3 className="text-sm font-bold text-[#111827] dark:text-white">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-sm mx-auto">
            Thử thay đổi bộ lọc danh mục hoặc từ khóa tìm kiếm để khám phá các bài viết lý thuyết khác.
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl glass-btn text-[#111827] dark:text-white text-xs font-bold transition cursor-pointer"
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
              className="flex flex-col justify-between rounded-[20px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1A1D26] shadow-xs dark:shadow-[0_2px_4px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 transition-all duration-300 p-5 group"
            >
              <div className="space-y-3">
                {/* Meta badges: Subject category without reading time */}
                <div className="flex items-center justify-between gap-2">
                  {item.category_id === "none" || item.category_slug === "none" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F6F6F8] dark:bg-[#1A1C24] text-[#111827] dark:text-white border border-black/[0.08] dark:border-white/[0.1] shadow-xs">
                      <FileText className="h-3 w-3 text-[#111827] dark:text-white" />
                      <span>{item.category_name || "Không thuộc môn nào"}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F6F6F8] dark:bg-[#1A1C24] text-[#111827] dark:text-white border border-black/[0.08] dark:border-white/[0.1] shadow-xs">
                      <Tag className="h-3 w-3 text-[#111827] dark:text-white" />
                      <span>{item.category_name || "Chuyên đề"}</span>
                    </span>
                  )}
                </div>

                {/* Article Title: Bold & High contrast */}
                <Link href={`/knowledge/${item.id}`} className="block">
                  <h2 className="font-heading text-base font-bold text-[#111827] dark:text-white group-hover:text-black dark:group-hover:text-white transition line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                </Link>

                {/* Summary */}
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-3 leading-relaxed">
                  {item.summary || "Tổng hợp kiến thức trọng tâm và các dạng bài thường gặp..."}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#111827] dark:text-white max-w-[140px] truncate">
                  <div className="h-6 w-6 rounded-lg bg-[#F6F6F8] dark:bg-[#1A1C24] border border-black/[0.08] dark:border-white/[0.1] text-[#111827] dark:text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
                    {(item.author || "A")[0].toUpperCase()}
                  </div>
                  <span className="truncate text-xs font-medium text-[#111827] dark:text-white">
                    {item.author || "An Hiếu"}
                  </span>
                </div>

                <Link
                  href={`/knowledge/${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A0B0E] px-3.5 py-1.5 text-xs font-bold cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all active:scale-[0.98]"
                >
                  <span>Đọc bài</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2]" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
