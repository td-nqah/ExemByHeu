// Server-only helper for Gemini API Key & Model resolution.
// Never imported in client components.

import { supabase } from "@/lib/supabase/client";

let cachedGeminiApiKey: string | null = null;
let cachedConfiguredModel: string | null = null;

export async function getServerGeminiApiKey(): Promise<string> {
  const envKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GENINI_API_KEY ||
    ""
  ).trim();
  if (envKey) return envKey;

  if (cachedGeminiApiKey) return cachedGeminiApiKey;

  if (supabase) {
    try {
      const { data } = await supabase
        .from("exams")
        .select("description")
        .eq("title", "__SYSTEM_AI_CONFIG__")
        .maybeSingle();

      if (data?.description) {
        const parsed = JSON.parse(data.description);
        if (parsed?.apiKey) {
          cachedGeminiApiKey = String(parsed.apiKey).trim();
          if (parsed?.model) {
            cachedConfiguredModel = String(parsed.model).trim();
          }
          return cachedGeminiApiKey;
        }
      }
    } catch {
      // Fallback
    }
  }

  return "";
}

export function getCandidateGeminiModels(cachedModel?: string | null): string[] {
  const configuredModel = (process.env.GEMINI_MODEL || cachedConfiguredModel || "gemini-3.5-flash-lite").trim();

  // If a working model is already known, prioritize it so users don't experience repeated 429/503 timeouts
  const priority = cachedModel ? [cachedModel] : [];

  return Array.from(
    new Set(
      [
        ...priority,
        // 1. Ưu tiên số 1: Model cấu hình chính (gemini-3.5-flash-lite - Hạn mức cực khủng 500 RPD)
        configuredModel,
        "gemini-3.5-flash-lite",

        // 2. Dự phòng tầng 1: Dòng Flash-Lite tiếp theo (gemini-3.1-flash-lite - Thêm 500 RPD nữa, tổng 1000 lượt/ngày)
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",

        // 3. Dự phòng tầng 2: Dòng Flash bản lớn
        "gemini-3.6-flash",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ].filter((m): m is string => Boolean(m))
    )
  );
}
