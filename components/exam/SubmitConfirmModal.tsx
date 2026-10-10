"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalQuestions: number;
  answeredCount: number;
  isSubmitting?: boolean;
}

export function SubmitConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  totalQuestions,
  answeredCount,
  isSubmitting = false,
}: SubmitConfirmModalProps) {
  const unansweredCount = totalQuestions - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="glass-panel relative w-full max-w-md rounded-2xl p-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 rounded-xl p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Icon and Title */}
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                  hasUnanswered
                    ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                    : "border-white/25 bg-white/10 text-white"
                }`}
              >
                {hasUnanswered ? (
                  <AlertCircle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Xác nhận nộp bài thi
                </h3>
                <p className="text-xs text-zinc-400">
                  Hệ thống sẽ lưu trữ bài làm và chấm điểm ngay lập tức.
                </p>
              </div>
            </div>

            {/* Status Box */}
            <div className="mb-5 rounded-xl border border-white/10 bg-zinc-950/60 p-4">
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-zinc-400">Tổng số câu hỏi:</span>
                <span className="font-bold text-white">{totalQuestions} câu</span>
              </div>
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-zinc-400">Đã hoàn thành:</span>
                <span className="font-bold text-white">{answeredCount} câu</span>
              </div>
              {hasUnanswered && (
                <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-1.5 py-1 text-xs">
                  <span className="font-medium text-amber-300">Chưa trả lời:</span>
                  <span className="font-bold text-amber-300">{unansweredCount} câu</span>
                </div>
              )}
            </div>

            {hasUnanswered && (
              <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3 text-xs leading-relaxed text-amber-200">
                Lưu ý: Bạn vẫn còn {unansweredCount} câu chưa điền câu trả lời. Bạn có chắc chắn muốn nộp bài ngay lúc này?
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="glass-pill rounded-xl px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="rounded-xl border border-white/40 bg-white px-5 py-2 text-xs font-bold text-zinc-950 shadow-[0_8px_24px_rgba(255,255,255,0.14)] transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Đang xử lý..." : "Nộp bài ngay"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
