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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1B1F2A]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10131B] border border-[#252A37] text-white shadow-sm shadow-black/40">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/40 leading-tight flex items-center gap-2">
              Tài liệu ôn tập
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1.5 leading-relaxed">
              Hệ thống học liệu, đề cương chi tiết và tài liệu tham khảo theo học phần
            </p>
          </div>
        </div>

        <div className="text-xs text-[#9CA3AF] tabular-nums">
          Tổng số: <span className="font-bold text-white">{materials.length}</span> bài viết
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B93A5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu, khái niệm, chuyên đề..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#252A37] bg-[#10131B] text-xs text-white placeholder-[#8B93A5] focus:border-white/40 focus:outline-none transition-colors"
            />
          </div>

          {/* Interactive Category Selector with Secondary Content Bars */}
          <div className="md:col-span-4 relative">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all cursor-pointer",
                selectedCategory !== "all"
                  ? "bg-[#232836] border-[#2A2F3C] text-white shadow-sm"
                  : "bg-[#10131B] border-[#252A37] text-slate-200 hover:border-white/30 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <FolderTree className="h-4 w-4 text-white shrink-0" />
                <span className="text-[#8B93A5] font-normal">Danh mục:</span>
                <span className="font-bold text-white truncate">
                  {selectedCategory === "all"
                    ? "Tất cả học phần"
                    : selectedCategory === "none"
                    ? "Tài liệu chung (Không gắn học phần)"
                    : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-[#161A24] border border-[#252A37] text-[10px] tabular-nums text-[#E5E7EB]">
                  {selectedCategory === "all"
                    ? materials.length
                    : selectedCategory === "none"
                    ? materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length
                    : materials.filter((m) => m.category_id === selectedCategory || m.category_slug === selectedCategory).length}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-[#8B93A5] transition-transform duration-200", isCategoryMenuOpen && "rotate-180")} />
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
                    className="absolute left-0 right-0 top-full mt-2 z-40 rounded-3xl border border-[#252A37] bg-[#0A0C12] p-2 shadow-2xl space-y-1.5 min-w-[280px]"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-heading font-bold text-[#8B93A5] uppercase tracking-wider flex items-center justify-between border-b border-[#1B1F2A] pb-2">
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
                        "w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer group",
                        selectedCategory === "all"
                          ? "bg-white text-black border-transparent shadow-sm"
                          : "border-transparent bg-transparent hover:bg-[#161A24] text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                          selectedCategory === "all" ? "bg-black/10 text-black" : "bg-[#10131B] border border-[#252A37] text-white"
                        )}>
                          <Library className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={cn("text-xs font-bold transition", selectedCategory === "all" ? "text-black" : "text-white")}>
                            Tất cả học phần
                          </p>
                          <p className={cn("text-[10px]", selectedCategory === "all" ? "text-slate-600" : "text-[#9CA3AF]")}>
                            Toàn bộ tài liệu trong hệ thống
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] tabular-nums font-bold",
                          selectedCategory === "all" ? "bg-black/10 text-black" : "bg-[#10131B] border border-[#252A37] text-[#E5E7EB]"
                        )}>
                          {materials.length} bài
                        </span>
                        {selectedCategory === "all" && (
                          <CheckCircle2 className="h-4 w-4 text-black" />
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
                        "w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer group",
                        selectedCategory === "none"
                          ? "bg-white text-black border-transparent shadow-sm"
                          : "border-transparent bg-transparent hover:bg-[#161A24] text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                          selectedCategory === "none" ? "bg-black/10 text-black" : "bg-[#10131B] border border-[#252A37] text-white"
                        )}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-bold truncate transition", selectedCategory === "none" ? "text-black" : "text-white")}>
                            Tài liệu chung (Không gắn học phần)
                          </p>
                          <p className={cn("text-[10px] truncate", selectedCategory === "none" ? "text-slate-600" : "text-[#9CA3AF]")}>
                            Ghi chú & cẩm nang chung
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[11px] tabular-nums font-bold",
                          selectedCategory === "none" ? "bg-black/10 text-black" : "bg-[#10131B] border border-[#252A37] text-[#E5E7EB]"
                        )}>
                          {materials.filter((m) => m.category_id === "none" || m.category_slug === "none" || !m.category_id).length} bài
                        </span>
                        {selectedCategory === "none" && (
                          <CheckCircle2 className="h-4 w-4 text-black" />
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
                              "w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer group",
                              isSelected
                                ? "bg-white text-black border-transparent shadow-sm"
                                : "border-transparent bg-transparent hover:bg-[#161A24] text-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={cn(
                                "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                                isSelected ? "bg-black/10 text-black" : "bg-[#10131B] border border-[#252A37] text-white"
                              )}>
                                <Tag className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className={cn("text-xs font-bold truncate transition", isSelected ? "text-black" : "text-white")}>
                                  {c.name}
                                </p>
                                <p className={cn("text-[10px] truncate", isSelected ? "text-slate-600" : "text-[#9CA3AF]")}>
                                  Mã: {c.slug}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] tabular-nums font-bold",
                                isSelected ? "bg-black/10 text-black" : "bg-[#10131B] border border-[#252A37] text-[#E5E7EB]"
                              )}>
                                {count} bài
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-black" />
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
            <span className="text-[#8B93A5] font-heading font-semibold text-xs shrink-0 uppercase tracking-wider">Sắp xếp:</span>
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
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
            <span>Đang lọc theo:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#232836] text-white border border-[#2A2F3C] text-xs font-semibold">
              <Tag className="h-3 w-3 text-white" />
              {selectedCategory === "none"
                ? "Tài liệu chung (Không gắn học phần)"
                : categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "Chuyên đề"}
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="hover:text-white ml-1 p-0.5 cursor-pointer rounded-full hover:bg-white/10 transition"
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
              className="h-60 rounded-3xl border border-[#252A37] bg-[#161A24] animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#252A37] bg-[#161A24] p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-[#8B93A5] mb-3" />
          <h3 className="text-sm font-bold text-white">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-[#9CA3AF] mt-1 max-w-sm mx-auto">
            Thử thay đổi bộ lọc danh mục hoặc từ khóa tìm kiếm để khám phá các bài viết lý thuyết khác.
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
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
              className="flex flex-col justify-between rounded-3xl border border-[#252A37] bg-[#161A24] hover:border-white/30 p-5 group transition-all shadow-lg"
            >
              <div className="space-y-3">
                {/* Meta badges */}
                <div className="flex items-center justify-between gap-2">
                  {item.category_id === "none" || item.category_slug === "none" ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#10131B] text-[#9CA3AF] border border-[#252A37] flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-[#8B93A5]" />
                      {item.category_name || "Tài liệu chung (Không gắn học phần)"}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#10131B] text-slate-200 border border-[#252A37] flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-white" />
                      {item.category_name || "Chuyên đề"}
                    </span>
                  )}
                </div>

                {/* Article Title */}
                <Link href={`/knowledge/${item.id}`} className="block">
                  <h2 className="font-heading text-base font-bold text-white group-hover:text-slate-200 transition line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                </Link>

                {/* Summary */}
                <p className="text-xs text-[#9CA3AF] line-clamp-3 leading-relaxed">
                  {item.summary || "Tổng hợp kiến thức trọng tâm và các dạng bài thường gặp..."}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-[#252A37] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#9CA3AF] max-w-[140px] truncate">
                  <div className="h-6 w-6 rounded-lg bg-[#10131B] text-white flex items-center justify-center font-bold text-[10px] border border-[#252A37] shrink-0">
                    {(item.author || "B")[0]}
                  </div>
                  <span className="truncate">{item.author || "Ban Giảng huấn"}</span>
                </div>

                <Link
                  href={`/knowledge/${item.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-xs text-white hover:text-slate-200 group-hover:translate-x-0.5 transition duration-150"
                >
                  <span>Đọc bài</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
