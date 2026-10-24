"use client";

import Link from "next/link";
import { Exam } from "@/types/exam";
import { formatDuration } from "@/lib/utils";
import { Clock, ClipboardList, ArrowRight } from "lucide-react";

interface UserExamCardProps {
  exam: Exam;
  index?: number;
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
    <div className="group flex flex-col justify-between h-full min-h-[180px] min-w-0 sm:min-w-[270px] rounded-[20px] bg-white dark:bg-[#121318] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04),0_6px_18px_-2px_rgba(17,24,39,0.05)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:border-black/[0.16] dark:hover:border-white/[0.18] hover:-translate-y-1 transition-all duration-300">
      {/* Top Header & Metadata */}
      <div className="space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: High-contrast TEST badge */}
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

      {/* Bottom Section: Left Metadata & Right "Bắt đầu" Button nested INSIDE the card */}
      <div className="mt-4 pt-2 flex items-center justify-between gap-3 select-none">
        {/* Bottom Left: Question count and type */}
        <div className="space-y-0.5 text-xs leading-snug min-w-0">
          <p className="font-bold text-[#111827] dark:text-white tabular-nums truncate text-xs">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[11px] truncate">
            {examTypeLabel}
          </p>
        </div>

        {/* Bottom Right: Clean docked pill button INSIDE the card */}
        <Link
          href={`/exam/${exam.id}`}
          className="shrink-0 h-10 px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer select-none bg-[#111827] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A0B0E] shadow-xs hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Bắt đầu</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
