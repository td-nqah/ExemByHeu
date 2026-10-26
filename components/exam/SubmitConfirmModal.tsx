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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-3xl border border-[#252A37] bg-[#161A24] p-6 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 rounded-full p-1.5 text-[#9CA3AF] transition hover:bg-[#10131B] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Icon and Title */}
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                  hasUnanswered
                    ? "border-amber-500/40 bg-[#10131B] text-amber-400"
                    : "border-[#252A37] bg-[#10131B] text-white"
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
                  Xác nhận nộp bài đánh giá
                </h3>
                <p className="text-xs text-[#9CA3AF]">
                  Hệ thống sẽ ghi nhận bài làm và tính điểm đánh giá học phần.
                </p>
              </div>
            </div>

            {/* Status Box */}
            <div className="mb-5 rounded-2xl border border-[#252A37] bg-[#10131B] p-4 text-xs tabular-nums">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8B93A5] uppercase tracking-wider">Tổng số câu hỏi:</span>
                <span className="font-bold text-white">{totalQuestions} câu</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#8B93A5] uppercase tracking-wider">Đã hoàn thành:</span>
                <span className="font-bold text-emerald-400">{answeredCount} câu</span>
              </div>
              {hasUnanswered && (
                <div className="mt-1 flex items-center justify-between border-t border-[#252A37] pt-1.5 py-1">
                  <span className="font-medium text-amber-400 uppercase tracking-wider">Chưa trả lời:</span>
                  <span className="font-bold text-amber-400">{unansweredCount} câu</span>
                </div>
              )}
            </div>

            {hasUnanswered && (
              <p className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
                Cảnh báo học vụ: Còn {unansweredCount} câu hỏi chưa trả lời. Bạn có chắc chắn muốn nộp bài?
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full bg-[#10131B] border border-[#2A2F3C] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#161A24]"
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="rounded-full bg-white px-6 py-2.5 text-xs font-bold text-[#05070D] shadow-lg hover:bg-slate-200 transition active:scale-[0.98] disabled:opacity-50"
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
