import posthog from "posthog-js";

/**
 * Minimal, privacy-first PostHog wrapper.
 *
 * - No-ops entirely when no project token is configured (dev/CI/local).
 * - Autocapture OFF: this app has email-draft and search inputs that
 *   autocapture would otherwise hoover up.
 * - Pageviews ARE captured (top-of-funnel visitor count), but every URL
 *   property is stripped to origin + path via sanitize_properties below, so
 *   search terms (/app?q=&u=) and referral codes are never sent.
 * - Session recording OFF. person_profiles "identified_only" + we never call
 *   identify(), so every event stays anonymous.
 */

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

/** origin + pathname only — drops ?query and #hash. */
function stripUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.origin + url.pathname;
  } catch {
    return value.split("?")[0].split("#")[0];
  }
}

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return; // no token configured — stay a no-op

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: false,
    capture_pageview: false, // captured manually per-route in AnalyticsInit
    capture_pageleave: true, // bounce / top-of-funnel drop-off
    disable_session_recording: true,
    person_profiles: "identified_only",
    sanitize_properties: (properties) => {
      // Never let raw URLs (with search terms / referral codes) leave the browser.
      for (const k of ["$current_url", "$referrer"]) {
        const v = properties[k];
        if (typeof v === "string") properties[k] = stripUrl(v);
      }
      return properties;
    },
  });
  // Expose the instance globally so it's reachable from the browser console
  // (the ESM import is module-scoped, so `window.posthog` is otherwise undefined
  // even though PostHog is fully initialized and sending events).
  (window as unknown as { posthog: typeof posthog }).posthog = posthog;
  initialized = true;
}

/** Capture a sanitized pageview (path only). Safe to call on every route change. */
export function capturePageview() {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;
  posthog.capture("$pageview");
}

export function track(event: string, properties?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (!POSTHOG_KEY) return; // no-op when analytics isn't configured
  posthog.capture(event, properties);
}
