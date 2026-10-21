"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
};

export default function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  disabled = false,
  className,
}: Props) {
  const clamp = (n: number) => {
    const stepDecimals = step.toString().split(".")[1]?.length || 0;
    const rounded = Number(n.toFixed(stepDecimals));
    return Math.min(max, Math.max(min, rounded));
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-white/10 bg-[#111827] p-1 shadow-inner ${
        disabled ? "opacity-40 pointer-events-none" : ""
      } ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={disabled || value <= min}
        aria-label="Giảm"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition
                   hover:bg-indigo-500/20 hover:text-indigo-300 active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
      >
        <Minus size={16} />
      </button>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") return;
          onChange(clamp(Number(val)));
        }}
        onBlur={() => {
          if (!value || value < min) onChange(min);
        }}
        className="w-14 bg-transparent text-center text-base font-semibold text-white outline-none
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={disabled || value >= max}
        aria-label="Tăng"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition
                   hover:bg-indigo-500/20 hover:text-indigo-300 active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export { NumberStepper };
