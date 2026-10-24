"use client";

import Link from "next/link";
import { Exam } from "@/types/exam";
import { formatDuration } from "@/lib/utils";
import {
  Clock,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

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
        <span>{prefix}</span>{" "}
        <span className="text-[#111827] font-bold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span>{parenMatch[1]}</span>{" "}
        <span className="text-[#111827] font-bold">{parenMatch[2]}</span>
      </>
    );
  }

  return <span>{title}</span>;
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
    <div className="group flex flex-col justify-between h-full min-h-[165px] min-w-0 sm:min-w-[270px] rounded-[20px] bg-white dark:bg-[#121318] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_6px_18px_-2px_rgba(17,24,39,0.06),inset_0_1px_0_#FFFFFF] dark:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_8px_24px_-2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-black/[0.15] dark:hover:border-white/[0.18] hover:-translate-y-1.5 transition-all duration-300">
      {/* Top Header & Metadata */}
      <div className="space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: Test badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] text-white dark:bg-white dark:text-[#0A0B0E] px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 shadow-xs border border-black/80 dark:border-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-[#0A0B0E]" />
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
          {renderHighlightedExamTitle(exam.title)}
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

        {/* Directly below: Line 1: Question count, Line 2: Question Type */}
        <div className="text-xs leading-snug select-none space-y-0.5">
          <p className="text-[#111827] dark:text-white font-medium truncate tabular-nums">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#9CA3AF] font-normal truncate">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Pinned Bottom Edge: Bắt đầu làm bài CTA Button */}
      <div className="mt-4 pt-0 flex items-center">
        <Link
          href={`/exam/${exam.id}`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#111827] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A0B0E] py-2.5 px-4 text-xs font-bold cursor-pointer shadow-xs hover:-translate-y-0.5 active:translate-y-0 transition-all active:scale-[0.99]"
        >
          <span>Bắt đầu làm bài</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2] text-white dark:text-[#0A0B0E]" />
        </Link>
      </div>
    </div>
  );
}
