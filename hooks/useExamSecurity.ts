"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseExamSecurityOptions {
  examId: string;
  sessionId: string;
  enabled?: boolean;
  maxStrikes?: number;
  onTerminate: (reason: string) => void;
}

export function useExamSecurity({
  examId,
  sessionId,
  enabled = true,
  maxStrikes = 3,
  onTerminate,
}: UseExamSecurityOptions) {
  const [violationCount, setViolationCount] = useState<number>(0);
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;

  // Initialize violation count from sessionStorage
  useEffect(() => {
    if (!examId || typeof window === "undefined") return;
    const stored = sessionStorage.getItem(`exam_violations_${examId}`);
    if (stored) {
      setViolationCount(parseInt(stored, 10) || 0);
    }
  }, [examId]);

  // Log violation to background API
  const dispatchViolationLog = useCallback(
    (count: number, reason: string) => {
      if (typeof window === "undefined") return;
      try {
        fetch("/api/exam/log-violation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examId,
            sessionId,
            violationCount: count,
            reason,
            timestamp: new Date().toISOString(),
          }),
        }).catch((err) => {
          console.warn("Non-blocking: Failed to dispatch violation log:", err);
        });
      } catch (err) {
        console.warn("Non-blocking error logging violation:", err);
      }
    },
    [examId, sessionId]
  );

  // Trigger violation
  const recordViolation = useCallback(
    (reason = "OUT_OF_TAB_LIMIT_EXCEEDED") => {
      if (!enabled) return;

      const currentStored = parseInt(
        sessionStorage.getItem(`exam_violations_${examId}`) || "0",
        10
      );
      const nextCount = currentStored + 1;

      sessionStorage.setItem(`exam_violations_${examId}`, String(nextCount));
      setViolationCount(nextCount);
      dispatchViolationLog(nextCount, reason);

      if (nextCount < maxStrikes) {
        // Strike 1 or Strike 2: Vibrate & Open Warning Modal
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200]);
          } catch {}
        }
        setIsWarningOpen(true);
      } else {
        // Strike 3: Terminate exam immediately
        setIsWarningOpen(false);
        onTerminateRef.current(reason);
      }
    },
    [enabled, examId, maxStrikes, dispatchViolationLog]
  );

  // Tab-Switch & Visibility Tracker
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordViolation("TAB_SWITCH_OR_MINIMIZE");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, recordViolation]);

  // Anti-Copy, Anti-Paste, Anti-Inspection Keyboard Guardrails
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();

      // 1. Block Copy (Ctrl+C / Cmd+C outside of input fields), Allow Paste (Ctrl+V / Cmd+V)
      if (isCtrlOrMeta && keyLower === "c") {
        const target = e.target as HTMLElement | null;
        if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA" && !target?.isContentEditable) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // 2. Block View Source (Ctrl+U / Cmd+U)
      if (isCtrlOrMeta && keyLower === "u") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 3. Block Save (Ctrl+S / Cmd+S) & Print (Ctrl+P / Cmd+P)
      if (isCtrlOrMeta && (keyLower === "s" || keyLower === "p")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 4. Block Developer Tools: F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 5. Block Developer Tools combinations: Ctrl+Shift+I / J / C
      if (isCtrlOrMeta && e.shiftKey && ["i", "j", "c"].includes(keyLower)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled]);

  // Context Menu blocker (allow inside inputs & textareas for pasting)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Dismiss modal (User acknowledges warning)
  const acknowledgeWarning = useCallback(() => {
    setIsWarningOpen(false);
  }, []);

  return {
    violationCount,
    isWarningOpen,
    acknowledgeWarning,
    handleContextMenu,
  };
}
