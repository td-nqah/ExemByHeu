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
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-2.5-flash-lite",
        "gemini-flash-lite-latest",
      ].filter((m): m is string => Boolean(m))
    )
  );
}
