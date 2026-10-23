"use client";

import { Question } from "@/types/exam";
import { Check, Flag } from "lucide-react";

interface QuestionNavProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  flaggedQuestions?: Record<string, boolean>;
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

export function QuestionNav({
  questions,
  userAnswers,
  flaggedQuestions = {},
  activeQuestionId,
  onSelectQuestion,
}: QuestionNavProps) {
  const total = questions.length;
  const answeredCount = questions.filter(
    (q) => (userAnswers[q.id] || "").trim().length > 0
  ).length;
  const flaggedCount = questions.filter((q) => Boolean(flaggedQuestions[q.id])).length;
  const progressPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
        <h3 className="text-xs font-bold text-white tracking-wide font-heading">
          Mục lục câu hỏi
        </h3>
        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 text-[10px] font-semibold font-mono tabular-nums">
              <Flag className="h-2.5 w-2.5 fill-current" />
              {flaggedCount} cờ
            </span>
          )}
          <span className="text-xs font-semibold font-mono tabular-nums text-indigo-400">
            {answeredCount}/{total} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Grid of Question Numbers */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {questions.map((question, index) => {
          const isAnswered = (userAnswers[question.id] || "").trim().length > 0;
          const isFlagged = Boolean(flaggedQuestions[question.id]);
          const isActive = activeQuestionId === question.id;

          let btnColor =
            "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-800";

          if (isFlagged) {
            btnColor =
              "border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.3)] hover:bg-amber-500/30";
          } else if (isAnswered) {
            btnColor =
              "border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.25)]";
          }

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold font-mono tabular-nums transition ${
                isActive
                  ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10"
                  : ""
              } border ${btnColor}`}
              title={`Câu ${index + 1}: ${
                isFlagged
                  ? "Đang đánh dấu xem lại"
                  : isAnswered
                  ? "Đã trả lời"
                  : "Chưa trả lời"
              }`}
            >
              <span>{index + 1}</span>

              {/* Flag Badge */}
              {isFlagged && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400 text-slate-950 shadow-sm">
                  <Flag className="h-2.5 w-2.5 fill-current" />
                </span>
              )}

              {/* Answered check (when not flagged or alongside) */}
              {!isFlagged && isAnswered && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500 text-slate-950">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
          <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-500/30 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
          <span className="text-amber-300 font-medium">Xem lại</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-700 bg-slate-900" />
          <span>Chưa làm</span>
        </div>
      </div>
    </div>
  );
}
