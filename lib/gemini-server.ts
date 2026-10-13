// Server-only helper for Gemini API Key & Model resolution.
// Never imported in client components.

import { supabase } from "@/lib/supabase/client";

let cachedGeminiApiKey: string | null = null;
let cachedConfiguredModel: string | null = null;

export async function getServerGeminiApiKey(): Promise<string> {
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
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
  const configuredModel = (process.env.GEMINI_MODEL || cachedConfiguredModel || "").trim();
  return Array.from(
    new Set(
      [
        cachedModel,
        configuredModel,
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
        "gemini-3-flash-preview",
      ].filter((m): m is string => Boolean(m))
    )
  );
}
