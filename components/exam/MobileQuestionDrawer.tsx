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
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-black border border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.25)] transition-all duration-200 active:scale-90 hover:scale-105"
          aria-label="Mở danh sách câu hỏi"
          title="Danh sách câu hỏi"
        >
          <Menu className="h-6 w-6 stroke-[2.5]" strokeLinecap="round" />

          {/* Progress Badge */}
          <span className="absolute -top-1.5 -right-1.5 flex min-w-[24px] h-[22px] items-center justify-center rounded-full bg-[#232836] border border-[#2A2F3C] px-1.5 text-[10px] font-mono font-bold text-white shadow-md">
            {answeredCount}/{total}
          </span>

          {/* Small Flag indicator if any flagged */}
          {flaggedCount > 0 && (
            <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black border-2 border-[#0A0C12] shadow-md">
              <Flag className="h-2.5 w-2.5 fill-current" />
            </span>
          )}
        </button>
      </div>

      {/* 2. Backdrop Blur Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* 3. Slide-over Bottom Sheet Drawer */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[32px] border-t border-[#252A37] bg-[#0A0C12] shadow-[0_-12px_45px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-out md:hidden",
          isOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
      >
        {/* Drag Pill indicator */}
        <div className="flex w-full items-center justify-center pt-3 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-[#252A37]" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#252A37] px-5 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Danh sách câu hỏi
              </h2>
              {flaggedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#232836] text-amber-300 border border-[#2A2F3C] px-2 py-0.5 text-[10px] font-mono font-semibold">
                  <Flag className="h-2.5 w-2.5 fill-current" />
                  <span>{flaggedCount} cờ</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 font-mono">
              Đã làm <span className="font-bold text-white">{answeredCount}/{total} câu</span> ({progressPercent}%)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10131B] border border-[#252A37] text-white hover:bg-[#161A24] transition active:scale-95"
            aria-label="Đóng ngăn kéo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar Line */}
        <div className="h-1 w-full bg-[#10131B]">
          <div
            className="h-full bg-white transition-all duration-300"
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

              let btnStyle = "border-[#252A37] bg-[#10131B] text-[#9CA3AF]";

              if (isFlagged) {
                btnStyle = "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)] font-bold";
              } else if (isAnswered) {
                btnStyle = "border-white bg-[#161A24] text-white font-bold shadow-xs";
              }

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => handleSelect(question.id)}
                  className={cn(
                    "relative flex h-11 w-full items-center justify-center rounded-xl text-xs font-mono font-bold transition active:scale-95 border",
                    btnStyle,
                    isActive && "ring-2 ring-white ring-offset-2 ring-offset-[#0A0C12] scale-105 z-10"
                  )}
                >
                  <span>{index + 1}</span>

                  {/* Flag Icon */}
                  {isFlagged && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black shadow-sm border border-[#0A0C12]">
                      <Flag className="h-2.5 w-2.5 fill-current" />
                    </span>
                  )}

                  {/* Answered Check Icon */}
                  {!isFlagged && isAnswered && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-black border border-[#0A0C12] shadow-sm">
                      <Check className="h-2 w-2 stroke-[3.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend & Safe Footer */}
        <div className="border-t border-[#252A37] bg-[#0A0C12] px-5 pt-3 pb-6 text-[11px] text-[#8B93A5] font-sans">
          <div className="flex items-center justify-around gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#161A24] border border-white" />
              <span className="text-white font-medium">Đã làm</span>
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
      </div>
    </>
  );
}
