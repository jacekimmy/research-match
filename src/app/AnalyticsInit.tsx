"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, capturePageview } from "@/lib/analytics";

/**
 * Initializes PostHog and captures a sanitized pageview on every route change
 * (App Router client navigations don't fire automatic pageviews). Renders nothing.
 */
export default function AnalyticsInit() {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (pathname) capturePageview();
  }, [pathname]);

  return null;
}
