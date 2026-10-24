"use client";

import { ParsedQuestionDraft, QuestionType } from "@/types/exam";
import { Trash2, Plus, Check, HelpCircle, FileText } from "lucide-react";
import { NumberStepper } from "@/components/ui/NumberStepper";

interface QuestionEditorCardProps {
  question: ParsedQuestionDraft;
  index: number;
  total: number;
  onChange: (updated: ParsedQuestionDraft) => void;
  onDelete: () => void;
}

export function QuestionEditorCard({
  question,
  index,
  total,
  onChange,
  onDelete,
}: QuestionEditorCardProps) {
  const handleTypeChange = (newType: QuestionType) => {
    if (newType === "essay") {
      onChange({
        ...question,
        type: newType,
        options: [],
        correct_answer: "",
        max_score: 5.0,
      });
    } else {
      onChange({
        ...question,
        type: newType,
        options: [
          "A. Lựa chọn 1",
          "B. Lựa chọn 2",
          "C. Lựa chọn 3",
          "D. Lựa chọn 4",
        ],
        correct_answer: "A",
      });
    }
  };

  const handleOptionChange = (optIndex: number, text: string) => {
    const newOptions = [...question.options];
    newOptions[optIndex] = text;
    onChange({
      ...question,
      options: newOptions,
    });
  };

  const handleAddOption = () => {
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const nextLetter = letters[question.options.length] || `Opt${question.options.length + 1}`;
    onChange({
      ...question,
      options: [...question.options, `${nextLetter}. Lựa chọn mới`],
    });
  };

  const handleRemoveOption = (optIndex: number) => {
    const newOptions = question.options.filter((_, idx) => idx !== optIndex);
    onChange({
      ...question,
      options: newOptions,
    });
  };

  return (
    <div className="rounded-[24px] bg-white dark:bg-[#1A1D26] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      {/* Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-[#F6F6F8] dark:bg-[#1A1C24] text-xs font-bold text-[#111827] dark:text-white font-mono">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
            Câu hỏi {index + 1} trên {total}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Question Type Switch */}
          <div className="inline-flex rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] p-0.5">
            <button
              type="button"
              onClick={() => handleTypeChange("multiple_choice")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                question.type === "multiple_choice"
                  ? "bg-[#111827] text-white dark:bg-white dark:text-[#0A0B0E] font-bold shadow-xs"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              <HelpCircle className="h-3 w-3" />
              Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("essay")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                question.type === "essay"
                  ? "bg-[#111827] text-white dark:bg-white dark:text-[#0A0B0E] font-bold shadow-xs"
                  : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              <FileText className="h-3 w-3" />
              Tự luận
            </button>
          </div>

          {/* Max Score Input */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Điểm:</label>
            <NumberStepper
              value={question.max_score}
              onChange={(val) =>
                onChange({
                  ...question,
                  max_score: val,
                })
              }
              min={0.25}
              max={100}
              step={0.25}
            />
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-900/40"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Question Content Input */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold text-[#111827] dark:text-white">
          Nội dung câu hỏi
        </label>
        <textarea
          rows={2}
          value={question.content}
          onChange={(e) => onChange({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi hoặc công thức..."
          className="w-full rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] p-3 text-sm leading-relaxed text-[#111827] dark:text-white placeholder-[#6B7280] dark:placeholder-[#9CA3AF] transition focus:border-black dark:focus:border-white focus:outline-hidden"
        />
      </div>

      {/* Multiple Choice Options Area */}
      {question.type === "multiple_choice" ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111827] dark:text-white">
              Lựa chọn đáp án (đánh dấu đáp án đúng)
            </span>
            <button
              type="button"
              onClick={handleAddOption}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Thêm lựa chọn
            </button>
          </div>

          <div className="space-y-2">
            {question.options.map((option, optIdx) => {
              const letterMatch = option.match(/^([A-Z])[\.\:\)]/i);
              const letter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + optIdx);
              const isSelectedKey =
                question.correct_answer.toUpperCase() === letter ||
                question.correct_answer.startsWith(letter);

              return (
                <div key={optIdx} className="flex items-center gap-2">
                  {/* Select as Correct Key */}
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...question,
                        correct_answer: letter,
                      })
                    }
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition font-mono ${
                      isSelectedKey
                        ? "border-emerald-500/30 bg-[#DDF2E5] text-[#2E9E5B]"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] text-[#6B7280] dark:text-[#9CA3AF] hover:border-black/[0.12] dark:hover:border-white/20 hover:text-[#111827] dark:hover:text-white"
                    }`}
                    title={`Chọn ${letter} làm đáp án đúng`}
                  >
                    {isSelectedKey ? <Check className="h-4 w-4 stroke-[3]" /> : letter}
                  </button>

                  {/* Option Text Input */}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                    className="h-9 flex-1 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#F6F6F8] dark:bg-[#14161D] px-3 text-xs text-[#111827] dark:text-white transition focus:border-black dark:focus:border-white focus:outline-hidden"
                  />

                  {/* Remove option button */}
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIdx)}
                      className="p-1.5 text-[#A4A7B0] hover:text-rose-500 transition"
                      title="Xóa lựa chọn này"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/[0.12] dark:border-white/[0.12] bg-[#F6F6F8] dark:bg-[#14161D] p-3 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
          Câu hỏi tự luận: User nhập câu trả lời dạng văn bản trong phòng thi. Hệ thống sẽ chấm điểm tự luận trên thang điểm chuẩn.
        </div>
      )}
    </div>
  );
}
