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
      className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 backdrop-blur-xl transition select-none ${
        isCritical
          ? "border-rose-500/60 bg-[#161A24] text-rose-200 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.35)] ring-1 ring-rose-500/50"
          : isWarning
          ? "border-amber-500/50 bg-[#161A24] text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
          : "border-[#252A37] bg-[#10131B] text-white shadow-sm"
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="h-4 w-4 text-rose-400" />
      ) : (
        <Clock className="h-4 w-4 text-white" />
      )}

      <div className="flex flex-col">
        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8B93A5]">
          Thời gian còn lại
        </span>
        <span className="font-mono text-xs font-bold tracking-normal tabular-nums text-white">
          {formatTimeLeft(secondsLeft)}
        </span>
      </div>

      {/* Mini Progress Bar */}
      <div className="hidden sm:block h-2 w-16 overflow-hidden rounded-full bg-[#0A0C12] border border-[#252A37]">
        <div
          className={`h-full transition-all duration-1000 ${
            isCritical ? "bg-rose-500" : isWarning ? "bg-amber-400" : "bg-white"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
