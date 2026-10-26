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
    <div className="bg-[#161A24] border border-[#252A37] rounded-3xl p-5 shadow-xl">
      <div className="mb-3.5 flex items-center justify-between border-b border-[#252A37] pb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
          Mục lục câu hỏi
        </h3>
        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#232836] text-amber-300 border border-[#2A2F3C] px-2 py-0.5 text-[10px] font-mono font-bold">
              <Flag className="h-2.5 w-2.5 fill-current" />
              {flaggedCount} cờ
            </span>
          )}
          <span className="text-xs font-mono font-bold text-white">
            {answeredCount}/{total} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[#10131B] border border-[#252A37]">
        <div
          className="h-full bg-white transition-all duration-300"
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
            "border-[#252A37] bg-[#10131B] text-[#9CA3AF] hover:border-white/30 hover:text-white";

          if (isFlagged) {
            btnColor =
              "border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.25)] hover:bg-amber-500/30";
          } else if (isAnswered) {
            btnColor =
              "border-[#2A2F3C] bg-[#232836] text-white hover:border-white/30";
          }

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs font-mono font-bold transition ${
                isActive
                  ? "ring-2 ring-white ring-offset-2 ring-offset-[#05070D] scale-105 z-10"
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
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-amber-400/50 bg-amber-400 text-black shadow-sm">
                  <Flag className="h-2.5 w-2.5 fill-current" />
                </span>
              )}

              {/* Answered check (when not flagged) */}
              {!isFlagged && isAnswered && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/40 bg-white text-black">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#252A37] pt-3 text-[11px] text-[#8B93A5] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#232836] border border-[#2A2F3C]" />
          <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-500/30" />
          <span className="text-amber-300 font-medium">Xem lại</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-[#252A37] bg-[#10131B]" />
          <span>Chưa làm</span>
        </div>
      </div>
    </div>
  );
}
