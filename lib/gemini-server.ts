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
  return Array.from(
    new Set(
      [
        cachedModel,
        "gemini-3.8-flash",
        "gemini-flash-latest",
        configuredModel,
        "gemini-1.5-pro",
        "gemini-pro-latest",
      ].filter((m): m is string => Boolean(m))
    )
  );
}
