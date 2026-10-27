"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseOfflineSyncOptions {
  examId: string;
  sessionId: string;
  initialAnswers?: Record<string, string>;
}

export function useOfflineSync({
  examId,
  sessionId,
  initialAnswers = {},
}: UseOfflineSyncOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState<boolean>(false);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined" && examId) {
      try {
        const cached = localStorage.getItem(`exam_answers_${examId}`);
        if (cached) {
          return { ...initialAnswers, ...JSON.parse(cached) };
        }
      } catch {}
    }
    return initialAnswers;
  });

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Initialize online state
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowOfflineBanner(true);
    }
  }, []);

  // Flush queued mutations to server
  const flushOfflineQueue = useCallback(async () => {
    if (typeof window === "undefined" || !examId) return;
    try {
      const queueRaw = localStorage.getItem(`exam_offline_queue_${examId}`);
      const latestAnswers = answersRef.current;

      const payload = {
        examId,
        sessionId,
        answers: latestAnswers,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch("/api/exam/sync-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        localStorage.removeItem(`exam_offline_queue_${examId}`);
        setShowReconnectedBanner(true);
        setTimeout(() => setShowReconnectedBanner(false), 3500);
      }
    } catch (err) {
      console.warn("Could not flush offline queue yet:", err);
    }
  }, [examId, sessionId]);

  // Handle online / offline events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      flushOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      setShowReconnectedBanner(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushOfflineQueue]);

  // Dual-write function
  const updateAnswer = useCallback(
    (questionId: string, answerValue: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: answerValue };

        // 1. Immediately write to localStorage
        if (typeof window !== "undefined" && examId) {
          try {
            localStorage.setItem(`exam_answers_${examId}`, JSON.stringify(next));
          } catch (e) {
            console.error("Local storage quota exceeded:", e);
          }
        }

        // 2. Dispatch background sync or queue if offline
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          try {
            localStorage.setItem(
              `exam_offline_queue_${examId}`,
              JSON.stringify(next)
            );
          } catch {}
        } else {
          // Asynchronous non-blocking background sync
          fetch("/api/exam/sync-answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              examId,
              sessionId,
              answers: next,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {
            // Queue on failure
            try {
              localStorage.setItem(
                `exam_offline_queue_${examId}`,
                JSON.stringify(next)
              );
              setShowOfflineBanner(true);
            } catch {}
          });
        }

        return next;
      });
    },
    [examId, sessionId]
  );

  const clearExamCache = useCallback(() => {
    if (typeof window !== "undefined" && examId) {
      try {
        localStorage.removeItem(`exam_answers_${examId}`);
        localStorage.removeItem(`exam_offline_queue_${examId}`);
        sessionStorage.removeItem(`exam_violations_${examId}`);
        sessionStorage.removeItem(`exam_end_time_${examId}`);
        sessionStorage.removeItem(`exam_session_id_${examId}`);
      } catch {}
    }
  }, [examId]);

  return {
    answers,
    setAnswers,
    updateAnswer,
    isOnline,
    showOfflineBanner,
    showReconnectedBanner,
    clearExamCache,
  };
}
