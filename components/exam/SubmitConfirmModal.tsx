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
              className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Icon and Title */}
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                  hasUnanswered
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                }`}
              >
                {hasUnanswered ? (
                  <AlertCircle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Xác nhận nộp bài thi
                </h3>
                <p className="text-xs text-slate-400">
                  Hệ thống sẽ lưu trữ bài làm và chấm điểm ngay lập tức.
                </p>
              </div>
            </div>

            {/* Status Box */}
            <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-400">Tổng số câu hỏi:</span>
                <span className="font-bold text-white">{totalQuestions} câu</span>
              </div>
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-400">Đã hoàn thành:</span>
                <span className="font-bold text-emerald-400">{answeredCount} câu</span>
              </div>
              {hasUnanswered && (
                <div className="mt-1 flex items-center justify-between border-t border-slate-800 pt-1.5 py-1 text-xs">
                  <span className="font-medium text-amber-400">Chưa trả lời:</span>
                  <span className="font-bold text-amber-400">{unansweredCount} câu</span>
                </div>
              )}
            </div>

            {hasUnanswered && (
              <p className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-300">
                Lưu ý: Bạn vẫn còn {unansweredCount} câu chưa điền câu trả lời. Bạn có chắc chắn muốn nộp bài ngay lúc này?
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition active:scale-[0.98] disabled:opacity-50"
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
