"use client";

import { Question } from "@/types/exam";
import { Check } from "lucide-react";

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
    <div className="bg-[#0C1017] border border-slate-800/90 rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <h3 className="text-xs font-bold text-slate-300">
          Mục lục câu hỏi
        </h3>
        <span className="text-xs font-semibold text-indigo-400">
          {answeredCount} / {total} ({progressPercent}%)
        </span>
      </div>

      {/* Progress Track */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
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
              className={`relative flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#090D16]"
                  : ""
              } ${
                isAnswered
                  ? "border border-indigo-500/40 bg-indigo-600 text-white hover:bg-indigo-500"
                  : "border border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700 hover:bg-slate-800"
              }`}
              title={`Câu ${index + 1}: ${isAnswered ? "Đã trả lời" : "Chưa trả lời"}`}
            >
              <span>{index + 1}</span>
              {isAnswered && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500 text-slate-950">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600" />
          <span>Đã trả lời</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-700 bg-slate-900" />
          <span>Chưa trả lời</span>
        </div>
      </div>
    </div>
  );
}
