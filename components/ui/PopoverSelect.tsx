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
            ? "bg-white border-[#111827] text-[#111827] shadow-xs ring-1 ring-[#111827]/20"
            : "bg-white border-black/[0.08] text-[#111827] hover:border-black/[0.15] shadow-xs",
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
            <span className="px-1.5 py-0.5 rounded-md bg-black/[0.05] text-[10px] font-mono text-[#6B7280] font-bold">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[#6B7280] transition-transform duration-200 shrink-0",
              isOpen && "rotate-180 text-[#111827]"
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
              "absolute top-full mt-2 z-50 rounded-2xl border border-black/[0.08] bg-white/98 backdrop-blur-xl p-1.5 shadow-2xl space-y-1 min-w-[200px] max-h-72 overflow-y-auto custom-scrollbar rounded-2xl text-[#111827]",
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
                      ? "glass-chip-active text-[#111827] font-bold shadow-xs"
                      : "border-transparent bg-transparent hover:bg-black/[0.03] hover:border-black/[0.06] text-[#6B7280] hover:text-[#111827]"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {opt.icon && (
                      <div className="shrink-0 text-[#6B7280] group-hover:text-[#111827]">
                        {opt.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={cn("truncate", isSelected && "text-[#111827]")}>
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p className="text-[10px] text-[#6B7280] font-normal truncate mt-0.5">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {opt.badge !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/[0.04] border border-black/[0.06] text-[#6B7280]">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-[#111827] shrink-0" />
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
