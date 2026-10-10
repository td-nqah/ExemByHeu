"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

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
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;
  const hasUnanswered = unansweredCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Icon and Title */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              hasUnanswered
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            }`}
          >
            {hasUnanswered ? (
              <AlertCircle className="h-6 w-6" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Xác nhận nộp bài thi
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hệ thống sẽ lưu trữ bài làm và tính điểm ngay lập tức.
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className="mb-5 rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 dark:border-zinc-800/80 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-zinc-600 dark:text-zinc-400">Tổng số câu hỏi:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{totalQuestions} câu</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-zinc-600 dark:text-zinc-400">Đã hoàn thành:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount} câu</span>
          </div>
          {hasUnanswered && (
            <div className="flex items-center justify-between text-xs py-1 border-t border-zinc-200/60 dark:border-zinc-700/60 mt-1 pt-1.5">
              <span className="font-medium text-amber-700 dark:text-amber-400">Chưa trả lời:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{unansweredCount} câu</span>
            </div>
          )}
        </div>

        {hasUnanswered && (
          <p className="mb-5 text-xs leading-relaxed text-amber-700 bg-amber-50 p-3 rounded-lg dark:bg-amber-950/40 dark:text-amber-300">
            Lưu ý: Bạn vẫn còn {unansweredCount} câu chưa điền câu trả lời. Bạn có chắc chắn muốn nộp bài ngay lúc này?
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Quay lại làm tiếp
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? "Đang xử lý..." : "Nộp bài ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
