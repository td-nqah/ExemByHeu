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
  const isCritical = secondsLeft < 120;
  const isWarning = secondsLeft < 300 && !isCritical;

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-1.5 backdrop-blur-xl transition ${
        isCritical
          ? "border-rose-200 bg-rose-50 text-rose-600 animate-pulse"
          : isWarning
          ? "border-[#B8962E]/30 bg-[#F6EBC8] text-[#B8962E]"
          : "border-black/[0.06] dark:border-white/[0.1] bg-white dark:bg-[#14161D] text-[#111827] dark:text-white shadow-xs"
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 text-rose-500" />
      ) : (
        <Clock className="h-4 w-4 text-[#111827] dark:text-white" />
      )}

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
          Thời gian còn lại
        </span>
        <span className="font-mono text-sm font-bold tracking-tight tabular-nums text-[#111827] dark:text-white">
          {formatTimeLeft(secondsLeft)}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="hidden sm:block h-2 w-16 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-[#111827] dark:bg-white"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
