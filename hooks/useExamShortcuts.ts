"use client";

import { useEffect } from "react";
import { Question } from "@/types/exam";

interface UseExamShortcutsOptions {
  enabled?: boolean;
  questions: Question[];
  activeQuestionId: string | null;
  onSelectOption: (questionId: string, optionIndex: number) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onToggleFlag: (questionId: string) => void;
}

export function useExamShortcuts({
  enabled = true,
  questions,
  activeQuestionId,
  onSelectOption,
  onNavigatePrev,
  onNavigateNext,
  onToggleFlag,
}: UseExamShortcutsOptions) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: Bypass if typing inside input, textarea, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      // Do not interfere if Ctrl/Cmd/Alt/Meta is held
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const activeId = activeQuestionId || questions[0]?.id;
      if (!activeId) return;

      // 1. Navigation Arrow Keys: ArrowLeft (←) and ArrowRight (→)
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigatePrev();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigateNext();
        return;
      }

      // 2. Toggle Flag / Review: 'f' or 'F'
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        onToggleFlag(activeId);
        return;
      }

      // 3. Option Selection: Numbers '1', '2', '3', '4' OR Letters 'A', 'B', 'C', 'D'
      const keyUpper = e.key.toUpperCase();
      let optionIndex = -1;

      if (e.key === "1" || keyUpper === "A") optionIndex = 0;
      else if (e.key === "2" || keyUpper === "B") optionIndex = 1;
      else if (e.key === "3" || keyUpper === "C") optionIndex = 2;
      else if (e.key === "4" || keyUpper === "D") optionIndex = 3;

      if (optionIndex !== -1) {
        const currentQ = questions.find((q) => q.id === activeId);
        if (currentQ && currentQ.type === "multiple_choice") {
          e.preventDefault();
          onSelectOption(activeId, optionIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    questions,
    activeQuestionId,
    onSelectOption,
    onNavigatePrev,
    onNavigateNext,
    onToggleFlag,
  ]);
}
