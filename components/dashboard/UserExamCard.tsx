"use client";

import Link from "next/link";
import { Exam } from "@/types/exam";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  Clock,
  ClipboardList,
  ChevronRight,
  Play,
  Calendar,
} from "lucide-react";

interface UserExamCardProps {
  exam: Exam;
  index: number;
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

  const recentAttempts = exam.recent_submissions || [];
  const latestAttempt = recentAttempts.length > 0 ? recentAttempts[0] : null;

  const examTypeLabel =
    mcqCount > 0 && essayCount > 0
      ? "Trắc nghiệm & Tự luận"
      : essayCount > 0
      ? "Tự luận"
      : "Trắc nghiệm";

  return (
    <div className="group flex flex-col justify-between rounded-2xl bg-[#151b27] border border-white/[0.06] p-4 sm:p-5 transition-all duration-200 hover:border-white/10 hover:bg-[#171e2c]">
      {/* Upper Content */}
      <div className="space-y-3.5">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Skill badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#202738] px-2.5 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span>Skill</span>
          </span>

          {/* Duration & Questions count */}
          <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3 w-3 text-slate-400" />
              <span>{questionCount} câu hỏi</span>
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight line-clamp-1 leading-snug">
          {renderHighlightedExamTitle(exam.title)}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {exam.description ||
            "Bài thi thử trực tuyến đánh giá năng lực toàn diện theo khung chuẩn kiến thức."}
        </p>

        {/* Info Rows */}
        <div className="space-y-1 pt-1 text-slate-300">
          <p className="text-xs font-medium">
            {questionCount} câu hỏi • {examTypeLabel}
          </p>
          <p className="text-[11px] text-slate-400">
            Đánh giá năng lực • Toàn diện
          </p>
        </div>

        {/* History Row */}
        <Link
          href={latestAttempt ? `/history/${latestAttempt.id}` : "/history"}
          className="flex items-center justify-between rounded-xl bg-[#1a2130] px-3 py-2 text-[11px] text-slate-400 transition-colors hover:bg-[#20293d] hover:text-slate-200"
        >
          <span className="truncate">
            {latestAttempt
              ? latestAttempt.status === "pending_grading"
                ? "Lịch sử: Đang chấm điểm"
                : `Lịch sử: ${latestAttempt.total_score} điểm`
              : "Lịch sử: Chưa có lượt làm bài nào"}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </Link>
      </div>

      {/* Card Footer: Creation Date & Action Button */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{formatDate(exam.created_at)}</span>
        </span>

        <Link
          href={`/exam/${exam.id}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#4f57ea] hover:bg-[#434ac9] active:bg-[#3d43b6] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm"
        >
          <Play className="h-2.5 w-2.5 fill-current" />
          <span>Vào làm bài →</span>
        </Link>
      </div>
    </div>
  );
}
