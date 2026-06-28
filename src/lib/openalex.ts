// OpenAlex helpers. Every OpenAlex request should go through oaUrl() so it carries
// a `mailto`, which puts us in OpenAlex's "polite pool" — far more reliable than the
// anonymous "common pool", which throttles aggressively and shares a daily cap. Calls
// made from shared serverless IPs without a mailto were getting rate-limited under
// load, which surfaced to users as intermittent "zero results" that cleared the next
// day (the daily cap resetting). See also the per-call timeouts in callers.
export const OA_MAILTO =
  process.env.NEXT_PUBLIC_OPENALEX_MAILTO || "contact@researchmatch.site";

// Append mailto to an OpenAlex URL (idempotent — safe to wrap a URL that already has it).
export function oaUrl(url: string): string {
  if (url.includes("mailto=")) return url;
  return url + (url.includes("?") ? "&" : "?") + `mailto=${OA_MAILTO}`;
}
