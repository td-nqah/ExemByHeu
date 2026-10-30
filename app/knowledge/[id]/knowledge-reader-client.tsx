"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Share2,
  Check,
  List,
  Calendar,
  Tag,
  Printer,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudyMaterialById, getStudyMaterials } from "@/lib/store";
import { StudyMaterial } from "@/types/exam";

interface TocItem {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export function KnowledgeReaderClient({ materialId }: { materialId: string }) {
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [allMaterials, setAllMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Table of Contents
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  // Reading Progress (0 - 100%)
  const [readingProgress, setReadingProgress] = useState(0);

  // Share link feedback
  const [copied, setCopied] = useState(false);

  // Article container ref
  const articleContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [found, all] = await Promise.all([
          getStudyMaterialById(materialId),
          getStudyMaterials(),
        ]);
        setMaterial(found);
        setAllMaterials(all);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [materialId]);

  // Once material is loaded & DOM rendered, extract Headings for TOC and inject IDs
  useEffect(() => {
    if (!material || !articleContentRef.current) return;

    const headings = articleContentRef.current.querySelectorAll("h2, h3");
    const items: TocItem[] = [];

    headings.forEach((heading, idx) => {
      const text = heading.textContent || "";
      let id = heading.id;
      if (!id) {
        id = `section-${idx + 1}`;
        heading.id = id;
      }
      const level = heading.tagName.toLowerCase() === "h2" ? 2 : 3;
      items.push({ id, text, level });
    });

    setToc(items);
    if (items.length > 0) {
      setActiveSectionId(items[0].id);
    }
  }, [material]);

  // Scrollspy & Reading Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      // 1. Calculate reading progress
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
      }

      // 2. Active TOC heading
      if (toc.length === 0) return;
      const scrollPos = window.scrollY + 120;

      for (let i = toc.length - 1; i >= 0; i--) {
        const el = document.getElementById(toc[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSectionId(toc[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
      setActiveSectionId(id);
    }
  };

  const handleCopyShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-fluid-h p-6 max-w-2xl mx-auto flex flex-col items-center justify-center text-center">
        <BookOpen className="h-16 w-16 text-[#8B93A5] mb-4" />
        <h2 className="text-xl font-bold text-white">Không tìm thấy tài liệu</h2>
        <p className="text-xs text-[#9CA3AF] mt-2 max-w-md">
          Tài liệu này có thể đã bị xóa hoặc đường dẫn không chính xác.
        </p>
        <Link
          href="/knowledge"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-200 text-[#05070D] font-bold text-xs transition shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại Tài liệu ôn tập
        </Link>
      </div>
    );
  }

  // Related materials
  const relatedMaterials = allMaterials
    .filter((m) => m.id !== material.id)
    .slice(0, 3);

  const formattedDate = new Date(material.created_at).toLocaleDateString(
    "vi-VN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Top Fixed Reading Progress Bar (White Starry Accent) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10 pointer-events-none">
        <div
          className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#1B1F2A]">
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#9CA3AF] hover:text-white transition group"
          >
            <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1 text-white" />
            Tất cả tài liệu ôn tập
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#252A37] bg-[#10131B] text-xs font-semibold text-white hover:bg-[#161A24] transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã sao chép liên kết</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-[#8B93A5]" />
                  <span>Chia sẻ</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#252A37] bg-[#10131B] text-xs font-semibold text-white hover:bg-[#161A24] transition cursor-pointer"
              title="In hoặc Lưu PDF"
            >
              <Printer className="h-3.5 w-3.5 text-[#8B93A5]" />
              <span>In bài</span>
            </button>
          </div>
        </div>

        {/* Article Title Header */}
        <div className="py-8 sm:py-12 max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {material.category_id === "none" || material.category_slug === "none" ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#10131B] text-[#9CA3AF] border border-[#252A37] flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-[#8B93A5]" />
                {material.category_name || "Tài liệu chung (Không gắn học phần)"}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#10131B] text-slate-200 border border-[#252A37] flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-white" />
                {material.category_name || "Chuyên đề"}
              </span>
            )}

            <span className="text-xs text-[#9CA3AF] tabular-nums flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#8B93A5]" />
              {formattedDate}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {material.title}
          </h1>

          {material.summary && (
            <p className="text-sm sm:text-base text-slate-300 italic border-l-4 border-white pl-4 py-2 leading-relaxed bg-[#10131B] rounded-r-2xl border border-y-[#252A37] border-r-[#252A37]">
              {material.summary}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2 text-xs text-[#9CA3AF]">
            <div className="h-8 w-8 rounded-full bg-[#10131B] border border-[#252A37] text-white flex items-center justify-center font-bold text-xs shadow-md">
              {(material.author || "B")[0]}
            </div>
            <div>
              <p className="font-semibold text-white">{material.author || "Ban Giảng huấn"}</p>
              <p className="text-[11px] text-[#9CA3AF]">Giảng viên / Chuyên viên biên soạn</p>
            </div>
          </div>
        </div>

        {/* Main Content & Sticky TOC Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Article Main Body */}
          <article className="lg:col-span-8 min-w-0">
            <div
              ref={articleContentRef}
              className="magazine-article-content prose prose-invert max-w-none font-body text-slate-200 text-sm sm:text-base leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: material.content_html }}
            />

            {/* Related Materials / Next Reads */}
            {relatedMaterials.length > 0 && (
              <div className="mt-12 space-y-4">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-white" />
                  Bài viết liên quan cùng chuyên đề
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedMaterials.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/knowledge/${rel.id}`}
                      className="p-5 rounded-2xl border border-[#252A37] bg-[#161A24] hover:border-white/30 hover:bg-[#141824] transition block group hover:-translate-y-0.5 shadow-lg"
                    >
                      <span className="text-[10px] font-heading font-bold text-[#8B93A5] uppercase tracking-wider">
                        {rel.category_name || "Chuyên đề"}
                      </span>
                      <h4 className="font-heading text-xs sm:text-sm font-bold text-white group-hover:text-slate-200 transition mt-1 line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-2">
                        {rel.summary}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sticky Table of Contents Sidebar */}
          <aside className="lg:col-span-4 hidden lg:block sticky top-20 space-y-6">
            <div className="rounded-3xl border border-[#252A37] bg-[#161A24] p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#252A37]">
                <h3 className="text-xs font-heading font-bold text-[#8B93A5] uppercase tracking-wider flex items-center gap-2">
                  <List className="h-4 w-4 text-white" />
                  Mục lục bài viết (TOC)
                </h3>
                <span className="text-[11px] text-white tabular-nums font-bold">
                  {Math.round(readingProgress)}%
                </span>
              </div>

              {toc.length === 0 ? (
                <p className="text-xs text-[#8B93A5] italic py-4">
                  Đang đồng bộ mục lục...
                </p>
              ) : (
                <nav className="mt-3 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  {toc.map((item) => {
                    const isActive = activeSectionId === item.id;
                    return (
                      <button
                        type="button"
                        onClick={() => scrollToHeading(item.id)}
                        className={cn(
                          "w-full text-left rounded-xl py-1.5 transition-all text-xs block cursor-pointer",
                          item.level === 3 ? "pl-5 text-[11px]" : "pl-2.5 font-medium",
                          isActive
                            ? "bg-[#10131B] text-white font-bold border-l-2 border-white"
                            : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.03]"
                        )}
                      >
                        <span className="line-clamp-2">{item.text}</span>
                      </button>
                    );
                  })}
                </nav>
              )}

              <div className="mt-4 pt-3 border-t border-[#252A37] text-[11px] text-[#8B93A5] flex items-center justify-between">
                <span>Cuộn để theo dõi tiến độ</span>
                <span className="text-white font-semibold">Tự do ôn tập</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
