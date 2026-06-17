// Registers a creator as an affiliate. One command does all three things:
//   1. Ensures the shared "20% off, first payment only" Stripe coupon exists.
//   2. Creates a Stripe promotion code (the code the creator gives their audience).
//   3. Inserts the affiliate row in Supabase, linked to that promotion code.
//
// Usage:
//   node scripts/create-affiliate.mjs \
//     --name "Parker Walbeck" --code PARKER \
//     --email parker@example.com --payout-email parker@example.com \
//     [--rate 0.30] [--percent 20] [--max-redemptions 0]
//
//   --rate            creator's cut, 0..1 (default 0.30 = 30%)
//   --percent         audience discount % (default 20)
//   --max-redemptions cap total uses of the code (default 0 = unlimited)
//
// Re-running for a code that already exists is safe: it refuses to duplicate.

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
try {
  const envFile = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && !key.startsWith("#")) process.env[key.trim()] ??= rest.join("=").trim();
  }
} catch {
  console.error("Could not read .env.local at repo root.");
  process.exit(1);
}

// --- parse --flags ---
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith("--") ? argv[++i] : "true";
  }
}

const name = args.name;
const code = (args.code || "").trim().toUpperCase();
const email = args.email || null;
const payoutEmail = args["payout-email"] || email;
const rate = args.rate ? Number(args.rate) : 0.3;
const percent = args.percent ? Number(args.percent) : 20;
const maxRedemptions = args["max-redemptions"] ? Number(args["max-redemptions"]) : 0;

if (!name || !code) {
  console.error(
    'Usage: node scripts/create-affiliate.mjs --name "Creator Name" --code CODE ' +
      "[--email x] [--payout-email x] [--rate 0.30] [--percent 20] [--max-redemptions 0]"
  );
  process.exit(1);
}
if (!(rate > 0 && rate < 1)) {
  console.error("--rate must be between 0 and 1 (e.g. 0.30 for 30%).");
  process.exit(1);
}
if (!(percent > 0 && percent < 100)) {
  console.error("--percent must be between 1 and 99.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COUPON_ID = process.env.STRIPE_AFFILIATE_COUPON_ID || `creator_${percent}_once`;

async function ensureCoupon() {
  try {
    return (await stripe.coupons.retrieve(COUPON_ID)).id;
  } catch {
    const c = await stripe.coupons.create({
      id: COUPON_ID,
      name: `Creator ${percent}% off (first payment)`,
      percent_off: percent,
      duration: "once",
    });
    return c.id;
  }
}

async function main() {
  const { data: existing } = await supabase
    .from("affiliates")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (existing) {
    console.error(`⚠️  Affiliate code ${code} already exists (id ${existing.id}). Aborting.`);
    process.exit(1);
  }

  const couponId = await ensureCoupon();
  console.log(`✓ Coupon ready: ${couponId}  (${percent}% off, once)`);

  let promo;
  try {
    promo = await stripe.promotionCodes.create({
      // API version 2026-02-25.clover nests the coupon under `promotion`; there is
      // no top-level `coupon` create param.
      promotion: { type: "coupon", coupon: couponId },
      code,
      ...(maxRedemptions > 0 ? { max_redemptions: maxRedemptions } : {}),
      metadata: { affiliate_name: name },
    });
  } catch (err) {
    console.error(`Stripe promotion code creation failed: ${err.message}`);
    console.error("If a promo code with this name already exists in Stripe, pick a different --code.");
    process.exit(1);
  }
  console.log(`✓ Stripe promotion code created: ${promo.code}  (${promo.id})`);

  const { data: aff, error } = await supabase
    .from("affiliates")
    .insert({
      name,
      email,
      payout_email: payoutEmail,
      code,
      stripe_promotion_code_id: promo.id,
      commission_rate: rate,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase insert failed:", error.message);
    // Roll back the live promo code so an orphan can't grant the discount with no
    // affiliate row behind it (which would give the audience a price cut while the
    // creator earns nothing).
    try {
      await stripe.promotionCodes.update(promo.id, { active: false });
      console.error(`Rolled back: deactivated orphaned promo code ${promo.id}.`);
    } catch (rollbackErr) {
      console.error(`Could not auto-deactivate promo code ${promo.id}: ${rollbackErr.message}. Disable it in Stripe.`);
    }
    process.exit(1);
  }

  console.log("\n✅ Affiliate created.");
  console.log(`   Name:         ${name}`);
  console.log(`   Code:         ${code}   ← audience types this at checkout`);
  console.log(`   Audience gets: ${percent}% off the first payment`);
  console.log(`   Creator earns: ${(rate * 100).toFixed(0)}% of every payment (incl. renewals)`);
  console.log(`   Payout to:    ${payoutEmail || "—"}`);
  console.log(`   Affiliate id: ${aff.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
