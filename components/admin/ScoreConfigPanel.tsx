"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  HelpCircle,
  FileText,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { PopoverSelect } from "@/components/ui/PopoverSelect";
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
  onApplyAutoScale: (
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
  onApplyAutoScale,
}: ScoreConfigPanelProps) {
  const [mcqInput, setMcqInput] = useState<string>(String(initialMcqScore));
  const [essayInput, setEssayInput] = useState<string>(String(initialEssayScore));
  const [desiredTotalInput, setDesiredTotalInput] = useState<string>("10");
  const [scaleMode, setScaleMode] = useState<"proportional" | "fix_essay_split_mcq">(
    "proportional"
  );
  const [autoAppliedToast, setAutoAppliedToast] = useState<string>("");

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

  const handleTriggerAutoAllocate = () => {
    const target = parseFloat(desiredTotalInput);
    if (isNaN(target) || target <= 0) {
      alert("Vui lòng nhập Tổng điểm mong muốn hợp lệ (lớn hơn 0).");
      return;
    }

    const { newMcqScore, newEssayScore } = onApplyAutoScale(target, scaleMode);
    if (mcqCount > 0) setMcqInput(String(newMcqScore));
    if (essayCount > 0) setEssayInput(String(newEssayScore));

    setAutoAppliedToast(`Đã tự động phân bổ theo thang ${target} điểm`);
    setTimeout(() => setAutoAppliedToast(""), 3000);
  };

  const formattedTotal = Math.round(currentTotalScore * 100) / 100;
  const formattedMcqTotal = Math.round(currentMcqTotal * 100) / 100;
  const formattedEssayTotal = Math.round(currentEssayTotal * 100) / 100;

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Cấu hình & Tự động Phân bổ Điểm số
            </h3>
            <p className="text-xs text-slate-400">
              Thiết lập điểm số hàng loạt cho câu hỏi trắc nghiệm, tự luận hoặc quy đổi tự động theo thang điểm mong muốn.
            </p>
          </div>
        </div>

        {autoAppliedToast && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{autoAppliedToast}</span>
          </span>
        )}
      </div>

      {/* Row 1: Per-Question Score Inputs + Live Total Exam Score */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 1. MCQ Point per Question */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white">
              <HelpCircle className="h-3.5 w-3.5 text-white" />
              <span>Điểm mỗi câu trắc nghiệm</span>
            </label>
            <span className="rounded-md bg-slate-800 border border-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
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
            <span className="shrink-0 text-xs font-medium text-slate-400">điểm/câu</span>
          </div>

          {/* Quick MCQ Presets */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
            {[0.2, 0.25, 0.5, 1.0].map((val) => (
              <button
                key={val}
                type="button"
                disabled={mcqCount === 0}
                onClick={() => handleMcqChange(String(val))}
                className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-40 ${
                  parseFloat(mcqInput) === val
                    ? "border-white bg-white text-zinc-950 font-bold"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                {val}đ
              </button>
            ))}
          </div>
        </div>

        {/* 2. Essay Point per Question */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-white">
              <FileText className="h-3.5 w-3.5 text-white" />
              <span>Điểm mỗi câu tự luận</span>
            </label>
            <span className="rounded-md bg-slate-800 border border-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
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
            <span className="shrink-0 text-xs font-medium text-slate-400">điểm/câu</span>
          </div>

          {/* Quick Essay Presets */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
            {[1.0, 2.0, 3.0, 5.0].map((val) => (
              <button
                key={val}
                type="button"
                disabled={essayCount === 0}
                onClick={() => handleEssayChange(String(val))}
                className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-40 ${
                  parseFloat(essayInput) === val
                    ? "border-white bg-white text-zinc-950 font-bold"
                    : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                {val}đ
              </button>
            ))}
          </div>
        </div>

        {/* 3. Total Exam Score Display */}
        <div className="flex flex-col justify-between rounded-xl border border-white/20 bg-white/[0.06] p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Calculator className="h-3.5 w-3.5 text-white" />
              <span>Tổng điểm toàn bài</span>
            </span>
            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
              Tự động tính
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-white">
              {formattedTotal}
            </span>
            <span className="text-xs font-semibold text-zinc-400">điểm</span>
          </div>

          <div className="border-t border-white/10 pt-2 text-[11px] text-slate-300">
            <span>Trắc nghiệm: </span>
            <strong className="text-white">{formattedMcqTotal}đ</strong>
            <span className="mx-1.5 text-slate-500">•</span>
            <span>Tự luận: </span>
            <strong className="text-white">{formattedEssayTotal}đ</strong>
          </div>
        </div>
      </div>

      {/* Row 2: Auto-Calculate / Scale Score Bar */}
      <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 lg:flex-row lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-xs font-bold text-white">
              Quy đổi / Tự động chia điểm:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300">Tổng điểm mong muốn:</label>
            <NumberStepper
              value={parseInt(desiredTotalInput) || 10}
              onChange={(val) => setDesiredTotalInput(String(val))}
              min={1}
              max={1000}
              step={1}
            />
            <div className="flex items-center gap-1">
              {[10, 20, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDesiredTotalInput(String(preset))}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                    parseFloat(desiredTotalInput) === preset
                      ? "border-white bg-white text-zinc-950 font-bold"
                      : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  Thang {preset}
                </button>
              ))}
            </div>
          </div>

          {mcqCount > 0 && essayCount > 0 && (
            <PopoverSelect<"proportional" | "fix_essay_split_mcq">
              className="w-full"
              buttonClassName="w-full h-9"
              menuClassName="w-full"
              value={scaleMode}
              onChange={(val) => setScaleMode(val)}
              options={[
                {
                  value: "proportional",
                  label: "Chia theo tỷ lệ điểm hiện tại",
                },
                {
                  value: "fix_essay_split_mcq",
                  label: "Giữ điểm Tự luận, chia đều phần còn lại cho Trắc nghiệm",
                },
              ]}
            />
          )}
        </div>

        <button
          type="button"
          onClick={handleTriggerAutoAllocate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-950 shadow-sm transition active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Tự động phân bổ điểm</span>
        </button>
      </div>
    </div>
  );
}
