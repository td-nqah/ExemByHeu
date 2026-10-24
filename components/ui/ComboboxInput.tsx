"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxSuggestion {
  id?: string;
  title: string;
  subtitle?: string;
}

export interface ComboboxInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: (ComboboxSuggestion | string)[];
  placeholder?: string;
  categoryLabel?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
}

export function ComboboxInput({
  value,
  onChange,
  suggestions,
  placeholder = "Nhập hoặc chọn từ danh sách...",
  categoryLabel = "Học liệu / Đề thi có sẵn",
  required = false,
  className,
  inputClassName,
  disabled = false,
  name,
  id,
}: ComboboxInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize suggestions list
  const normalizedSuggestions: ComboboxSuggestion[] = useMemo(() => {
    return suggestions.map((item) => {
      if (typeof item === "string") {
        return { title: item };
      }
      return item;
    });
  }, [suggestions]);

  // Filter suggestions based on input value
  const filteredSuggestions = useMemo(() => {
    const trimmed = (value || "").trim().toLowerCase();
    if (!trimmed) {
      return normalizedSuggestions;
    }
    return normalizedSuggestions.filter((item) =>
      item.title.toLowerCase().includes(trimmed)
    );
  }, [normalizedSuggestions, value]);

  // Close when clicking outside
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

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (item: ComboboxSuggestion) => {
    onChange(item.title);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          required={required}
          disabled={disabled}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (normalizedSuggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full px-3.5 py-2.5 pr-9 bg-white dark:bg-[#14161D] border border-black/[0.08] dark:border-white/[0.1] hover:border-black/[0.15] dark:hover:border-white/20 focus:border-[#111827] dark:focus:border-white/40 rounded-xl text-xs text-[#111827] dark:text-white placeholder-[#A4A7B0] dark:placeholder-[#6B7280] focus:outline-none transition-all shadow-xs",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            isOpen && "border-[#111827] ring-1 ring-[#111827]/15 dark:border-white dark:ring-white/20",
            inputClassName
          )}
        />

        {/* Dropdown toggle button */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || normalizedSuggestions.length === 0}
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) {
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2.5 inset-y-0 flex items-center text-[#6B7280] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Danh sách gợi ý"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180 text-[#111827] dark:text-white"
            )}
          />
        </button>
      </div>

      {/* Styled Popover Suggestions Menu */}
      <AnimatePresence>
        {isOpen && normalizedSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white/98 dark:bg-[#14161D]/98 backdrop-blur-2xl p-1.5 shadow-2xl max-h-56 overflow-y-auto custom-scrollbar text-[#111827] dark:text-white"
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
              <span>{categoryLabel} ({filteredSuggestions.length})</span>
              <span className="font-mono text-[9px] text-[#6B7280] dark:text-slate-400 lowercase">
                Gõ để lọc hoặc chọn
              </span>
            </div>

            <div className="py-1 space-y-0.5">
              {filteredSuggestions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  Không tìm thấy bài thi trùng khớp.
                  <span className="block text-[10px] text-[#9CA3AF] mt-0.5">
                    Tên mới &quot;{value}&quot; sẽ được tạo.
                  </span>
                </div>
              ) : (
                filteredSuggestions.map((item, idx) => {
                  const isSelected =
                    (item.title || "").trim().toLowerCase() ===
                    (value || "").trim().toLowerCase();

                  return (
                    <button
                      key={item.id || `${item.title}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent input blur before click registers
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      className={cn(
                        "w-full px-2.5 py-2 rounded-lg text-left transition-all duration-150 flex items-center justify-between gap-2 group cursor-pointer border",
                        isSelected
                          ? "bg-[#111827] text-white dark:bg-white dark:text-[#0A0B0E] font-semibold shadow-xs border-black/80 dark:border-white"
                          : "border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.06] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isSelected ? "text-white dark:text-[#0A0B0E]" : "text-[#6B7280] dark:text-[#9CA3AF] group-hover:text-[#111827] dark:group-hover:text-white"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-xs truncate font-medium">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="shrink-0 h-4 w-4 rounded-full bg-white text-[#111827] dark:bg-[#0A0B0E] dark:text-white border border-black/20 dark:border-white/40 flex items-center justify-center ml-2">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
