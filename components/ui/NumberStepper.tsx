"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  suffix?: string;
};

export default function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  disabled = false,
  className,
  suffix,
}: Props) {
  const [textVal, setTextVal] = useState<string>(
    value !== undefined && value !== null ? String(value) : String(min)
  );
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current && value !== undefined && value !== null) {
      setTextVal(String(value));
    }
  }, [value]);

  const clamp = (n: number) => {
    const stepDecimals = step.toString().split(".")[1]?.length || 0;
    const rounded = Number(n.toFixed(stepDecimals));
    return Math.min(max, Math.max(min, rounded));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Cho phép xóa hết để nhập số mới mà không bị kẹt hay tự nhảy số cũ
    if (raw === "") {
      setTextVal("");
      return;
    }
    // Chỉ nhận ký tự số
    if (!/^\d*$/.test(raw)) return;

    setTextVal(raw);
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    if (textVal === "" || isNaN(Number(textVal))) {
      const fallback = Math.max(min, 1);
      setTextVal(String(fallback));
      onChange(fallback);
    } else {
      const clamped = clamp(Number(textVal));
      setTextVal(String(clamped));
      onChange(clamped);
    }
  };

  const handleStep = (delta: number) => {
    const current = textVal === "" ? min : Number(textVal);
    const validCurrent = isNaN(current) ? min : current;
    const next = clamp(validCurrent + delta);
    setTextVal(String(next));
    onChange(next);
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-[#252A37] bg-[#10131B] p-1 shadow-inner transition-colors focus-within:border-white/40 ${
        disabled ? "opacity-40 pointer-events-none" : ""
      } ${className || ""}`}
    >
      <button
        type="button"
        onClick={() => handleStep(-step)}
        disabled={disabled || (textVal !== "" && Number(textVal) <= min)}
        aria-label="Giảm"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B93A5] transition
                   hover:bg-white/10 hover:text-white active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer shrink-0"
      >
        <Minus size={13} />
      </button>

      <div className="flex flex-1 items-center justify-center gap-1.5 px-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={textVal}
          disabled={disabled}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-12 bg-transparent text-center text-xs font-semibold tabular-nums text-white outline-none
                     [appearance:textfield]
                     [&::-webkit-inner-spin-button]:appearance-none
                     [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && (
          <span className="text-[11px] font-medium text-slate-400 select-none">
            {suffix}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => handleStep(step)}
        disabled={disabled || (textVal !== "" && Number(textVal) >= max)}
        aria-label="Tăng"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B93A5] transition
                   hover:bg-white/10 hover:text-white active:scale-90
                   disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer shrink-0"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export { NumberStepper };
