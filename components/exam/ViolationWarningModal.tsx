"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface ViolationWarningModalProps {
  isOpen: boolean;
  violationCount: number;
  maxViolations?: number;
  onAcknowledge: () => void;
}

export function ViolationWarningModal({
  isOpen,
  violationCount,
  maxViolations = 3,
  onAcknowledge,
}: ViolationWarningModalProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus the acknowledge button when modal opens
  useEffect(() => {
    if (isOpen) {
      // Vibrate device if supported
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {}
      }

      const timer = setTimeout(() => {
        buttonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Trap focus and prevent Esc key from dismissing without acknowledging
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="violation-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-[#14080B] p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.35)] relative overflow-hidden"
          >
            {/* Ambient Red Glow Line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="h-8 w-8 stroke-[2.25]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 mb-3">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Vi phạm lần {violationCount}/{maxViolations}</span>
            </span>

            <h2
              id="violation-modal-title"
              className="text-lg sm:text-xl font-heading font-extrabold tracking-tight text-white mb-2"
            >
              CẢNH BÁO VI PHẠM PHÒNG THI
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
              Cảnh báo: Bạn đã rời khỏi phòng thi (Lần <strong className="text-rose-400 font-bold tabular-nums">[{violationCount}]</strong>/{maxViolations}). Rời màn hình thêm một lần nữa hệ thống sẽ lập tức thu bài thi!
            </p>

            <button
              ref={buttonRef}
              type="button"
              onClick={onAcknowledge}
              className="w-full py-3 px-5 rounded-full bg-white hover:bg-slate-200 text-black font-heading font-bold text-xs uppercase tracking-wide transition-all shadow-xl active:scale-[0.98] cursor-pointer"
            >
              Tôi đã hiểu và cam kết không rời màn hình
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
