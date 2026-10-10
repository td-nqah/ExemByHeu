"use client";

import { ParsedQuestionDraft, QuestionType } from "@/types/exam";
import { Trash2, Plus, Check, HelpCircle, FileText } from "lucide-react";

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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
      {/* Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Câu hỏi {index + 1} trên {total}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Question Type Switch */}
          <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => handleTypeChange("multiple_choice")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                question.type === "multiple_choice"
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <HelpCircle className="h-3 w-3" />
              Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("essay")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                question.type === "essay"
                  ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3 w-3" />
              Tự luận
            </button>
          </div>

          {/* Max Score Input */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-zinc-500 dark:text-zinc-400">Điểm:</label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={question.max_score}
              onChange={(e) =>
                onChange({
                  ...question,
                  max_score: parseFloat(e.target.value) || 1,
                })
              }
              className="h-8 w-16 rounded-md border border-zinc-200 bg-white px-2 text-center text-xs font-semibold text-zinc-900 focus:border-zinc-400 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Question Content Input */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
          Nội dung câu hỏi
        </label>
        <textarea
          rows={2}
          value={question.content}
          onChange={(e) => onChange({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi hoặc công thức..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-sm leading-relaxed text-zinc-900 transition focus:border-zinc-400 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
        />
      </div>

      {/* Multiple Choice Options Area */}
      {question.type === "multiple_choice" ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Lựa chọn đáp án (đánh dấu đáp án đúng)
            </span>
            <button
              type="button"
              onClick={handleAddOption}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Plus className="h-3 w-3" />
              Thêm lựa chọn
            </button>
          </div>

          <div className="space-y-2">
            {question.options.map((option, optIdx) => {
              // Extract letter prefix if present
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
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition ${
                      isSelectedKey
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                    title={`Chọn ${letter} làm đáp án đúng`}
                  >
                    {isSelectedKey ? <Check className="h-3.5 w-3.5" /> : letter}
                  </button>

                  {/* Option Text Input */}
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(optIdx, e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />

                  {/* Remove option button */}
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIdx)}
                      className="p-1.5 text-zinc-400 hover:text-red-500"
                      title="Xóa lựa chọn này"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
          Câu hỏi tự luận: Thí sinh sẽ nhập câu trả lời dạng văn bản dài trong phòng thi. Giáo viên sẽ chấm điểm và nhận xét thủ công sau khi nộp bài.
        </div>
      )}
    </div>
  );
}
