// Server-only helper for Gemini API Key & Model resolution.
// Never imported in client components.

export function getServerGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || "").trim();
}

export function getCandidateGeminiModels(cachedModel?: string | null): string[] {
  const configuredModel = (process.env.GEMINI_MODEL || "").trim();
  return Array.from(
    new Set(
      [
        cachedModel,
        configuredModel,
        "gemini-flash-lite-latest",
        "gemini-3.7-flash",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3-flash-preview",
        "gemini-flash-latest",
        "gemini-3.6-flash",
      ].filter((m): m is string => Boolean(m))
    )
  );
}
