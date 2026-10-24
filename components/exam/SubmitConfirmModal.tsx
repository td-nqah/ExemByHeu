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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-[24px] bg-white dark:bg-[#1A1D26] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl p-6 text-[#111827] dark:text-white"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 rounded-xl p-1.5 text-[#6B7280] dark:text-[#9CA3AF] transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Icon and Title */}
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                  hasUnanswered
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                }`}
              >
                {hasUnanswered ? (
                  <AlertCircle className="h-6 w-6" />
                ) : (
                  <CheckCircle2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                  Xác nhận nộp bài đánh giá
                </h3>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Hệ thống sẽ ghi nhận bài làm và tính điểm đánh giá học phần.
                </p>
              </div>
            </div>

            {/* Status Box */}
            <div className="mb-5 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] p-4">
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Tổng số câu hỏi:</span>
                <span className="font-bold text-[#111827] dark:text-white">{totalQuestions} câu</span>
              </div>
              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-[#6B7280] dark:text-[#9CA3AF]">Đã hoàn thành:</span>
                <span className="font-bold text-[#2E9E5B]">{answeredCount} câu</span>
              </div>
              {hasUnanswered && (
                <div className="mt-1 flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.08] pt-1.5 py-1 text-xs">
                  <span className="font-medium text-amber-600 dark:text-amber-400">Chưa trả lời:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{unansweredCount} câu</span>
                </div>
              )}
            </div>

            {hasUnanswered && (
              <p className="mb-5 rounded-xl border border-[#B8962E]/30 bg-[#F6EBC8] p-3 text-xs leading-relaxed text-[#B8962E]">
                Cảnh báo học vụ: Còn {unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl glass-btn px-4 py-2 text-xs font-semibold text-[#111827] dark:text-white transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="rounded-xl bg-[#111827] hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-[#0A0B0E] px-5 py-2 text-xs font-bold shadow-xs transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
