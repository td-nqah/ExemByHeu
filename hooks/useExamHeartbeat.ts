"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface UseExamHeartbeatOptions {
  examId: string;
  sessionId: string;
  durationMinutes: number;
  enabled?: boolean;
  onTimeUp: () => void;
}

export function useExamHeartbeat({
  examId,
  sessionId,
  durationMinutes,
  enabled = true,
  onTimeUp,
}: UseExamHeartbeatOptions) {
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Initialize target end timestamp
  const [endTime, setEndTime] = useState<number>(() => {
    if (typeof window !== "undefined" && examId) {
      const stored = sessionStorage.getItem(`exam_end_time_${examId}`);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (parsed > Date.now()) {
          return parsed;
        }
      }
      const newTarget = Date.now() + durationMinutes * 60 * 1000;
      sessionStorage.setItem(`exam_end_time_${examId}`, String(newTarget));
      return newTarget;
    }
    return Date.now() + durationMinutes * 60 * 1000;
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
  });

  const secondsLeftRef = useRef(secondsLeft);
  secondsLeftRef.current = secondsLeft;

  // 1. High-precision drift-free local countdown
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, enabled]);

  // 2. Server Heartbeat ping every 60 seconds
  const sendHeartbeat = useCallback(async () => {
    if (!enabled || typeof window === "undefined" || !examId) return;

    try {
      const res = await fetch("/api/exam/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId,
          sessionId,
          clientRemainingSeconds: secondsLeftRef.current,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // If server marked exam as terminated
        if (data.isTerminated) {
          onTimeUpRef.current();
          return;
        }

        // Adjust client clock if drift exceeds 5 seconds
        if (typeof data.verifiedRemainingSeconds === "number") {
          const diff = Math.abs(data.verifiedRemainingSeconds - secondsLeftRef.current);
          if (diff > 5) {
            const adjustedTarget = Date.now() + data.verifiedRemainingSeconds * 1000;
            setEndTime(adjustedTarget);
            sessionStorage.setItem(`exam_end_time_${examId}`, String(adjustedTarget));
            setSecondsLeft(data.verifiedRemainingSeconds);
          }
        }
      }
    } catch (err) {
      console.warn("Heartbeat ping skipped:", err);
    }
  }, [enabled, examId, sessionId]);

  useEffect(() => {
    if (!enabled) return;

    // Send initial heartbeat after 5 seconds, then every 60 seconds
    const initialTimer = setTimeout(sendHeartbeat, 5000);
    const interval = setInterval(sendHeartbeat, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, sendHeartbeat]);

  return {
    secondsLeft,
    totalSeconds: durationMinutes * 60,
  };
}
