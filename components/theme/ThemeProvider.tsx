"use client";

import { useEffect, useState, createContext, useContext } from "react";
import {
  SystemTheme,
  getSystemTheme,
  setSystemTheme as applyStoreTheme,
  applyThemeToDom,
} from "@/lib/theme";

interface ThemeContextType {
  theme: SystemTheme;
  setTheme: (theme: SystemTheme) => { success: boolean; message?: string };
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "obsidian",
  setTheme: () => ({ success: false }),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setCurrentThemeState] = useState<SystemTheme>("obsidian");

  useEffect(() => {
    // Khởi tạo theme khi mount trên client
    const active = getSystemTheme();
    setCurrentThemeState(active);
    applyThemeToDom(active);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<SystemTheme>;
      if (customEvent.detail) {
        setCurrentThemeState(customEvent.detail);
      }
    };

    window.addEventListener("exambyheu-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("exambyheu-theme-change", handleThemeChange);
    };
  }, []);

  const handleSetTheme = (newTheme: SystemTheme) => {
    const result = applyStoreTheme(newTheme);
    if (result.success) {
      setCurrentThemeState(newTheme);
    }
    return result;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useSystemTheme() {
  return useContext(ThemeContext);
}
