import type { NextRequest } from "next/server";

// Fixed-window in-memory rate limiter, per warm serverless instance. Not a
// distributed guarantee — the goal is blunting abuse of expensive endpoints
// (paid Serper credits, OpenAlex polite-pool quota, LLM calls), not billing-grade
// enforcement. Entries are evicted so the map can't grow unboundedly.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
// Amortize the full-map eviction sweep: during a spoofed-key flood the map stays
// full, and without this every new-key request would rescan all 10k entries.
const SWEEP_INTERVAL_MS = 1_000;
let lastSweepAt = 0;

export function withinRateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      if (now - lastSweepAt >= SWEEP_INTERVAL_MS) {
        lastSweepAt = now;
        for (const [k, v] of buckets) {
          if (v.resetAt <= now) buckets.delete(k);
        }
      }
      // Still full (nothing expired, or we swept recently): the instance is under
      // active flood — refuse new keys rather than growing without bound.
      if (buckets.size >= MAX_BUCKETS) return false;
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Light-touch email sanity check for lead-capture endpoints (waitlist, contact,
// starter kit). Not RFC-complete on purpose.
export function isPlausibleEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
  );
}
