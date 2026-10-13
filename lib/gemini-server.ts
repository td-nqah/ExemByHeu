// Server-only helper for Gemini API Key & Model resolution.
// Never imported in client components.

export function getServerGeminiApiKey(): string {
  return (process.env.GEMINI_API_KEY || "").trim();
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
