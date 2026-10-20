"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PopoverSelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface PopoverSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: PopoverSelectOption<T>[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function PopoverSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className,
  buttonClassName,
  menuClassName,
  align = "left",
  icon,
  disabled = false,
}: PopoverSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
          isOpen
            ? "bg-[#111827] border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)] ring-1 ring-white/20"
            : "bg-[#111827] border-[#1f2937] text-slate-200 hover:border-[#374151] hover:text-white",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon ? icon : selectedOption?.icon}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {selectedOption?.badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-slate-300 font-bold">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[#9ca3af] transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-white"
            )}
          />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full mt-2 z-50 rounded-2xl border border-[#1f2937] bg-[#0b0f19]/95 backdrop-blur-xl p-1.5 shadow-2xl space-y-1 min-w-[200px] max-h-72 overflow-y-auto custom-scrollbar",
              align === "right" ? "right-0" : "left-0",
              menuClassName
            )}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all duration-150 cursor-pointer group",
                    isSelected
                      ? "bg-white/[0.08] border-white/[0.2] text-white font-bold shadow-sm"
                      : "border-transparent bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#1f2937] text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {opt.icon && (
                      <div className="shrink-0 text-slate-400 group-hover:text-white">
                        {opt.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={cn("truncate", isSelected && "text-white")}>
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p className="text-[10px] text-[#9ca3af] font-normal truncate mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {opt.badge !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
