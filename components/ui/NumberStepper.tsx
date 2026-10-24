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
      className={`inline-flex items-center rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#14161D] p-1 shadow-xs ${
        disabled ? "opacity-40 pointer-events-none" : ""
      } ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={disabled || value <= min}
        aria-label="Giảm"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition
                   hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-[#111827] dark:hover:text-white active:scale-90
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
        className="w-14 bg-transparent text-center text-base font-semibold font-mono tabular-nums text-[#111827] dark:text-white outline-none
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={disabled || value >= max}
        aria-label="Tăng"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition
                   hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-[#111827] dark:hover:text-white active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export { NumberStepper };
