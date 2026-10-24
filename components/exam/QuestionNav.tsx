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
    <div className="bg-white border border-black/[0.06] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(20,20,40,0.06)]">
      <div className="mb-3 flex items-center justify-between border-b border-black/[0.06] pb-2.5">
        <h3 className="text-xs font-bold text-[#1F2128] tracking-wide font-heading">
          Mục lục câu hỏi
        </h3>
        <div className="flex items-center gap-2">
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F6EBC8] text-[#B8962E] border border-[#B8962E]/30 px-2 py-0.2 text-[10px] font-semibold font-mono tabular-nums">
              <Flag className="h-2.5 w-2.5 fill-current" />
              {flaggedCount} cờ
            </span>
          )}
          <span className="text-xs font-semibold font-mono tabular-nums text-[#D9482B]">
            {answeredCount}/{total} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] border border-black/[0.04]">
        <div
          className="h-full bg-[#D9482B] transition-all duration-300"
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
            "border-black/[0.06] bg-[#F6F6F8] text-[#7A7D88] hover:border-black/[0.12] hover:bg-black/[0.03] hover:text-[#1F2128]";

          if (isFlagged) {
            btnColor =
              "border-[#B8962E]/40 bg-[#F6EBC8] text-[#B8962E] font-bold shadow-xs hover:bg-[#F3E3B5]";
          } else if (isAnswered) {
            btnColor =
              "border-[#2E9E5B]/40 bg-[#DDF2E5] text-[#2E9E5B] font-bold shadow-xs hover:bg-[#CDECD7]";
          }

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold font-mono tabular-nums transition ${
                isActive
                  ? "ring-2 ring-[#D9482B] ring-offset-2 ring-offset-white scale-105 z-10 bg-white text-[#1F2128] font-bold shadow-xs"
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
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#B8962E]/40 bg-[#B8962E] text-white shadow-xs">
                  <Flag className="h-2.5 w-2.5 fill-current" />
                </span>
              )}

              {/* Answered check (when not flagged or alongside) */}
              {!isFlagged && isAnswered && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#2E9E5B]/40 bg-[#2E9E5B] text-white shadow-xs">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-3 text-[11px] text-[#7A7D88]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#2E9E5B]" />
          <span>Đã làm</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-500/30 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
          <span className="text-amber-300 font-medium">Xem lại</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-black/[0.1] bg-[#F6F6F8]" />
          <span>Chưa làm</span>
        </div>
      </div>
    </div>
  );
}
