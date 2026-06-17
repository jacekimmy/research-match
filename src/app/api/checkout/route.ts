import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { normalizeReferralCode } from "@/lib/buddy-pass";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALLOWED_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_WEEKLY,
  process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY,
  "price_1TMxDSFINW44xCyFWrm6ZTOo",
  process.env.STRIPE_PRICE_SEMESTER,
  process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER,
  "price_1TIuAlFINW44xCyFcxqgQpeV",
  process.env.STRIPE_PRICE_LIFETIME,
  process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME,
  "price_1TIuBBFINW44xCyFoSCtUpFN",
].filter(Boolean));

async function authenticatedUserId(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

async function buddyPassCouponId() {
  const configuredCoupon = process.env.STRIPE_BUDDY_PASS_COUPON_ID;
  if (configuredCoupon) return configuredCoupon;

  const couponId = "research_buddy_pass_25";
  try {
    await stripe.coupons.retrieve(couponId);
    return couponId;
  } catch {
    try {
      const coupon = await stripe.coupons.create({
        id: couponId,
        name: "Research Buddy Pass",
        percent_off: 25,
        duration: "once",
      });
      return coupon.id;
    } catch {
      await stripe.coupons.retrieve(couponId);
      return couponId;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to start checkout." }, { status: 401 });
    }

    const { priceId, referralCode } = await req.json();
    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ error: "Invalid checkout price." }, { status: 400 });
    }

    // Determine if this is a subscription or one-time based on the price
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === "recurring" ? "subscription" : "payment";

    let referralMetadata: Record<string, string> = {};
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;

    if (typeof referralCode === "string" && referralCode.trim()) {
      const normalizedReferralCode = normalizeReferralCode(referralCode);
      if (!normalizedReferralCode) {
        return NextResponse.json({ error: "Enter a valid Buddy Pass code." }, { status: 400 });
      }
      const { data: referrer } = await supabaseAdmin
        .from("profiles")
        .select("id, referral_code")
        .eq("referral_code", normalizedReferralCode)
        .single();

      if (!referrer) {
        return NextResponse.json({ error: "Buddy Pass code not found." }, { status: 400 });
      }
      if (referrer.id === userId) {
        return NextResponse.json({ error: "You cannot use your own Buddy Pass code." }, { status: 400 });
      }

      const { data: existingReferral } = await supabaseAdmin
        .from("buddy_pass_referrals")
        .select("id")
        .eq("referred_user_id", userId)
        .eq("status", "rewarded")
        .limit(1)
        .maybeSingle();

      if (existingReferral) {
        return NextResponse.json({ error: "You already used a Buddy Pass code." }, { status: 400 });
      }

      referralMetadata = {
        referralCode: normalizedReferralCode,
        referrerId: referrer.id,
        referredUserId: userId,
      };
      discounts = [{ coupon: await buddyPassCouponId() }];
    }

    const metadata = { userId, ...referralMetadata };

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      ...(mode === "subscription" ? { subscription_data: { metadata } } : {}),
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/welcome`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/app`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: "Could not start checkout. Please try again or contact support." }, { status: 500 });
  }
}
