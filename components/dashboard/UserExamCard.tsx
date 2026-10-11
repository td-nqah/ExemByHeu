"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Exam } from "@/types/exam";
import { formatDuration, formatDate, cn } from "@/lib/utils";
import {
  Clock,
  HelpCircle,
  FileText,
  Target,
  TrendingUp,
  ChevronRight,
  Calendar,
  Play,
  ArrowRight,
} from "lucide-react";

interface UserExamCardProps {
  exam: Exam;
  index: number;
}

function Exam3DIllustration() {
  return (
    <div className="pointer-events-none absolute -bottom-5 -right-5 h-36 w-36 select-none opacity-25 transition-all duration-500 group-hover:opacity-50 group-hover:scale-105">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full rotate-6 transition-transform duration-700 group-hover:rotate-12"
      >
        <defs>
          <linearGradient id="sheetGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="ringGrad1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#C084FC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ringGrad2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Orbit Ring 1 */}
        <ellipse
          cx="100"
          cy="100"
          rx="82"
          ry="30"
          transform="rotate(-28 100 100)"
          stroke="url(#ringGrad1)"
          strokeWidth="1.5"
          strokeDasharray="5 3"
        />

        {/* Orbit Ring 2 */}
        <ellipse
          cx="100"
          cy="100"
          rx="68"
          ry="22"
          transform="rotate(32 100 100)"
          stroke="url(#ringGrad2)"
          strokeWidth="1.2"
        />

        {/* Floating 3D Exam Sheet */}
        <g transform="matrix(0.88 -0.45 0.45 0.88 22 45)">
          <rect
            x="40"
            y="20"
            width="75"
            height="95"
            rx="8"
            fill="url(#sheetGrad)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.5"
          />
          {/* Header Line */}
          <line
            x1="50"
            y1="34"
            x2="85"
            y2="34"
            stroke="#A5B4FC"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="102" cy="34" r="3" fill="#6366F1" />

          {/* Test Questions Check lines */}
          <line
            x1="50"
            y1="48"
            x2="105"
            y2="48"
            stroke="#E0E7FF"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeLinecap="round"
          />
          <circle cx="53" cy="60" r="2.5" fill="#34D399" />
          <line
            x1="62"
            y1="60"
            x2="100"
            y2="60"
            stroke="#E0E7FF"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          <circle cx="53" cy="72" r="2.5" fill="#818CF8" />
          <line
            x1="62"
            y1="72"
            x2="95"
            y2="72"
            stroke="#E0E7FF"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          <circle cx="53" cy="84" r="2.5" fill="#C084FC" />
          <line
            x1="62"
            y1="84"
            x2="88"
            y2="84"
            stroke="#E0E7FF"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          <line
            x1="50"
            y1="96"
            x2="80"
            y2="96"
            stroke="#818CF8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Sparkles / Stars ✦ */}
        <path
          d="M152 38 Q152 48 162 48 Q152 48 152 58 Q152 48 142 48 Q152 48 152 38Z"
          fill="#C7D2FE"
          opacity="0.9"
        />
        <path
          d="M44 128 Q44 135 51 135 Q44 135 44 142 Q44 135 37 135 Q44 135 44 128Z"
          fill="#DDD6FE"
          opacity="0.8"
        />
        <circle cx="158" cy="118" r="2" fill="#818CF8" opacity="0.8" />
        <circle cx="58" cy="42" r="1.5" fill="#A5B4FC" opacity="0.7" />
      </svg>
    </div>
  );
}

function renderHighlightedExamTitle(title: string) {
  if (title.includes(":")) {
    const colonIdx = title.indexOf(":");
    const prefix = title.substring(0, colonIdx + 1);
    const suffix = title.substring(colonIdx + 1);
    return (
      <>
        <span>{prefix}</span>{" "}
        <span className="text-indigo-400 font-bold">{suffix.trim()}</span>
      </>
    );
  }

  const parenMatch = title.match(/^(.*?)([\(\[][^\)\]]+[\)\]].*)$/);
  if (parenMatch) {
    return (
      <>
        <span>{parenMatch[1]}</span>{" "}
        <span className="text-indigo-400 font-bold">{parenMatch[2]}</span>
      </>
    );
  }

  return <span>{title}</span>;
}

export function UserExamCard({ exam, index }: UserExamCardProps) {
  const reduceMotion = useReducedMotion();

  const questionCount = exam.questions?.length || 0;
  const mcqCount =
    exam.questions?.filter((q) => q.type === "multiple_choice").length || 0;
  const essayCount =
    exam.questions?.filter((q) => q.type === "essay").length || 0;

  const recentAttempts = exam.recent_submissions || [];

  const examTypeLabel =
    mcqCount > 0 && essayCount > 0
      ? "Trắc nghiệm & Tự luận"
      : essayCount > 0
      ? "Tự luận"
      : "Trắc nghiệm";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300",
        "bg-slate-950/60 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)]",
        "hover:border-indigo-500/40 hover:shadow-[0_16px_48px_rgba(99,102,241,0.22)] hover:-translate-y-0.5"
      )}
    >
      {/* Subtle Ambient Glow Overlays (3D Depth) */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl transition-opacity duration-500 group-hover:bg-indigo-500/25" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl transition-opacity duration-500 group-hover:bg-violet-600/20" />

      {/* Decorative 3D Exam & Orbit SVG */}
      <Exam3DIllustration />

      {/* Card Content Top & Body */}
      <div className="relative z-10 space-y-4">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Top-Left: Badge ✦ Skill */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/20">
            <span className="text-[11px] text-indigo-400">✦</span>
            <span>Skill</span>
          </span>

          {/* Top-Right: Horizontal Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/50 px-2.5 py-0.5 text-xs font-normal text-slate-300 border border-white/5">
              <Clock className="h-3 w-3 text-indigo-400" />
              <span>{formatDuration(exam.duration_minutes)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/50 px-2.5 py-0.5 text-xs font-normal text-slate-300 border border-white/5">
              <HelpCircle className="h-3 w-3 text-indigo-400" />
              <span>{questionCount} câu hỏi</span>
            </span>
          </div>
        </div>

        {/* Small Upper Label */}
        <div className="pt-1">
          <span className="block text-[10px] font-semibold tracking-widest text-indigo-400/80 uppercase">
            LUYỆN TẬP KỸ NĂNG
          </span>

          {/* Main Title */}
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-white transition-colors duration-200 line-clamp-2 leading-snug">
            {renderHighlightedExamTitle(exam.title)}
          </h3>

          {/* Small Description */}
          <p className="mt-1.5 text-sm text-slate-400 leading-relaxed line-clamp-2">
            {exam.description ||
              "Bài thi thử trực tuyến đánh giá năng lực toàn diện theo khung chuẩn kiến thức."}
          </p>
        </div>

        {/* Info Icons in the Middle */}
        <div className="space-y-2 pt-1 border-t border-white/5">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium">
              {questionCount} câu hỏi / {examTypeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <Target className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium">Đánh giá năng lực / Toàn diện</span>
          </div>
        </div>

        {/* History Section: "3 lần gần nhất" */}
        <Link
          href={recentAttempts.length > 0 ? `/history/${recentAttempts[0].id}` : "/history"}
          className="group/history block rounded-xl bg-slate-950/40 p-3 border border-white/5 backdrop-blur-md transition-all duration-200 hover:bg-slate-950/70 hover:border-white/10"
          title="Nhấn để xem chi tiết lịch sử bài làm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white">3 lần gần nhất</p>
                {recentAttempts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 truncate">
                    Chưa có lượt làm bài nào
                  </p>
                ) : (
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {recentAttempts.map((attempt, aIdx) => {
                      const isPending = attempt.status === "pending_grading";
                      return (
                        <span
                          key={attempt.id}
                          className={cn(
                            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border",
                            isPending
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          )}
                        >
                          Lần {aIdx + 1}: {isPending ? "Đang chấm" : attempt.total_score}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover/history:translate-x-0.5 group-hover/history:text-white" />
          </div>
        </Link>
      </div>

      {/* Card Footer: Date & Pill Button */}
      <div className="relative z-10 mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
        {/* Bottom-Left: Date & Time */}
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatDate(exam.created_at)}</span>
        </span>

        {/* Bottom-Right: Main Action Pill Button "Vào làm bài ➔" */}
        <Link
          href={`/exam/${exam.id}`}
          className={cn(
            "group/btn inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-medium text-white transition-all duration-300",
            "bg-gradient-to-r from-indigo-600 to-violet-600",
            "shadow-lg shadow-indigo-600/30 hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98]"
          )}
        >
          {/* Circle icon with white background containing play triangle */}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm transition-transform duration-200 group-hover/btn:scale-110">
            <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
          </span>

          <span className="font-semibold tracking-wide">Vào làm bài</span>

          {/* Right Arrow */}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}
