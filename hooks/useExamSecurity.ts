"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getCurrentUser } from "@/lib/store";

interface UseExamSecurityOptions {
  examId: string;
  sessionId: string;
  enabled?: boolean;
  maxStrikes?: number;
  isAdmin?: boolean;
  onTerminate: (reason: string) => void;
}

export function useExamSecurity({
  examId,
  sessionId,
  enabled = true,
  maxStrikes = 3,
  isAdmin: propIsAdmin,
  onTerminate,
}: UseExamSecurityOptions) {
  const [violationCount, setViolationCount] = useState<number>(0);
  const [isWarningOpen, setIsWarningOpen] = useState<boolean>(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;

  const checkIsAdmin = useCallback(() => {
    if (typeof propIsAdmin === "boolean") return propIsAdmin;
    if (typeof window === "undefined") return false;
    const user = getCurrentUser();
    return user?.role === "admin";
  }, [propIsAdmin]);

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

  // Anti-Copy, Anti-Paste, Anti-Inspection Keyboard & Clipboard Guardrails
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();
      const code = e.code;
      const isAdmin = checkIsAdmin();

      // 1. Block Copy (Ctrl+C), Paste (Ctrl+V), Cut (Ctrl+X), Shift+Insert
      // Only Admin is allowed to use Ctrl+C and Ctrl+V
      const isCopy = isCtrlOrMeta && (keyLower === "c" || code === "KeyC");
      const isPaste =
        (isCtrlOrMeta && (keyLower === "v" || code === "KeyV")) ||
        (e.shiftKey && (e.key === "Insert" || code === "Insert" || code === "Numpad0"));
      const isCut = isCtrlOrMeta && (keyLower === "x" || code === "KeyX");

      if (isCopy || isPaste || isCut) {
        if (!isAdmin) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      if (!isAdmin) {
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
      }
    };

    const handleClipboardEvent = (e: ClipboardEvent) => {
      if (!checkIsAdmin()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDragDrop = (e: DragEvent) => {
      if (!checkIsAdmin()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenuEvent = (e: MouseEvent) => {
      if (!checkIsAdmin()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("copy", handleClipboardEvent, true);
    window.addEventListener("cut", handleClipboardEvent, true);
    window.addEventListener("paste", handleClipboardEvent, true);
    window.addEventListener("drop", handleDragDrop, true);
    window.addEventListener("contextmenu", handleContextMenuEvent, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("copy", handleClipboardEvent, true);
      window.removeEventListener("cut", handleClipboardEvent, true);
      window.removeEventListener("paste", handleClipboardEvent, true);
      window.removeEventListener("drop", handleDragDrop, true);
      window.removeEventListener("contextmenu", handleContextMenuEvent, true);
    };
  }, [enabled, checkIsAdmin]);

  // Context Menu blocker: Admin is permitted; all other accounts are blocked completely
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (checkIsAdmin()) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    },
    [checkIsAdmin]
  );

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
