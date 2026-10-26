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
            "w-full px-4 py-2.5 pr-10 bg-[#10131B] border border-[#252A37] hover:border-white/20 focus:border-white/50 rounded-full text-xs text-white placeholder-[#8B93A5] focus:outline-none transition-colors",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            isOpen && "border-white/50 ring-1 ring-white/30",
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
          className="absolute right-3.5 inset-y-0 flex items-center text-[#8B93A5] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Danh sách gợi ý"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180 text-white"
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
            className="absolute left-0 right-0 top-full mt-2 z-50 rounded-3xl border border-[#252A37] bg-[#0A0C12] p-2 shadow-2xl max-h-56 overflow-y-auto custom-scrollbar"
          >
            <div className="px-3 py-1 text-[10px] font-mono font-bold text-[#8B93A5] uppercase tracking-wider border-b border-[#1B1F2A] flex items-center justify-between pb-1.5">
              <span>Đề thi có sẵn ({filteredSuggestions.length})</span>
              <span className="font-mono text-[9px] text-[#8B93A5] lowercase">
                Gõ để lọc hoặc chọn
              </span>
            </div>

            <div className="py-1 space-y-1">
              {filteredSuggestions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-[#9CA3AF]">
                  Không tìm thấy bài thi trùng khớp.
                  <span className="block text-[10px] text-[#8B93A5] mt-0.5">
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
                        e.preventDefault();
                        handleSelect(item);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-2xl text-left transition-all duration-150 flex items-center justify-between gap-2 group cursor-pointer border",
                        isSelected
                          ? "bg-white text-black font-semibold shadow-sm border-transparent"
                          : "border-transparent bg-transparent hover:bg-[#161A24] text-slate-300 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isSelected
                              ? "text-black"
                              : "text-[#8B93A5] group-hover:text-white"
                          )}
                        />
                        <div className="min-w-0">
                          <p className={cn("text-xs truncate font-medium", isSelected ? "text-black font-bold" : "text-white")}>
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className={cn("text-[10px] truncate mt-0.5", isSelected ? "text-slate-600" : "text-[#9CA3AF]")}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="shrink-0 h-4 w-4 rounded-full bg-black/10 flex items-center justify-center text-black ml-2">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
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
