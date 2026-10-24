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
        <span className="text-[#D9482B] font-bold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span>{parenMatch[1]}</span>{" "}
        <span className="text-[#D9482B] font-bold">{parenMatch[2]}</span>
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
    <div className="group flex flex-col justify-between h-full min-h-[165px] min-w-0 sm:min-w-[270px] rounded-2xl bg-white border border-black/[0.05] p-5 rounded-[24px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)] hover:border-black/[0.1] hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(20,20,40,0.09)] transition-all duration-300">
      {/* Top Header & Metadata */}
      <div className="space-y-2.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: Test badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBE3DC] px-2.5 py-0.5 text-[10px] font-semibold text-[#C4492F] border border-[#D9482B]/20 font-mono uppercase tracking-wider shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D9482B] animate-pulse" />
            <span>Test</span>
          </span>

          {/* Top-Right: Time + Questions count */}
          <div className="flex items-center gap-2 text-xs text-[#7A7D88] font-mono tabular-nums shrink-0">
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-[#7A7D88] shrink-0" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <ClipboardList className="h-3 w-3 text-[#7A7D88] shrink-0" />
              <span>{questionCount} câu</span>
            </span>
          </div>
        </div>

        {/* Card Title with line-clamp-2 */}
        <h3
          className="text-sm font-bold text-[#1F2128] tracking-tight line-clamp-2 leading-snug"
          title={exam.title}
        >
          {renderHighlightedExamTitle(exam.title)}
        </h3>

        {/* Exam Description between Title and Question Count */}
        {cleanDescription && (
          <p
            className="text-xs text-[#7A7D88] line-clamp-2 leading-relaxed"
            title={cleanDescription}
          >
            {cleanDescription}
          </p>
        )}

        {/* Directly below: Line 1: Question count, Line 2: Question Type */}
        <div className="text-xs leading-snug select-none space-y-0.5">
          <p className="text-[#1F2128] font-medium truncate tabular-nums">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#7A7D88] font-normal truncate">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Pinned Bottom Edge: Calendar Date & Solid Indigo CTA Button */}
      <div className="mt-auto pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-[#7A7D88] font-mono tabular-nums truncate">
          <Calendar className="h-3 w-3 text-[#7A7D88] shrink-0" />
          <span className="truncate">{formatDate(exam.created_at)}</span>
        </span>

        <Link
          href={`/exam/${exam.id}`}
          className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-[#D9482B] hover:bg-[#C43E23] active:bg-[#B3351C] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(217,72,43,0.3)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <span>Bắt đầu làm bài</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
