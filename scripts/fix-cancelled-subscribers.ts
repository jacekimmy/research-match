/**
 * One-time cleanup script: fix-cancelled-subscribers.ts
 *
 * Finds all Stripe subscriptions that are cancelled or scheduled to cancel,
 * then downgrades the corresponding Supabase profiles to plan_type = "free".
 *
 * Run with:
 *   npx tsx scripts/fix-cancelled-subscribers.ts
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load .env.local manually — dotenv is not installed in this Next.js project
const envFile = fs.readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && !key.startsWith("#")) process.env[key.trim()] ??= rest.join("=").trim();
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function userIdFromSubscription(subscriptionId: string): Promise<string | null> {
  const sessions = await stripe.checkout.sessions.list({
    subscription: subscriptionId,
    limit: 1,
  });
  return sessions.data[0]?.metadata?.userId ?? null;
}

async function main() {
  console.log("🔍 Scanning all Stripe subscriptions...\n");

  let downgraded = 0;
  let skipped = 0;

  // Fix 2: "all" is valid in Stripe API but not in the TS type — cast to bypass
  // Fix 3: Use autoPagingEach for reliable auto-pagination across SDK versions
  await stripe.subscriptions.list({ limit: 100, status: "all" as Stripe.SubscriptionListParams["status"] })
    .autoPagingEach(async (sub) => {
      const shouldDowngrade =
        sub.status === "canceled" ||
        sub.status === "unpaid" ||
        sub.status === "past_due" ||
        sub.cancel_at_period_end === true;

      if (!shouldDowngrade) {
        skipped++;
        return;
      }

      const userId = await userIdFromSubscription(sub.id);
      if (!userId) {
        console.log(`⚠️  No userId found for subscription ${sub.id} — skipping`);
        return;
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, plan_type")
        .eq("id", userId)
        .single();

      if (!profile) {
        console.log(`⚠️  No profile found for userId ${userId} — skipping`);
        return;
      }

      if (profile.plan_type === "free" || profile.plan_type === "lifetime") {
        // Already free, or lifetime (never touch lifetime users)
        skipped++;
        return;
      }

      await supabaseAdmin
        .from("profiles")
        .update({ plan_type: "free" })
        .eq("id", userId);

      console.log(
        `⬇️  Downgraded userId ${userId} | sub ${sub.id} | status: ${sub.status} | cancel_at_period_end: ${sub.cancel_at_period_end}`
      );
      downgraded++;
    });

  console.log(`\n✅ Done. Downgraded: ${downgraded} | Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});

