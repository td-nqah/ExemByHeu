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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2937]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f46e5]/10 border border-[#4f46e5]/30 text-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.15)]">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Tổng hợp kiến thức
            </h1>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              Hệ thống tài liệu ôn tập, tóm tắt lý thuyết trọng tâm và đề cương các chuyên đề
            </p>
          </div>
        </div>

        <div className="text-xs text-[#9ca3af]">
          Tổng số: <span className="font-bold text-white">{materials.length}</span> bài viết
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tài liệu, khái niệm, chuyên đề..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1f2937] bg-[#111827] text-xs text-[#e5e7eb] placeholder-[#9ca3af] focus:border-[#4f46e5] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-[#9ca3af] text-xs">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-[#1f2937] bg-[#111827] px-3 py-2 text-xs text-[#e5e7eb] focus:outline-none focus:border-[#4f46e5] cursor-pointer"
          >
            <option value="newest" className="bg-[#111827] text-white">Mới cập nhật nhất</option>
            <option value="reading_time" className="bg-[#111827] text-white">Thời gian đọc nhanh nhất</option>
          </select>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div
              key={idx}
              className="h-60 rounded-2xl border border-[#1f2937] bg-[#111827]/60 animate-pulse p-6"
            />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1f2937] bg-[#111827]/50 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-[#6b7280] mb-3" />
          <h3 className="text-sm font-semibold text-white">Không tìm thấy tài liệu phù hợp</h3>
          <p className="text-xs text-[#9ca3af] mt-1 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm để khám phá các bài viết lý thuyết khác.
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 rounded-xl bg-[#4f46e5]/20 text-indigo-300 border border-[#4f46e5]/30 text-xs font-bold hover:bg-[#4f46e5]/30 transition cursor-pointer"
            >
              Xóa tìm kiếm
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
              className="flex flex-col justify-between rounded-2xl border border-[#1f2937] bg-[#111827]/85 backdrop-blur-[12px] hover:border-[#3b82f6] hover:-translate-y-1 transition-all duration-300 p-5 group hover:shadow-xl hover:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.15)]"
            >
              <div className="space-y-3">
                {/* Meta badges: Emerald Teal tag for subject category */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#064e3b]/70 text-[#34d399] border border-[#064e3b] flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-[#34d399]" />
                    {item.category_name || "Chuyên đề"}
                  </span>
                  <span className="text-xs text-[#9ca3af] font-mono flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#9ca3af]" />
                    {item.reading_time || 5} phút đọc
                  </span>
                </div>

                {/* Article Title */}
                <Link href={`/knowledge/${item.id}`} className="block">
                  <h2 className="font-heading text-base font-bold text-white group-hover:text-blue-300 transition line-clamp-2 leading-snug">
                    {item.title}
                  </h2>
                </Link>

                {/* Summary */}
                <p className="text-xs text-[#9ca3af] line-clamp-3 leading-relaxed">
                  {item.summary || "Tổng hợp kiến thức trọng tâm và các dạng bài thường gặp..."}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-3.5 border-t border-[#1f2937] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#9ca3af] max-w-[140px] truncate">
                  <div className="h-6 w-6 rounded-lg bg-[#1f2937] text-white flex items-center justify-center font-bold text-[10px] border border-[#1f2937] shrink-0">
                    {(item.author || "B")[0]}
                  </div>
                  <span className="truncate">{item.author || "Ban Giảng huấn"}</span>
                </div>

                <Link
                  href={`/knowledge/${item.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-xs text-[#6366f1] group-hover:text-indigo-300 group-hover:translate-x-0.5 transition duration-150"
                >
                  <span>Đọc bài</span>
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
