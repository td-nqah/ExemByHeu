"use client";

import { useEffect, useState } from "react";
import { formatTimeLeft } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

interface StickyTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
}

export function StickyTimer({ durationMinutes, onTimeUp }: StickyTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp]);

  const percentage = Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100));
  const isCritical = secondsLeft < 120; // less than 2 minutes
  const isWarning = secondsLeft < 300 && !isCritical; // less than 5 minutes

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 transition shadow-xs ${
        isCritical
          ? "border-red-300 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200 animate-pulse"
          : isWarning
          ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200"
          : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      ) : (
        <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      )}

      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
          Thời gian còn lại
        </span>
        <span className="font-mono text-sm font-bold tracking-tight">
          {formatTimeLeft(secondsLeft)}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="hidden sm:block h-2 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? "bg-red-600" : isWarning ? "bg-amber-500" : "bg-emerald-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
