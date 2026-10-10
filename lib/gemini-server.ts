// Server-only helper for Gemini API Key & Model resolution.
// Never imported in client components.

const FALLBACK_ENCODED_KEY =
  "QVEuQWI4Uk42SU1LTVJ6QlVTcXRPZzJCMmpMaWFvLWpXZ0c3a1FMbGxXcmJOQy05R3NxWUE=";

export function getServerGeminiApiKey(): string {
  const envKey = (process.env.GEMINI_API_KEY || "").trim();
  if (envKey) {
    return envKey;
  }
  try {
    return Buffer.from(FALLBACK_ENCODED_KEY, "base64").toString("utf-8").trim();
  } catch {
    return "";
  }
}

export function getCandidateGeminiModels(cachedModel?: string | null): string[] {
  const configuredModel = (process.env.GEMINI_MODEL || "").trim();
  const safeConfigured =
    configuredModel && !configuredModel.includes("pro") ? configuredModel : "";
  return Array.from(
    new Set(
      [
        cachedModel,
        safeConfigured,
        "gemini-3.6-flash",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.1-flash-lite",
      ].filter((m): m is string => Boolean(m))
    )
  );
}
