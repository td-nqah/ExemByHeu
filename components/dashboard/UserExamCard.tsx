"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Exam } from "@/types/exam";
import { formatDuration } from "@/lib/utils";
import { Clock, ClipboardList, ArrowRight } from "lucide-react";

interface UserExamCardProps {
  exam: Exam;
  index?: number;
}

/**
 * Calculates the exact scooped bottom-right cutout corner matching target Image 2:
 * - Card outer corners (top-left, top-right, bottom-left): radius r (24px)
 * - Right edge descends straight to (w, h - cutoutH)
 * - Corner 1: Turns left into shelf at (w, h - cutoutH) with slight convex radius rNotch (4px)
 * - Shelf runs horizontally left to (w - cutoutW + rInner, h - cutoutH)
 * - Corner 2: Inside concave arc (sweep=0, radius rInner=22px) sweeping down-left into vertical inner wall
 * - Vertical inner wall descends straight along x = (w - cutoutW) down to y = h
 * - Bottom edge turns left along y = h all the way to bottom-left corner
 */
function getCardPath(
  w: number,
  h: number,
  r = 24,
  cutoutW = 144,
  cutoutH = 58,
  rInner = 22,
  rNotch = 4
): string {
  if (w <= 0 || h <= 0) return "";
  const actualR = Math.min(r, w / 4, h / 4);
  const actualCutoutW = Math.min(cutoutW, w - actualR * 2);
  const actualCutoutH = Math.min(cutoutH, h - actualR * 2);
  const actualRInner = Math.min(rInner, actualCutoutW / 2, actualCutoutH / 2);
  const actualRNotch = Math.min(rNotch, 6);

  return [
    `M ${actualR} 0`,
    `L ${w - actualR} 0`,
    `A ${actualR} ${actualR} 0 0 1 ${w} ${actualR}`,
    `L ${w} ${h - actualCutoutH - actualRNotch}`,
    actualRNotch > 0
      ? `A ${actualRNotch} ${actualRNotch} 0 0 1 ${w - actualRNotch} ${h - actualCutoutH}`
      : `L ${w} ${h - actualCutoutH}`,
    `L ${w - actualCutoutW + actualRInner} ${h - actualCutoutH}`,
    `A ${actualRInner} ${actualRInner} 0 0 0 ${w - actualCutoutW} ${h - actualCutoutH + actualRInner}`,
    `L ${w - actualCutoutW} ${h}`,
    `L ${actualR} ${h}`,
    `A ${actualR} ${actualR} 0 0 1 0 ${h - actualR}`,
    `L 0 ${actualR}`,
    `A ${actualR} ${actualR} 0 0 1 ${actualR} 0`,
    `Z`,
  ].join(" ");
}

function renderHighlightedExamTitle(title: string) {
  if (title.includes(":")) {
    const colonIdx = title.indexOf(":");
    const prefix = title.substring(0, colonIdx + 1);
    const suffix = title.substring(colonIdx + 1);
    return (
      <>
        <span className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">{prefix}</span>{" "}
        <span className="text-[#111827] dark:text-white font-extrabold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span className="text-[#6B7280] dark:text-[#9CA3AF] font-medium">{parenMatch[1]}</span>{" "}
        <span className="text-[#111827] dark:text-white font-extrabold">{parenMatch[2]}</span>
      </>
    );
  }

  return <span className="text-[#111827] dark:text-white font-bold">{title}</span>;
}

export function UserExamCard({ exam }: UserExamCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number }>({
    width: 340,
    height: 195,
  });

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDims({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pathD = useMemo(
    () => getCardPath(dims.width, dims.height, 24, 144, 58, 22, 4),
    [dims.width, dims.height]
  );

  const questionCount = exam.question_count || exam.questions?.length || 0;
  const mcqCount =
    exam.questions?.filter((q) => q.type === "multiple_choice").length || 0;
  const essayCount =
    exam.questions?.filter((q) => q.type === "essay").length || 0;

  const examTypeLabel =
    mcqCount > 0 && essayCount > 0
      ? "Trắc nghiệm & Tự luận"
      : essayCount > 0 || exam.question_type === "essay"
      ? "Tự luận"
      : exam.question_type === "mixed"
      ? "Trắc nghiệm & Tự luận"
      : "Trắc nghiệm";

  const cleanDescription = (exam.description || "")
    .replace(/^[\s\r\n]*<!--meta:[\s\S]*?-->\n?/, "")
    .trim();

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col justify-between min-h-[195px] min-w-0 sm:min-w-[270px] p-5 pb-4 transition-transform duration-300 hover:-translate-y-1.5"
    >
      {/* Dynamic SVG Background Path with Scooped Bottom-Right Cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-visible filter drop-shadow-[0_2px_8px_rgba(17,24,39,0.04)] dark:drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-colors duration-200"
        viewBox={`0 0 ${dims.width} ${dims.height}`}
      >
        <path
          suppressHydrationWarning
          d={pathD}
          className="fill-white dark:fill-[#111318] stroke-black/[0.08] dark:stroke-white/[0.12] transition-colors duration-200"
          strokeWidth="1.2"
        />
      </svg>

      {/* Top Header & Metadata */}
      <div className="space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: High-contrast TEST badge (White pill with black text/dot in dark mode, Black pill in light mode) */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-white dark:bg-white dark:text-black px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 border border-black/80 dark:border-white shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black" />
            <span>TEST</span>
          </span>

          {/* Top-Right: Time + Questions count */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono tabular-nums shrink-0">
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-[#9CA3AF] shrink-0" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <ClipboardList className="h-3 w-3 text-[#9CA3AF] shrink-0" />
              <span>{questionCount} câu</span>
            </span>
          </div>
        </div>

        {/* Card Title with line-clamp-2 */}
        <h3
          className="text-sm font-bold text-[#111827] dark:text-white tracking-tight line-clamp-2 leading-snug"
          title={exam.title}
        >
          <Link
            href={`/exam/${exam.id}`}
            className="hover:opacity-80 transition-opacity"
          >
            {renderHighlightedExamTitle(exam.title)}
          </Link>
        </h3>

        {/* Exam Description between Title and Question Count */}
        {cleanDescription && (
          <p
            className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-2 leading-relaxed"
            title={cleanDescription}
          >
            {cleanDescription}
          </p>
        )}
      </div>

      {/* Bottom Section: Left Metadata & Right Docked Pill Button */}
      <div className="mt-4 flex items-end justify-between select-none">
        {/* Bottom Left: Question count and type */}
        <div className="space-y-0.5 text-xs leading-snug max-w-[calc(100%-146px)]">
          <p className="font-bold text-[#111827] dark:text-white tabular-nums truncate text-xs">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[11px] truncate">
            {examTypeLabel}
          </p>
        </div>

        {/* Bottom Right: Docked Pill Button floating flush in scooped cutout */}
        <Link
          href={`/exam/${exam.id}`}
          className="absolute right-0 bottom-0 h-12 w-[134px] rounded-full inline-flex items-center justify-center gap-2 text-xs font-bold transition-all duration-200 cursor-pointer select-none bg-[#111827] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A0B0E] shadow-[0_4px_12px_rgba(17,24,39,0.15)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Bắt đầu</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
