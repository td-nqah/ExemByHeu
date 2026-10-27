"use client";

import React, { useMemo } from "react";

interface ExamWatermarkProps {
  userName?: string;
  userCode?: string;
  sessionId: string;
}

export function ExamWatermark({
  userName = "Thí sinh",
  userCode = "STUDENT",
  sessionId,
}: ExamWatermarkProps) {
  const currentDate = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    return `${day}/${month}/${year} ${time}`;
  }, []);

  const watermarkText = `${userName} • ${userCode} • ${sessionId.slice(0, 8)} • ${currentDate}`;

  // Generate an array of repeated tiles to cover any viewport size
  const tiles = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => i);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 select-none overflow-hidden opacity-[0.04] dark:opacity-[0.06]"
      aria-hidden="true"
    >
      <div className="absolute -inset-[50%] flex flex-wrap items-center justify-around gap-x-16 gap-y-24 rotate-[-35deg] transform">
        {tiles.map((idx) => (
          <div
            key={idx}
            className="whitespace-nowrap text-xs sm:text-sm font-mono font-bold tracking-widest text-slate-900 dark:text-slate-100 uppercase"
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  );
}
