"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  BookOpen,
  Clock,
  Search,
  ArrowRight,
  Tag,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudyMaterials } from "@/lib/store";
import { StudyMaterial } from "@/types/exam";

export default function KnowledgeHubPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
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
      const allMats = await getStudyMaterials();
      setMaterials(allMats);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort
  const filteredMaterials = materials
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.category_name && item.category_name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "reading_time") {
        return (a.reading_time || 0) - (b.reading_time || 0);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="min-fluid-h p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Section: Tiêu đề chính chỉ để dòng chữ Tổng hợp kiến thức */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#21262d]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5852d6]/10 border border-[#5852d6]/30 text-indigo-400 shadow-[0_0_12px_rgba(88,82,214,0.15)]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Tổng hợp kiến thức
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống tài liệu ôn tập, tóm tắt lý thuyết trọng tâm và đề cương các chuyên đề
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Tổng số: <span className="font-bold text-white">{materials.length}</span> bài viết
        </div>
      </div>

      {/* Search & Sort Controls (bỏ phần filter tabs danh mục CNXH/CTMT theo yêu cầu) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu, khái niệm, chuyên đề..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#21262d] bg-[#161b22] text-xs text-white placeholder-slate-500 focus:border-[#5852d6] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-slate-400 text-xs">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-[#21262d] bg-[#161b22] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5852d6] cursor-pointer"
          >
            <option value="newest" className="bg-[#161b22] text-white">Mới cập nhật nhất</option>
            <option value="reading_time" className="bg-[#161b22] text-white">Thời gian đọc nhanh nhất</option>
          </select>
        </div>
      </div>

      {/* Materials Cards Grid (Obsidian Purple Theme) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="h-60 rounded-2xl border border-[#21262d] bg-[#161b22]/50 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#21262d] bg-[#161b22]/50 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-sm font-semibold text-white">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm để khám phá các bài viết lý thuyết khác.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-xl bg-[#5852d6]/20 text-indigo-300 border border-[#5852d6]/30 text-xs font-bold hover:bg-[#5852d6]/30 transition cursor-pointer"
            >
              Xóa tìm kiếm
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
              className="flex flex-col justify-between rounded-2xl border border-[#1f2937] bg-[#111827]/85 backdrop-blur-[12px] hover:border-[#3b82f6] hover:-translate-y-1 transition-all duration-300 p-5 sm:p-6 group hover:shadow-xl hover:shadow-[#5852d6]/10"
            >
              <div className="space-y-3.5">
                {/* Meta badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#5852d6]/15 text-indigo-300 border border-[#5852d6]/25 flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-indigo-400" />
                    {item.category_name || "Chuyên đề"}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    {item.reading_time || 5} phút đọc
                  </span>
                </div>

                {/* Article Title */}
                <Link href={`/knowledge/${item.id}`} className="block">
                  <h2 className="font-heading text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                </Link>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed">
                  {item.summary || "Tổng hợp kiến thức trọng tâm và các dạng bài thường gặp..."}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-[#21262d] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <div className="h-6 w-6 rounded-full bg-[#5852d6]/20 text-indigo-300 flex items-center justify-center font-bold text-[10px] border border-[#5852d6]/30">
                    {(item.author || "B")[0]}
                  </div>
                  <span className="truncate max-w-[130px]">{item.author || "Ban Giảng huấn"}</span>
                </div>

                <Link
                  href={`/knowledge/${item.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition duration-150"
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
