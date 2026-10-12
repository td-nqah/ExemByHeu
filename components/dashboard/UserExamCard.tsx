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
        <span className="text-[#818cf8] font-bold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span>{parenMatch[1]}</span>{" "}
        <span className="text-[#818cf8] font-bold">{parenMatch[2]}</span>
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
    <div className="group flex flex-col justify-between h-full min-h-[150px] rounded-xl bg-[#161b22] border border-[#21262d] p-4 transition-colors hover:border-[#30363d] hover:bg-[#1c2128]">
      {/* Top Header & Metadata */}
      <div className="space-y-2">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: Test badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#21262d] px-2 py-0.5 text-[10px] font-medium text-[#8b949e] border border-[#30363d]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5852d6]" />
            <span>Test</span>
          </span>

          {/* Top-Right: Time + Questions count */}
          <div className="flex items-center gap-2 text-xs text-[#8b949e] tnum tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#8b949e] shrink-0" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3 w-3 text-[#8b949e] shrink-0" />
              <span>{questionCount} câu hỏi</span>
            </span>
          </div>
        </div>

        {/* Card Title */}
        <h3
          className="text-sm font-semibold text-white tracking-tight truncate leading-snug"
          title={exam.title}
        >
          {renderHighlightedExamTitle(exam.title)}
        </h3>

        {/* Directly below the title: Line 1: "40 câu hỏi", Line 2: "Trắc nghiệm" */}
        <div className="text-xs leading-snug select-none space-y-0.5">
          <p className="text-[#e6edf3] font-medium truncate tnum tabular-nums">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#8b949e] font-normal truncate">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Uniform Bottom Edge: Calendar Date & Solid Purple CTA Button */}
      <div className="mt-3 pt-2.5 border-t border-[#21262d] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-[#8b949e] tnum tabular-nums truncate">
          <Calendar className="h-3 w-3 text-[#8b949e] shrink-0" />
          <span className="truncate">{formatDate(exam.created_at)}</span>
        </span>

        <Link
          href={`/exam/${exam.id}`}
          className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-[#5852d6] hover:bg-[#4b45bd] active:bg-[#433ea8] px-3 py-1.5 text-xs font-semibold text-white transition-colors"
        >
          <span>Làm bài</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
