"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
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
        <label className="block text-xs font-medium text-slate-300">
          {label}
        </label>
        {showModeSwitch && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "dropdown" ? "cards" : "dropdown")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition cursor-pointer"
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

      {/* VIEW MODE 1: CUSTOM CYBER DROPDOWN */}
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
              "border bg-[#161c28]/90 backdrop-blur-md",
              isPublished
                ? "border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                : "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.06)]",
              isOpen && "ring-2 ring-cyan-500/20 border-cyan-500/50"
            )}
          >
            {/* Left side: Status dot + Icon + Text */}
            <div className="flex items-center gap-2.5 min-w-0">
              {isPublished ? (
                <>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                  </span>
                  <Globe className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="truncate text-white font-semibold">
                    Đang mở thi (Đã xuất bản)
                  </span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  </span>
                  <Lock className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="truncate text-white font-semibold">
                    Đóng thi (Bản nháp)
                  </span>
                </>
              )}
            </div>

            {/* Right side: Badge + Chevron */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  isPublished
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                )}
              >
                {isPublished ? "Công khai" : "Bản nháp"}
              </span>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-white",
                  isOpen && "rotate-180 text-cyan-400"
                )}
              />
            </div>
          </button>

          {/* Floating Cyber Popover Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 right-0 top-full mt-1.5 z-40 overflow-hidden rounded-2xl border border-white/15 bg-[#141829]/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/80 space-y-1"
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
                      ? "bg-emerald-950/40 border border-emerald-500/40 text-white shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                      : "hover:bg-white/[0.04] border border-transparent text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                        isPublished
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          : "bg-white/5 border-white/10 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30"
                      )}
                    >
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          Đang mở thi (Đã xuất bản)
                        </span>
                        {isPublished && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        User nhìn thấy đề thi và có thể vào làm bài ngay
                      </p>
                    </div>
                  </div>

                  {isPublished && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 ml-2">
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
                      ? "bg-amber-950/40 border border-amber-500/40 text-white shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                      : "hover:bg-white/[0.04] border border-transparent text-slate-300 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                        !isPublished
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                          : "bg-white/5 border-white/10 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30"
                      )}
                    >
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          Đóng thi (Bản nháp)
                        </span>
                        {!isPublished && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Tạm ẩn với user, chỉ Quản trị viên mới thấy
                      </p>
                    </div>
                  </div>

                  {!isPublished && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 ml-2">
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
                ? "bg-emerald-950/30 border-emerald-500/60 shadow-[0_0_16px_rgba(16,185,129,0.15)] text-white"
                : "bg-[#161c28]/70 border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                  isPublished
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    : "bg-white/5 border-white/10 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30"
                )}
              >
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">Đang mở thi</span>
                  {isPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">Vào thi ngay</p>
              </div>
            </div>

            {isPublished ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0 ml-2" />
            )}
          </button>

          {/* Card 2: Draft */}
          <button
            type="button"
            onClick={() => onChange("draft")}
            className={cn(
              "group relative flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none",
              !isPublished
                ? "bg-amber-950/30 border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.15)] text-white"
                : "bg-[#161c28]/70 border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 hover:bg-[#161c28]"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                  !isPublished
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 border-white/10 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30"
                )}
              >
                <Lock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold truncate">Đóng thi (Bản nháp)</span>
                  {!isPublished && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate">Chỉ Admin thấy</p>
              </div>
            </div>

            {!isPublished ? (
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 ml-2" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0 ml-2" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
