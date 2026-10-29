"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  HelpCircle,
  FileText,
  Calculator,
} from "lucide-react";
import { NumberStepper } from "@/components/ui/NumberStepper";

interface ScoreConfigPanelProps {
  mcqCount: number;
  essayCount: number;
  currentTotalScore: number;
  currentMcqTotal: number;
  currentEssayTotal: number;
  initialMcqScore?: number;
  initialEssayScore?: number;
  onChangeMcqScore: (scorePerMcq: number) => void;
  onChangeEssayScore: (scorePerEssay: number) => void;
  onApplyAutoScale?: (
    desiredTotal: number,
    mode: "proportional" | "fix_essay_split_mcq"
  ) => { newMcqScore: number; newEssayScore: number };
}

export function ScoreConfigPanel({
  mcqCount,
  essayCount,
  currentTotalScore,
  currentMcqTotal,
  currentEssayTotal,
  initialMcqScore = 0.5,
  initialEssayScore = 2.0,
  onChangeMcqScore,
  onChangeEssayScore,
}: ScoreConfigPanelProps) {
  const [mcqInput, setMcqInput] = useState<string>(String(initialMcqScore));
  const [essayInput, setEssayInput] = useState<string>(String(initialEssayScore));

  useEffect(() => {
    setMcqInput(String(initialMcqScore));
  }, [initialMcqScore]);

  useEffect(() => {
    setEssayInput(String(initialEssayScore));
  }, [initialEssayScore]);

  const handleMcqChange = (raw: string) => {
    setMcqInput(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      onChangeMcqScore(Math.round(parsed * 100) / 100);
    }
  };

  const handleEssayChange = (raw: string) => {
    setEssayInput(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      onChangeEssayScore(Math.round(parsed * 100) / 100);
    }
  };

  const formattedTotal = Math.round(currentTotalScore * 100) / 100;
  const formattedMcqTotal = Math.round(currentMcqTotal * 100) / 100;
  const formattedEssayTotal = Math.round(currentEssayTotal * 100) / 100;

  return (
    <div className="mb-8 rounded-3xl border border-[#252A37] bg-[#161A24] p-6 shadow-xl">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#252A37] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#252A37] bg-[#10131B] text-white">
            <Sliders className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Cấu hình Điểm số Đề thi
            </h3>
            <p className="text-xs text-[#9CA3AF]">
              Thiết lập điểm số hàng loạt cho câu hỏi trắc nghiệm và câu hỏi tự luận.
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Per-Question Score Inputs + Live Total Exam Score */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 1. MCQ Point per Question */}
        <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white">
              <HelpCircle className="h-3.5 w-3.5 text-[#8B93A5]" />
              <span>Điểm mỗi câu trắc nghiệm</span>
            </label>
            <span className="rounded-full bg-[#161A24] border border-[#252A37] px-2.5 py-0.5 text-[10px] tabular-nums font-semibold text-[#E5E7EB]">
              {mcqCount} câu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <NumberStepper
              value={parseFloat(mcqInput) || 0}
              onChange={(val) => handleMcqChange(String(val))}
              min={0}
              max={100}
              step={0.05}
              disabled={mcqCount === 0}
              className="w-full justify-between"
            />
            <span className="shrink-0 text-xs tabular-nums font-medium text-[#8B93A5]">đ/câu</span>
          </div>

          {/* Quick MCQ Presets */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#8B93A5]">Chọn nhanh:</span>
            {[0.2, 0.25, 0.5, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                disabled={mcqCount === 0}
                onClick={() => handleMcqChange(String(val))}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] tabular-nums font-semibold transition disabled:opacity-40 cursor-pointer ${
                  parseFloat(mcqInput) === val
                    ? "border-transparent bg-white text-black"
                    : "border-[#252A37] bg-[#161A24] text-slate-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {val}đ
              </button>
            ))}
          </div>
        </div>

        {/* 2. Essay Point per Question */}
        <div className="rounded-2xl border border-[#252A37] bg-[#10131B] p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white">
              <FileText className="h-3.5 w-3.5 text-[#8B93A5]" />
              <span>Điểm mỗi câu tự luận</span>
            </label>
            <span className="rounded-full bg-[#161A24] border border-[#252A37] px-2.5 py-0.5 text-[10px] tabular-nums font-semibold text-[#E5E7EB]">
              {essayCount} câu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <NumberStepper
              value={parseFloat(essayInput) || 0}
              onChange={(val) => handleEssayChange(String(val))}
              min={0}
              max={100}
              step={0.25}
              disabled={essayCount === 0}
              className="w-full justify-between"
            />
            <span className="shrink-0 text-xs tabular-nums font-medium text-[#8B93A5]">đ/câu</span>
          </div>

          {/* Quick Essay Presets */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-[#8B93A5]">Chọn nhanh:</span>
            {[1.0, 2.0, 3.0, 5.0].map((val) => (
              <button
                key={val}
                type="button"
                disabled={essayCount === 0}
                onClick={() => handleEssayChange(String(val))}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] tabular-nums font-semibold transition disabled:opacity-40 cursor-pointer ${
                  parseFloat(essayInput) === val
                    ? "border-transparent bg-white text-black"
                    : "border-[#252A37] bg-[#161A24] text-slate-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {val}đ
              </button>
            ))}
          </div>
        </div>

        {/* 3. Total Exam Score Display */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#252A37] bg-[#141824] p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Calculator className="h-3.5 w-3.5 text-white" />
              <span>Tổng điểm toàn bài</span>
            </span>
            <span className="rounded-full border border-[#2A2F3C] bg-[#232836] px-2.5 py-0.5 text-[10px] font-bold text-white">
              Tự động tính
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-1.5 tabular-nums">
            <span className="text-3xl font-black tracking-tight text-white">
              {formattedTotal}
            </span>
            <span className="text-xs font-semibold text-[#8B93A5]">điểm</span>
          </div>

          <div className="border-t border-[#252A37] pt-2 text-[11px] text-[#9CA3AF] tabular-nums">
            <span>Trắc nghiệm: </span>
            <strong className="text-white">{formattedMcqTotal}đ</strong>
            <span className="mx-1.5 text-[#252A37]">•</span>
            <span>Tự luận: </span>
            <strong className="text-white">{formattedEssayTotal}đ</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
