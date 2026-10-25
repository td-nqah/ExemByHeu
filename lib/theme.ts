"use client";

import { getCurrentUser } from "./store";

export type SystemTheme = "obsidian" | "navy-blue" | "clean-white";

export interface ThemeDefinition {
  id: SystemTheme;
  name: string;
  subtitle: string;
  badge?: string;
  previewColors: string[];
  gradientPreview: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    subtitle: "Tím bóng tối Cyber Linear (Mặc định)",
    badge: "Mặc định",
    previewColors: ["#0b0f19", "#1c1641", "#818cf8"],
    gradientPreview: "linear-gradient(135deg, #0b0f19 0%, #1c1641 50%, #818cf8 100%)",
  },
  {
    id: "navy-blue",
    name: "Navy Blue",
    subtitle: "Xanh đại dương công nghệ sâu thẳm",
    badge: "Chờ bảng màu",
    previewColors: ["#060d1a", "#0f2347", "#38bdf8"],
    gradientPreview: "linear-gradient(135deg, #060d1a 0%, #0f2347 50%, #38bdf8 100%)",
  },
  {
    id: "clean-white",
    name: "Clean White",
    subtitle: "Trắng sáng tối giản & thanh lịch",
    badge: "Chờ bảng màu",
    previewColors: ["#ffffff", "#f1f5f9", "#4f46e5"],
    gradientPreview: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #4f46e5 100%)",
  },
];

export const THEME_STORAGE_KEY = "exambyheu_system_theme";

/**
 * Lấy theme hiện tại:
 * - Nếu không phải Admin (User thông thường hoặc chưa đăng nhập): LUÔN trả về 'obsidian'
 * - Nếu là Admin: Lấy theme đã chọn trong localStorage, mặc định là 'obsidian'
 */
export function getSystemTheme(): SystemTheme {
  if (typeof window === "undefined") return "obsidian";

  try {
    const user = getCurrentUser();
    // Chỉ Admin mới được áp dụng theme tùy chọn, User thông thường luôn dùng 'obsidian'
    if (!user || user.role !== "admin") {
      return "obsidian";
    }

    const saved = localStorage.getItem(THEME_STORAGE_KEY) as SystemTheme | null;
    if (saved === "navy-blue" || saved === "clean-white" || saved === "obsidian") {
      return saved;
    }
  } catch {
    // fallback
  }

  return "obsidian";
}

/**
 * Đặt theme hệ thống (Chỉ Admin mới có quyền thực hiện)
 */
export function setSystemTheme(theme: SystemTheme): { success: boolean; message?: string } {
  if (typeof window === "undefined") return { success: false, message: "Không hỗ trợ trên máy chủ" };

  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return {
      success: false,
      message: "Chỉ tài khoản Quản trị viên (Admin) mới có quyền thay đổi giao diện hệ thống. Tài khoản User luôn dùng màu Obsidian mặc định.",
    };
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyThemeToDom(theme);
    window.dispatchEvent(new CustomEvent("exambyheu-theme-change", { detail: theme }));
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || "Lỗi lưu cấu hình theme" };
  }
}

/**
 * Áp dụng theme vào thẻ html/body DOM
 */
export function applyThemeToDom(theme?: SystemTheme) {
  if (typeof document === "undefined") return;
  const activeTheme = theme || getSystemTheme();
  document.documentElement.setAttribute("data-theme", activeTheme);

  if (activeTheme === "clean-white") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }
}
