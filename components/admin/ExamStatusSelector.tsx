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
  defaultViewMode = "dropdown",
  label = "Trạng thái đề thi",
  showModeSwitch = true,
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
        <label className="block text-xs font-semibold text-[#1F2128]">
          {label}
        </label>
        {showModeSwitch && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "dropdown" ? "cards" : "dropdown")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-[#7A7D88] hover:text-[#D9482B] hover:bg-black/[0.04] transition cursor-pointer"
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

      {/* VIEW MODE 1: CUSTOM LIGHT DROPDOWN */}
      {viewMode === "dropdown" ? (
        <div ref={dropdownRef} className="relative">
          {/* Dropdown Trigger Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              "group relative flex h-10 w-full items-center justify-between rounded-xl px-3.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer select-none",
              "border bg-white",
              isPublished
                ? "border-emerald-500/30 hover:border-emerald-500/60 shadow-xs"
                : "border-amber-500/30 hover:border-amber-500/60 shadow-xs",
              isOpen && "ring-2 ring-[#D9482B]/20 border-[#D9482B]/50"
            )}
          >
            {/* Left side: Status dot + Icon + Text */}
            <div className="flex items-center gap-2.5 min-w-0">
              {isPublished ? (
                <>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2E9E5B]" />
                  </span>
                  <LockOpen className="h-4 w-4 shrink-0 text-[#2E9E5B]" />
                  <span className="truncate text-[#1F2128] font-semibold">
                    Đã xuất bản
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B8962E]" />
                  </span>
                  <Lock className="h-4 w-4 shrink-0 text-[#B8962E]" />
                  <span className="truncate text-[#1F2128] font-semibold">
                    Bản nháp
                  </span>
                </>
              )}
            </div>

            {/* Right side: Badge + Chevron */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-mono",
                  isPublished
                    ? "bg-[#DDF2E5] text-[#2E9E5B] border-emerald-500/20"
                    : "bg-[#F6EBC8] text-[#B8962E] border-amber-500/20"
                )}
              >
                {isPublished ? "Đã xuất bản" : "Bản nháp"}
              </span>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[#7A7D88] transition-transform duration-200 group-hover:text-[#1F2128]",
                  isOpen && "rotate-180 text-[#D9482B]"
                )}
              />
            </div>
          </button>

          {/* Floating Light Popover Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 right-0 top-full mt-1.5 z-40 overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 backdrop-blur-xl p-1.5 shadow-[0_8px_24px_rgba(20,20,40,0.08)] space-y-1"
              >
                {/* Option 1: Published */}
                <button
                  type="button"
                  onClick={() => {
                    onChange("published");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group",
                    isPublished
                      ? "bg-[#DDF2E5]/50 border border-emerald-500/30 text-[#1F2128]"
                      : "hover:bg-black/[0.03] border border-transparent text-[#7A7D88] hover:text-[#1F2128]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                        isPublished
                          ? "bg-[#DDF2E5] border-emerald-500/30 text-[#2E9E5B]"
                          : "bg-black/[0.03] border-black/[0.06] text-[#7A7D88] group-hover:text-[#2E9E5B] group-hover:border-emerald-500/30"
                      )}
                    >
                      <LockOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          Đã xuất bản
                        </span>
                        {isPublished && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#2E9E5B] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A7D88] truncate mt-0.5">
                        User nhìn thấy đề thi và có thể vào làm bài ngay
                      </p>
                    </div>
                  </div>

                  {isPublished && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DDF2E5] border border-emerald-500/30 text-[#2E9E5B] ml-2">
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
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group",
                    !isPublished
                      ? "bg-[#F6EBC8]/50 border border-amber-500/30 text-[#1F2128]"
                      : "hover:bg-black/[0.03] border border-transparent text-[#7A7D88] hover:text-[#1F2128]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                        !isPublished
                          ? "bg-[#F6EBC8] border-amber-500/30 text-[#B8962E]"
                          : "bg-black/[0.03] border-black/[0.06] text-[#7A7D88] group-hover:text-[#B8962E] group-hover:border-amber-500/30"
                      )}
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          Bản nháp
                        </span>
                        {!isPublished && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#B8962E]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A7D88] truncate mt-0.5">
                        Tạm ẩn với user, chỉ Quản trị viên mới thấy
                      </p>
                    </div>
                  </div>

                  {!isPublished && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F6EBC8] border border-amber-500/30 text-[#B8962E] ml-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Card 1: Published */}
          <button
            type="button"
            onClick={() => onChange("published")}
            className={cn(
              "group relative flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none",
              isPublished
                ? "bg-white border-emerald-500/50 shadow-xs text-[#1F2128]"
                : "bg-[#F6F6F8] border-black/[0.06] hover:border-black/[0.12] text-[#7A7D88] hover:text-[#1F2128] hover:bg-white"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                  isPublished
                    ? "bg-[#DDF2E5] border-emerald-500/30 text-[#2E9E5B]"
                    : "bg-white border-black/[0.06] text-[#7A7D88] group-hover:text-[#2E9E5B]"
                )}
              >
                <LockOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">Đã xuất bản</span>
                  {isPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2E9E5B] animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-[#7A7D88] truncate">Vào thi ngay</p>
              </div>
            </div>

            {isPublished ? (
              <CheckCircle2 className="h-4 w-4 text-[#2E9E5B] shrink-0 ml-2" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0 ml-2" />
            )}
          </button>

          {/* Card 2: Draft */}
          <button
            type="button"
            onClick={() => onChange("draft")}
            className={cn(
              "group relative flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none",
              !isPublished
                ? "bg-white border-amber-500/50 shadow-xs text-[#1F2128]"
                : "bg-[#F6F6F8] border-black/[0.06] hover:border-black/[0.12] text-[#7A7D88] hover:text-[#1F2128] hover:bg-white"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                  !isPublished
                    ? "bg-[#F6EBC8] border-amber-500/30 text-[#B8962E]"
                    : "bg-white border-black/[0.06] text-[#7A7D88] group-hover:text-[#B8962E]"
                )}
              >
                <Lock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">Bản nháp</span>
                  {!isPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B8962E]" />
                  )}
                </div>
                <p className="text-[10px] text-[#7A7D88] truncate">Chỉ Admin thấy</p>
              </div>
            </div>

            {!isPublished ? (
              <CheckCircle2 className="h-4 w-4 text-[#B8962E] shrink-0 ml-2" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0 ml-2" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
