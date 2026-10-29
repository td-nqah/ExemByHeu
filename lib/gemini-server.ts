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
  const configuredModel = (process.env.GEMINI_MODEL || cachedConfiguredModel || "gemini-3.6-flash").trim();
  return Array.from(
    new Set(
      [
        // 1. Ưu tiên số 1: Model cấu hình (luôn ưu tiên gemini-3.6-flash)
        configuredModel,
        "gemini-3.6-flash",

        // 2. Dự phòng tầng 1: Các model Flash khác khi 3.6 bị lỗi/hết quota
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-3.7-flash",

        // 3. Dự phòng tầng 2: Dòng Flash-Lite siêu nhẹ, hạn mức TPM/RPM riêng
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",

        cachedModel,
      ].filter((m): m is string => Boolean(m))
    )
  );
}
