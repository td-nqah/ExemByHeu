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
    <div className="glow-card rounded-2xl p-5">
      {/* Header Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs font-bold text-indigo-400">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-slate-400">
            Câu hỏi {index + 1} trên {total}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Question Type Switch */}
          <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900/70 p-0.5">
            <button
              type="button"
              onClick={() => handleTypeChange("multiple_choice")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                question.type === "multiple_choice"
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
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
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3 w-3" />
              Tự luận
            </button>
          </div>

          {/* Max Score Input */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-400">Điểm:</label>
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
              className="glass-input h-8 w-16 rounded-lg px-2 text-center text-xs font-bold"
            />
          </div>

          {/* Delete Button */}
          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/20"
            title="Xóa câu hỏi này"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Question Content Input */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          Nội dung câu hỏi
        </label>
        <textarea
          rows={2}
          value={question.content}
          onChange={(e) => onChange({ ...question, content: e.target.value })}
          placeholder="Nhập nội dung câu hỏi hoặc công thức..."
          className="glass-input w-full rounded-xl p-3 text-sm leading-relaxed"
        />
      </div>

      {/* Multiple Choice Options Area */}
      {question.type === "multiple_choice" ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Lựa chọn đáp án (đánh dấu đáp án đúng)
            </span>
            <button
              type="button"
              onClick={handleAddOption}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
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
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold transition ${
                      isSelectedKey
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-white"
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
                    className="glass-input h-9 flex-1 rounded-xl px-3 text-xs"
                  />

                  {/* Remove option button */}
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(optIdx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
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
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
          Câu hỏi tự luận: User nhập câu trả lời dạng văn bản trong phòng thi. Hệ thống sẽ chấm điểm tự luận trên thang điểm chuẩn.
        </div>
      )}
    </div>
  );
}
