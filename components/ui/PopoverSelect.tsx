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
          "flex items-center justify-between gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer select-none",
          isOpen
            ? "bg-[#161A24] border-white/50 text-white shadow-md"
            : "bg-[#10131B] border-[#252A37] text-slate-200 hover:border-white/30 hover:text-white",
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
            <span className="px-1.5 py-0.5 rounded-full bg-[#161A24] border border-[#252A37] text-[10px] tabular-nums text-[#E5E7EB]">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[#8B93A5] transition-transform duration-200 shrink-0",
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
              "absolute top-full mt-2 z-50 rounded-3xl border border-[#252A37] bg-[#0A0C12] p-2 shadow-2xl space-y-1 min-w-[200px] max-h-72 overflow-y-auto custom-scrollbar",
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
                    "w-full flex items-center justify-between p-2.5 rounded-2xl border text-xs text-left transition-all duration-150 cursor-pointer group",
                    isSelected
                      ? "bg-white text-black font-bold border-transparent shadow-sm"
                      : "border-transparent bg-transparent hover:bg-[#161A24] text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {opt.icon && (
                      <div className={cn("shrink-0", isSelected ? "text-black" : "text-[#8B93A5] group-hover:text-white")}>
                        {opt.icon}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={cn("truncate font-medium", isSelected ? "text-black font-bold" : "text-white")}>
                        {opt.label}
                      </p>
                      {opt.description && (
                        <p className={cn("text-[10px] font-normal truncate mt-0.5", isSelected ? "text-slate-600" : "text-[#9CA3AF]")}>
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {opt.badge !== undefined && (
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] tabular-nums",
                        isSelected ? "bg-black/10 text-black font-bold" : "bg-[#10131B] border border-[#252A37] text-slate-300"
                      )}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
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
