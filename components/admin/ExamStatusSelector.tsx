"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LockOpen,
  Lock,
  ChevronDown,
  Check,
  CheckCircle2,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamStatusSelectorProps {
  value: "published" | "draft";
  onChange: (value: "published" | "draft") => void;
  className?: string;
  defaultViewMode?: "dropdown" | "cards";
  label?: string;
  showModeSwitch?: boolean;
}

export function ExamStatusSelector({
  value,
  onChange,
  className,
  defaultViewMode = "cards",
  label = "Trạng thái đề thi",
  showModeSwitch = false,
}: ExamStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"dropdown" | "cards">(defaultViewMode);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const isPublished = value === "published";

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label & View Mode Switcher Header */}
      <div className="flex items-center justify-between">
        <label className="mb-1.5 block text-xs font-medium text-slate-300">
          {label}
        </label>
        {showModeSwitch && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "dropdown" ? "cards" : "dropdown")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] text-[#9CA3AF] hover:text-white bg-[#10131B] border border-[#252A37] transition cursor-pointer"
              title={viewMode === "dropdown" ? "Chuyển sang dạng Thẻ chọn nhanh" : "Chuyển sang dạng Menu thả xuống"}
            >
              {viewMode === "dropdown" ? (
                <>
                  <LayoutGrid className="h-3 w-3" />
                  <span>Dạng Thẻ</span>
                </>
              ) : (
                <>
                  <Menu className="h-3 w-3" />
                  <span>Dạng Menu</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE 1: CUSTOM DROPDOWN */}
      {viewMode === "dropdown" ? (
        <div ref={dropdownRef} className="relative">
          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              "group relative flex h-10 w-full items-center justify-between rounded-full px-4 text-xs font-semibold transition-all duration-200 cursor-pointer select-none border",
              "bg-[#10131B] border-[#252A37] text-white hover:border-white/30",
              isOpen && "ring-1 ring-white/30 border-white/50"
            )}
          >
            {/* Left side: Status dot + Icon + Text */}
            <div className="flex items-center gap-2.5 min-w-0">
              {isPublished ? (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <LockOpen className="h-4 w-4 shrink-0 text-white" />
                  <span className="truncate text-white font-semibold">
                    Đã xuất bản
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <Lock className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                  <span className="truncate text-white font-semibold">
                    Bản nháp
                  </span>
                </>
              )}
            </div>

            {/* Right side: Badge + Chevron */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-heading font-bold uppercase tracking-wider border",
                  isPublished
                    ? "bg-[#232836] text-[#E5E7EB] border-[#2A2F3C]"
                    : "bg-[#161A24] text-[#9CA3AF] border-[#252A37]"
                )}
              >
                {isPublished ? "Đã xuất bản" : "Bản nháp"}
              </span>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#8B93A5] transition-transform duration-200 group-hover:text-white",
                  isOpen && "rotate-180 text-white"
                )}
              />
            </div>
          </button>

          {/* Floating Popover Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 right-0 top-full mt-2 z-40 overflow-hidden rounded-3xl border border-[#252A37] bg-[#0A0C12] p-2 shadow-2xl space-y-1.5"
              >
                {/* Option 1: Published */}
                <button
                  type="button"
                  onClick={() => {
                    onChange("published");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer group border",
                    isPublished
                      ? "bg-white text-black border-transparent shadow-sm"
                      : "hover:bg-[#161A24] border-transparent text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all",
                        isPublished
                          ? "bg-black/10 border-transparent text-black"
                          : "bg-[#10131B] border-[#252A37] text-white"
                      )}
                    >
                      <LockOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold truncate", isPublished ? "text-black" : "text-white")}>
                          Đã xuất bản
                        </span>
                        {isPublished && (
                          <span className="h-1.5 w-1.5 rounded-full bg-black" />
                        )}
                      </div>
                      <p className={cn("text-[10px] truncate mt-0.5", isPublished ? "text-slate-600" : "text-[#9CA3AF]")}>
                        User nhìn thấy đề thi và có thể vào làm bài ngay
                      </p>
                    </div>
                  </div>

                  {isPublished && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/10 text-black ml-2">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Option 2: Draft */}
                <button
                  type="button"
                  onClick={() => {
                    onChange("draft");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer group border",
                    !isPublished
                      ? "bg-white text-black border-transparent shadow-sm"
                      : "hover:bg-[#161A24] border-transparent text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all",
                        !isPublished
                          ? "bg-black/10 border-transparent text-black"
                          : "bg-[#10131B] border-[#252A37] text-white"
                      )}
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold truncate", !isPublished ? "text-black" : "text-white")}>
                          Bản nháp
                        </span>
                        {!isPublished && (
                          <span className="h-1.5 w-1.5 rounded-full bg-black" />
                        )}
                      </div>
                      <p className={cn("text-[10px] truncate mt-0.5", !isPublished ? "text-slate-600" : "text-[#9CA3AF]")}>
                        Tạm ẩn với user, chỉ Quản trị viên mới thấy
                      </p>
                    </div>
                  </div>

                  {!isPublished && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/10 text-black ml-2">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* VIEW MODE 2: DUAL SEGMENTED CARDS */
        <div className="grid grid-cols-2 gap-2">
          {/* Card 1: Published */}
          <button
            type="button"
            onClick={() => onChange("published")}
            className={cn(
              "group relative flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none h-[50px]",
              isPublished
                ? "bg-[#232836] border-white/40 text-white shadow-sm ring-1 ring-white/20"
                : "bg-[#10131B] border-[#252A37] text-[#9CA3AF] hover:text-white hover:border-white/30"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                  isPublished
                    ? "bg-[#161A24] border-white/20 text-white"
                    : "bg-[#10131B] border-[#252A37] text-[#8B93A5]"
                )}
              >
                <LockOpen className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate text-white">Đã xuất bản</span>
                  {isPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-[#9CA3AF] truncate">Vào thi ngay</p>
              </div>
            </div>

            {isPublished ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-1.5" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-[#252A37] shrink-0 ml-1.5" />
            )}
          </button>

          {/* Card 2: Draft */}
          <button
            type="button"
            onClick={() => onChange("draft")}
            className={cn(
              "group relative flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none h-[50px]",
              !isPublished
                ? "bg-[#232836] border-white/40 text-white shadow-sm ring-1 ring-white/20"
                : "bg-[#10131B] border-[#252A37] text-[#9CA3AF] hover:text-white hover:border-white/30"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                  !isPublished
                    ? "bg-[#161A24] border-white/20 text-white"
                    : "bg-[#10131B] border-[#252A37] text-[#8B93A5]"
                )}
              >
                <Lock className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate text-white">Bản nháp</span>
                  {!isPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-[#9CA3AF] truncate">Chỉ Admin thấy</p>
              </div>
            </div>

            {!isPublished ? (
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 ml-1.5" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-[#252A37] shrink-0 ml-1.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
