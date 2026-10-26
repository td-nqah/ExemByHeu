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
      className={`inline-flex items-center rounded-full border border-[#252A37] bg-[#10131B] p-1 shadow-inner ${
        disabled ? "opacity-40 pointer-events-none" : ""
      } ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={disabled || value <= min}
        aria-label="Giảm"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B93A5] transition
                   hover:bg-white/10 hover:text-white active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
      >
        <Minus size={14} />
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
        className="w-14 bg-transparent text-center text-xs font-semibold tabular-nums text-white outline-none
                   [appearance:textfield]
                   [&::-webkit-inner-spin-button]:appearance-none
                   [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={disabled || value >= max}
        aria-label="Tăng"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B93A5] transition
                   hover:bg-white/10 hover:text-white active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export { NumberStepper };
