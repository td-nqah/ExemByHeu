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
  const questionCount = exam.questions?.length || 0;
  const mcqCount =
    exam.questions?.filter((q) => q.type === "multiple_choice").length || 0;
  const essayCount =
    exam.questions?.filter((q) => q.type === "essay").length || 0;

  const examTypeLabel =
    mcqCount > 0 && essayCount > 0
      ? "Trắc nghiệm & Tự luận"
      : essayCount > 0
      ? "Tự luận"
      : "Trắc nghiệm";

  return (
    <div className="group flex flex-col justify-between h-full min-h-[150px] rounded-2xl bg-[#151b27] border border-white/[0.06] p-4 transition-all duration-200 hover:border-white/10 hover:bg-[#171e2c]">
      {/* Top Header & Metadata */}
      <div className="space-y-2">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Top-Left: Test badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#202738] px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span>Test</span>
          </span>

          {/* Top-Right: Time + Questions count */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{questionCount} câu hỏi</span>
            </span>
          </div>
        </div>

        {/* Card Title */}
        <h3
          className="text-sm font-bold text-white tracking-tight truncate leading-snug"
          title={exam.title}
        >
          {renderHighlightedExamTitle(exam.title)}
        </h3>

        {/* Directly below the title: Line 1: "40 câu hỏi", Line 2: "Trắc nghiệm" */}
        <div className="text-[11px] leading-snug select-none space-y-0.5">
          <p className="text-slate-300 font-medium truncate">
            {questionCount} câu hỏi
          </p>
          <p className="text-slate-400 truncate">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Uniform Bottom Edge: Calendar Date & Solid Purple CTA Button */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 truncate">
          <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
          <span className="truncate">{formatDate(exam.created_at)}</span>
        </span>

        <Link
          href={`/exam/${exam.id}`}
          className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-[#4f57ea] hover:bg-[#434ac9] active:bg-[#3d43b6] px-2.5 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
        >
          <span>Làm bài</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
