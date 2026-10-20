"use client";

import { useState } from "react";
import Link from "next/link";
import { Exam } from "@/types/exam";
import { formatDuration, formatDate } from "@/lib/utils";
import {
  Clock,
  ClipboardList,
  Calendar,
  ArrowRight,
  FileText,
  Share2,
  CheckCircle2,
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
        <span className="text-white font-bold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span>{parenMatch[1]}</span>{" "}
        <span className="text-white font-bold">{parenMatch[2]}</span>
      </>
    );
  }

  return <span>{title}</span>;
}

export function UserExamCard({ exam, index = 0 }: UserExamCardProps) {
  const [copied, setCopied] = useState(false);

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

  // Pseudo-random yet deterministic participant indicator for Lunor avatar stack
  const participantCount = 180 + ((index * 37) % 150);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/exam/${exam.id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <div className="group flex flex-col justify-between h-full rounded-2xl bg-[#18191E] border border-white/[0.06] hover:border-zinc-700 p-4 transition-all duration-200 hover:-translate-y-0.5">
      {/* 1. Stylized Dark Folder/Document Preview Header (Lunor Recessed Well) */}
      <div>
        <div className="bg-[#111215] border border-white/[0.06] rounded-xl p-3 mb-3.5 relative overflow-hidden transition-colors group-hover:border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            {/* Top-Left: Document icon + Tag badge */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#18191E] border border-white/[0.08] text-zinc-300">
                <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                <span className="text-[11px] font-medium text-zinc-400 truncate">
                  {examTypeLabel}
                </span>
              </div>
            </div>

            {/* Top-Right: Lunor Avatar Stack & Test Takers */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex -space-x-1.5 overflow-hidden">
                <div className="inline-flex h-4 w-4 rounded-full bg-zinc-700 border border-[#111215] items-center justify-center text-[7px] font-bold text-zinc-200">
                  A
                </div>
                <div className="inline-flex h-4 w-4 rounded-full bg-zinc-600 border border-[#111215] items-center justify-center text-[7px] font-bold text-zinc-200">
                  H
                </div>
                <div className="inline-flex h-4 w-4 rounded-full bg-zinc-800 border border-[#111215] items-center justify-center text-[7px] font-bold text-zinc-200">
                  T
                </div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 font-medium">
                {participantCount}+
              </span>
            </div>
          </div>

          {/* Recessed well metadata row */}
          <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
              <span>{questionCount} câu hỏi</span>
            </span>
          </div>
        </div>

        {/* 2. Title & Description */}
        <h3
          className="text-sm font-semibold text-white tracking-tight line-clamp-2 leading-snug group-hover:text-zinc-100 transition-colors"
          title={exam.title}
        >
          {renderHighlightedExamTitle(exam.title)}
        </h3>

        <p
          className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed"
          title={cleanDescription || "Đề thi chuẩn hóa có chấm điểm tự động và tính giờ làm bài."}
        >
          {cleanDescription || "Đề thi chuẩn hóa có chấm điểm tự động và tính giờ làm bài."}
        </p>

        {/* Date Row */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
          <Calendar className="h-3 w-3 text-zinc-500" strokeWidth={1.5} />
          <span>{formatDate(exam.created_at)}</span>
        </div>
      </div>

      {/* 3. Bottom Utility Action Bar: Minimalist Pill Buttons */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleShare}
          title="Sao chép liên kết đề thi"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#111215] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.06] px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" strokeWidth={1.5} />
              <span className="text-emerald-400">Đã chép</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Chia sẻ</span>
            </>
          )}
        </button>

        <Link
          href={`/exam/${exam.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold px-4 py-1.5 text-xs transition-colors shadow-sm cursor-pointer"
        >
          <span>Làm bài</span>
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
