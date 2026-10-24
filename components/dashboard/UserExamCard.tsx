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
    <div className="group flex flex-col justify-between h-full min-h-[190px] min-w-0 sm:min-w-[270px] rounded-[22px] bg-white dark:bg-[#1A1D26] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04),0_6px_18px_-2px_rgba(17,24,39,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] hover:border-black/[0.18] dark:hover:border-white/[0.18] hover:-translate-y-1 transition-all duration-300">
      {/* Upper Content: Title & Subtitle, followed by Question Count & Type */}
      <div className="space-y-4">
        {/* Title & Subtitle */}
        <div>
          <h3
            className="text-sm sm:text-base font-bold text-[#111827] dark:text-white tracking-tight line-clamp-2 leading-snug"
            title={exam.title}
          >
            <Link
              href={`/exam/${exam.id}`}
              className="hover:opacity-85 transition-opacity"
            >
              {renderHighlightedExamTitle(exam.title)}
            </Link>
          </h3>
          {cleanDescription && (
            <p
              className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-1 leading-relaxed mt-1"
              title={cleanDescription}
            >
              {cleanDescription}
            </p>
          )}
        </div>

        {/* Question Count & Type */}
        <div className="space-y-0.5 text-xs leading-snug">
          <p className="font-bold text-[#111827] dark:text-white text-sm tabular-nums">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-xs">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Bottom Row: Left Metadata (Time + Questions) & Right "Bắt đầu" Pill Button */}
      <div className="mt-5 flex items-center justify-between gap-3 select-none">
        {/* Left: Time and Question Count with Icons */}
        <div className="flex items-center gap-3 text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono tabular-nums shrink-0">
          <span className="inline-flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
            <span>{formatDuration(exam.duration_minutes)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0">
            <ClipboardList className="h-3.5 w-3.5 text-[#9CA3AF] shrink-0" />
            <span>{questionCount} câu</span>
          </span>
        </div>

        {/* Right: Docked Pill Button "Bắt đầu →" */}
        <Link
          href={`/exam/${exam.id}`}
          className="shrink-0 h-9 px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 cursor-pointer select-none bg-[#111827] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A0B0E] shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Bắt đầu</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
