"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Exam, Submission } from "@/types/exam";
import { formatDuration } from "@/lib/utils";
import { Clock, ClipboardList, ArrowRight } from "lucide-react";

interface UserExamCardProps {
  exam: Exam;
  submission?: Submission | null;
  index?: number;
}

function renderHighlightedExamTitle(title: string) {
  if (title.includes(":")) {
    const colonIdx = title.indexOf(":");
    const prefix = title.substring(0, colonIdx + 1);
    const suffix = title.substring(colonIdx + 1).trim();

    const deMatch = suffix.match(/^(.*?)((?:Đề|ĐỀ|đề)\s*\d+)(.*)$/);
    if (deMatch) {
      const [, before, deText, after] = deMatch;
      return (
        <>
          <span className="text-white font-bold">{prefix}</span>{" "}
          {before && <span className="text-white font-extrabold">{before}</span>}
          <span className="text-[#818cf8] font-extrabold">{deText}</span>
          {after && <span className="text-white font-extrabold">{after}</span>}
        </>
      );
    }

    return (
      <>
        <span className="text-white font-bold">{prefix}</span>{" "}
        <span className="text-white font-extrabold">{suffix}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    const prefix = parenMatch[1];
    const suffix = parenMatch[2];
    const deMatch = suffix.match(/^(.*?)((?:Đề|ĐỀ|đề)\s*\d+)(.*)$/);
    if (deMatch) {
      const [, before, deText, after] = deMatch;
      return (
        <>
          <span className="text-white font-bold">{prefix}</span>{" "}
          {before && <span className="text-white font-extrabold">{before}</span>}
          <span className="text-[#818cf8] font-extrabold">{deText}</span>
          {after && <span className="text-white font-extrabold">{after}</span>}
        </>
      );
    }
    return (
      <>
        <span className="text-white font-bold">{prefix}</span>{" "}
        <span className="text-white font-extrabold">{suffix}</span>
      </>
    );
  }

  const deMatch = title.match(/^(.*?)((?:Đề|ĐỀ|đề)\s*\d+)(.*)$/);
  if (deMatch) {
    const [, before, deText, after] = deMatch;
    return (
      <>
        {before && <span className="text-white font-extrabold">{before}</span>}
        <span className="text-[#818cf8] font-extrabold">{deText}</span>
        {after && <span className="text-white font-extrabold">{after}</span>}
      </>
    );
  }

  return <span className="text-white font-bold">{title}</span>;
}

export function UserExamCard({ exam, submission }: UserExamCardProps) {
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

  // Find most recent submission: either passed directly or from exam.recent_submissions
  const lastSub =
    submission !== undefined
      ? submission
      : exam.recent_submissions && exam.recent_submissions.length > 0
      ? (exam.recent_submissions[0] as Submission)
      : null;

  const isCompleted = Boolean(lastSub);

  // Score achieved in most recent attempt
  const scoreDisplay = useMemo(() => {
    if (!lastSub) return 0;
    const raw = Number(lastSub.total_score ?? lastSub.mcq_score) || 0;
    const rounded = Math.round(raw * 100) / 100;
    return Number(rounded.toFixed(2));
  }, [lastSub]);

  // Max score configured for the exam
  const maxScoreDisplay = useMemo(() => {
    if (exam.questions && exam.questions.length > 0) {
      const sum = exam.questions.reduce(
        (acc, q) => acc + (Number(q.max_score) || 0),
        0
      );
      if (sum > 0) return Number((Math.round(sum * 100) / 100).toFixed(2));
    }
    const subQuestions = (lastSub as any)?.exam?.questions;
    if (subQuestions && subQuestions.length > 0) {
      const sum = subQuestions.reduce(
        (acc: number, q: any) => acc + (Number(q.max_score) || 0),
        0
      );
      if (sum > 0) return Number((Math.round(sum * 100) / 100).toFixed(2));
    }
    if (scoreDisplay > 10) return 100;
    return 10;
  }, [exam.questions, lastSub, scoreDisplay]);

  const buttonText = isCompleted ? "Làm lại" : "Bắt đầu";

  return (
    <div className="group flex flex-col justify-between h-full min-h-[195px] min-w-0 sm:min-w-[270px] rounded-[22px] obsidian-card-interactive p-5">
      {/* Upper Content: Header (Title + Status Badge), Subtitle, Question Count & Type */}
      <div className="space-y-4">
        {/* Top Header Row: Title on Left, Status Badge on Right */}
        <div>
          <div className="flex items-start justify-between gap-2.5">
            <h3
              className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-2 leading-snug flex-1 min-w-0"
              title={exam.title}
            >
              <Link
                href={`/exam/${exam.id}`}
                className="hover:text-indigo-300 transition-colors"
              >
                {renderHighlightedExamTitle(exam.title)}
              </Link>
            </h3>

            {/* Status Badge: Chưa làm vs Đã làm · score/max */}
            {isCompleted ? (
              <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 select-none shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span>
                  Đã làm · {scoreDisplay}/{maxScoreDisplay}
                </span>
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-indigo-950/50 text-indigo-300 border border-indigo-500/25 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span>Chưa làm</span>
              </span>
            )}
          </div>

          {cleanDescription && (
            <p
              className="text-xs text-[#9ca3af] line-clamp-1 leading-relaxed mt-1"
              title={cleanDescription}
            >
              {cleanDescription}
            </p>
          )}
        </div>

        {/* Question Count & Type */}
        <div className="space-y-0.5 text-xs leading-snug">
          <p className="font-bold text-white text-sm tabular-nums">
            {questionCount} câu hỏi
          </p>
          <p className="text-[#9ca3af] text-xs">
            {examTypeLabel}
          </p>
        </div>
      </div>

      {/* Bottom Row: Left Metadata (Time + Questions) & Right Pill Button */}
      <div className="mt-5 flex items-center justify-between gap-3 select-none">
        {/* Left: Time and Question Count with Icons */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium shrink-0">
          <span className="inline-flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-300">{formatDuration(exam.duration_minutes)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0">
            <ClipboardList className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-300"><strong className="text-white font-semibold font-heading">{questionCount}</strong> câu</span>
          </span>
        </div>

        {/* Right: Docked Pill Button "Bắt đầu →" or "Làm lại →" */}
        <Link
          href={`/exam/${exam.id}`}
          className="shrink-0 h-9 px-4 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer select-none bg-[#4f46e5] hover:bg-[#6366f1] text-white shadow-md shadow-[#4f46e5]/25 hover:shadow-[#4f46e5]/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>{buttonText}</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
