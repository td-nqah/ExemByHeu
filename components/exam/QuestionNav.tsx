"use client";

import { Question } from "@/types/exam";
import { Check, HelpCircle } from "lucide-react";

interface QuestionNavProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

export function QuestionNav({
  questions,
  userAnswers,
  activeQuestionId,
  onSelectQuestion,
}: QuestionNavProps) {
  const total = questions.length;
  const answeredCount = questions.filter(
    (q) => (userAnswers[q.id] || "").trim().length > 0
  ).length;
  const progressPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Mục lục câu hỏi
        </h3>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {answeredCount} / {total} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Track */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Grid of Question Numbers */}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {questions.map((question, index) => {
          const isAnswered = (userAnswers[question.id] || "").trim().length > 0;
          const isActive = activeQuestionId === question.id;

          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={`relative flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition ${
                isActive
                  ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900"
                  : ""
              } ${
                isAnswered
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
              title={`Câu ${index + 1}: ${isAnswered ? "Đã trả lời" : "Chưa trả lời"}`}
            >
              <span>{index + 1}</span>
              {isAnswered && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-emerald-700 shadow-xs dark:bg-zinc-900 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
          <span>Đã trả lời</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800" />
          <span>Chưa trả lời</span>
        </div>
      </div>
    </div>
  );
}
