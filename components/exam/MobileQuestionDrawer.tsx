"use client";

import { useState, useEffect } from "react";
import { Question } from "@/types/exam";
import {
  Menu,
  X,
  Flag,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileQuestionDrawerProps {
  questions: Question[];
  userAnswers: Record<string, string>;
  flaggedQuestions?: Record<string, boolean>;
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

export function MobileQuestionDrawer({
  questions,
  userAnswers,
  flaggedQuestions = {},
  activeQuestionId,
  onSelectQuestion,
}: MobileQuestionDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const total = questions.length;
  const answeredCount = questions.filter(
    (q) => (userAnswers[q.id] || "").trim().length > 0
  ).length;
  const flaggedCount = questions.filter((q) => Boolean(flaggedQuestions[q.id])).length;
  const progressPercent = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  // Lock body scroll when mobile drawer is open to prevent background scrolling on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelect = (questionId: string) => {
    onSelectQuestion(questionId);
    setIsOpen(false);
  };

  return (
    <>
      {/* 1. Floating Menu Button (FAB) - Visible ONLY on Mobile (< 768px) */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#111827] text-white border border-black/[0.08] shadow-[0_4px_20px_rgba(217,72,43,0.4)] transition-all duration-200 active:scale-90 hover:scale-105"
          aria-label="Mở danh sách câu hỏi"
          title="Danh sách câu hỏi"
        >
          <Menu className="h-6 w-6 stroke-[2.5]" strokeLinecap="round" />

          {/* Progress Badge */}
          <span className="absolute -top-1.5 -right-1.5 flex min-w-[24px] h-[22px] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-extrabold font-mono tabular-nums text-[#111827] border border-black/[0.08] shadow-xs">
            {answeredCount}/{total}
          </span>

          {/* Small Flag indicator if any flagged */}
          {flaggedCount > 0 && (
            <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#B8962E] text-white border border-white shadow-xs">
              <Flag className="h-2.5 w-2.5 fill-current" />
            </span>
          )}
        </button>
      </div>

      {/* 2. Backdrop Blur Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* 3. Slide-over Bottom Sheet Drawer */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[28px] border-t border-black/[0.08] bg-white/98 backdrop-blur-2xl shadow-[0_-12px_45px_rgba(0,0,0,0.15)] text-[#111827] transition-transform duration-300 ease-out md:hidden",
          isOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
      >
        {/* Drag Pill indicator */}
        <div className="flex w-full items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-black/[0.15]" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#111827] tracking-tight font-heading">
                Danh sách câu hỏi
              </h2>
              {flaggedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold">
                  <Flag className="h-2.5 w-2.5 fill-current" />
                  <span>{flaggedCount} cờ</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Đã làm <span className="font-semibold font-mono tabular-nums text-[#111827]">{answeredCount}/{total} câu</span> ({progressPercent}%)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F6F6F8] border border-black/[0.08] text-[#6B7280] hover:text-[#111827] transition active:scale-95"
            aria-label="Đóng ngăn kéo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar Line */}
        <div className="h-1 w-full bg-black/[0.05]">
          <div
            className="h-full bg-[#111827] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Scrollable Questions Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((question, index) => {
              const isAnswered = (userAnswers[question.id] || "").trim().length > 0;
              const isFlagged = Boolean(flaggedQuestions[question.id]);
              const isActive = activeQuestionId === question.id;

              // Color states as specifically requested
              let btnStyle = "border-black/[0.06] bg-[#F6F6F8] text-[#6B7280] hover:bg-black/[0.04] hover:text-[#111827]";

              if (isFlagged) {
                // Câu ĐÃ ĐÁNH DẤU: Vàng neon kèm cờ
                btnStyle = "border-[#B8962E]/40 bg-[#F6EBC8] text-[#B8962E] font-bold shadow-xs";
              } else if (isAnswered) {
                // Câu ĐÃ LÀM: Tím sáng rực rỡ / Xanh lục bảo
                btnStyle = "border-[#2E9E5B]/40 bg-[#DDF2E5] text-[#2E9E5B] font-bold shadow-xs";
              }

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => handleSelect(question.id)}
                  className={cn(
                    "relative flex h-11 w-full items-center justify-center rounded-xl text-xs font-mono tabular-nums transition active:scale-95 border",
                    btnStyle,
                    isActive && "ring-2 ring-[#111827] ring-offset-2 ring-offset-white scale-105 z-10 bg-white text-[#111827]"
                  )}
                >
                  <span>{index + 1}</span>

                  {/* Flag Icon */}
                  {isFlagged && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-sm border border-slate-950">
                      <Flag className="h-2.5 w-2.5 fill-current" />
                    </span>
                  )}

                  {/* Answered Check Icon */}
                  {!isFlagged && isAnswered && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 border border-slate-950 shadow-sm">
                      <Check className="h-2 w-2 stroke-[3.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend & Safe Footer */}
        <div className="border-t border-white/10 bg-slate-950/80 px-5 pt-3 pb-6 text-[11px] text-slate-400">
          <div className="flex items-center justify-around gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
              <span className="text-slate-300">Đã làm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-500/30 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
              <span className="text-amber-300 font-medium">Xem lại</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-slate-800 bg-slate-900" />
              <span>Chưa làm</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
