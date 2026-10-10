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
          ? "border-rose-500/50 bg-rose-950/50 text-rose-200 animate-pulse"
          : isWarning
          ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
          : "border-slate-800 bg-slate-900/90 text-slate-100"
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 text-rose-400" />
      ) : (
        <Clock className="h-4 w-4 text-indigo-400" />
      )}

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold text-slate-400">
          Thời gian còn lại
        </span>
        <span className="font-mono text-sm font-bold tracking-tight text-white">
          {formatTimeLeft(secondsLeft)}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="hidden sm:block h-2 w-16 overflow-hidden rounded-full bg-slate-950 border border-slate-800">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-indigo-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
