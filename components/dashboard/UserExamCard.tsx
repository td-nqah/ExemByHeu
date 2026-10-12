"use client";

import Link from "next/link";
import { Exam } from "@/types/exam";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  Clock,
  ClipboardList,
  Calendar,
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
        <span className="text-[#38bdf8] font-bold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span>{parenMatch[1]}</span>{" "}
        <span className="text-[#38bdf8] font-bold">{parenMatch[2]}</span>
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

  return (
    <div className="group flex flex-col justify-between h-full min-h-[165px] min-w-0 sm:min-w-[270px] rounded-2xl bg-[#111827]/85 backdrop-blur-[12px] border border-[#1f2937] p-4 sm:p-4.5 transition-all duration-300 hover:border-[#3b82f6] hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.15)]">
      {/* Top Header & Metadata */}
      <div className="space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: Test badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4f46e5]/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-[#4f46e5]/30 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1] animate-pulse" />
            <span>Test</span>
          </span>

          {/* Top-Right: Time + Questions count */}
          <div className="flex items-center gap-2 text-xs text-[#9ca3af] font-mono tabular-nums shrink-0">
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-[#9ca3af] shrink-0" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <ClipboardList className="h-3 w-3 text-[#9ca3af] shrink-0" />
              <span>{questionCount} câu</span>
            </span>
          </div>
        </div>

        {/* Card Title with line-clamp-2 and consistent height */}
        <h3
          className="text-sm font-bold text-white tracking-tight line-clamp-2 leading-snug min-h-[2.5rem]"
          title={exam.title}
        >
          {renderHighlightedExamTitle(exam.title)}
        </h3>

        {/* Directly below the title: Line 1: Question count, Line 2: Question Type */}
        <div className="text-xs leading-snug select-none space-y-0.5">
          <p className="text-[#e5e7eb] font-medium truncate tabular-nums">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#9ca3af] font-normal truncate">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Pinned Bottom Edge: Calendar Date & Solid Indigo CTA Button */}
      <div className="mt-auto pt-3 border-t border-[#1f2937] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-[#9ca3af] font-mono tabular-nums truncate">
          <Calendar className="h-3 w-3 text-[#9ca3af] shrink-0" />
          <span className="truncate">{formatDate(exam.created_at)}</span>
        </span>

        <Link
          href={`/exam/${exam.id}`}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-[8px] bg-[#4f46e5] hover:bg-[#6366f1] active:bg-[#4338ca] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all duration-200 hover:shadow-indigo-500/50 hover:translate-x-0.5 cursor-pointer"
        >
          <span>Làm bài</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
