"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  BookOpen,
  Clock,
  Search,
  Sparkles,
  ArrowRight,
  Bookmark,
  Layers,
  GraduationCap,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  BookMarked,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudyMaterials, getCategories } from "@/lib/store";
import { StudyMaterial, Category } from "@/types/exam";

export default function KnowledgeHubPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "reading_time">("newest");

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("materials_updated", handleUpdate);
    return () => window.removeEventListener("materials_updated", handleUpdate);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCats, allMats] = await Promise.all([
        getCategories(false),
        getStudyMaterials(),
      ]);
      setCategories(allCats);
      setMaterials(allMats);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort
  const filteredMaterials = materials
    .filter((item) => {
      const matchCat =
        activeCategory === "all" ||
        item.category_id === activeCategory ||
        item.category_slug === activeCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    })
    .sort((a, b) => {
      if (sortBy === "reading_time") {
        return (a.reading_time || 0) - (b.reading_time || 0);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const featuredArticle = materials[0];

  return (
    <div className="min-fluid-h p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Magazine Masthead & Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#161c28] via-[#141829] to-[#0d101a] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            KNOWLEDGE HUB // TỔNG HỢP KIẾN THỨC
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Tạp Chí Ôn Tập & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-cyan-200">
              Tổng Hợp Lý Thuyết Trọng Tâm
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Tuyển tập các chuyên đề lý thuyết được biên tập trực quan theo phong cách Tạp chí công nghệ.
            Tích hợp bảng so sánh, mục lục neo thông minh và các khung ghi chú cốt lõi giúp bạn ghi nhớ nhanh, ôn thi hiệu quả.
          </p>
        </div>

        {/* Featured Article Card (if available) */}
        {featuredArticle && !searchQuery && activeCategory === "all" && (
          <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
              Chuyên đề nổi bật hôm nay
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-[#1a2032]/80 p-5 sm:p-6 backdrop-blur-md hover:border-cyan-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group">
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {featuredArticle.category_name || "Chuyên đề"}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    {featuredArticle.reading_time || 5} phút đọc
                  </span>
                </div>

                <Link href={`/knowledge/${featuredArticle.id}`}>
                  <h3 className="font-heading text-base sm:text-xl font-bold text-white group-hover:text-cyan-300 transition leading-snug">
                    {featuredArticle.title}
                  </h3>
                </Link>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {featuredArticle.summary}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href={`/knowledge/${featuredArticle.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 group-hover:translate-x-1 duration-200"
                >
                  Đọc ngay
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter, Search & Category Navigation */}
      <div className="space-y-4">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2",
              activeCategory === "all"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-[#161c28] text-slate-400 border border-white/5 hover:text-white hover:bg-[#1e2538]"
            )}
          >
            <BookMarked className="h-3.5 w-3.5" />
            Tất cả môn học ({materials.length})
          </button>
          {categories.map((c) => {
            const count = materials.filter(
              (m) => m.category_id === c.id || m.category_slug === c.slug
            ).length;
            const isSelected = activeCategory === c.id || activeCategory === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2",
                  isSelected
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-[#161c28] text-slate-400 border border-white/5 hover:text-white hover:bg-[#1e2538]"
                )}
              >
                <Tag className="h-3.5 w-3.5" />
                {c.name}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isSelected ? "bg-slate-900/40 text-slate-950" : "bg-white/10 text-slate-400"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, khái niệm, chuyên đề..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-[#161c28] text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 text-xs">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-[#161c28] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
            >
              <option value="newest">Mới cập nhật nhất</option>
              <option value="reading_time">Thời gian đọc nhanh nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tech Magazine Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl border border-white/5 bg-[#161c28]/50 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#141829]/50 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">Không tìm thấy bài viết phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục môn học khác để xem tài liệu.
          </p>
          {(searchQuery || activeCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#161c28]/90 hover:border-cyan-500/40 transition-all p-5 sm:p-6 group hover:shadow-xl hover:shadow-cyan-500/5 backdrop-blur-sm"
            >
              <div className="space-y-3.5">
                {/* Meta badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    {item.category_name || "Chuyên đề"}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-cyan-400/80" />
                    {item.reading_time || 5} phút đọc
                  </span>
                </div>

                {/* Article Title */}
                <Link href={`/knowledge/${item.id}`} className="block">
                  <h2 className="font-heading text-base font-bold text-white group-hover:text-cyan-300 transition line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                </Link>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                  {item.summary || "Tổng hợp kiến thức trọng tâm và các dạng bài thường gặp..."}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] border border-indigo-500/30">
                    {(item.author || "B")[0]}
                  </div>
                  <span className="truncate max-w-[120px]">{item.author || "Ban Giảng huấn"}</span>
                </div>

                <Link
                  href={`/knowledge/${item.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition duration-150"
                >
                  Đọc bài
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
