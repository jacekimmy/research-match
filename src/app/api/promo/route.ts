import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Identify the caller from their verified Supabase bearer token. userId is taken
// from the token, never the request body, so a promo can only be redeemed onto the
// caller's OWN account (previously any client-supplied userId was trusted).
async function authenticatedUserId(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Sign in to redeem a promo code" }, { status: 401 });
    }
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const { data: promo, error: promoError } = await supabaseAdmin
      .from("promo_codes")
      .select("*")
      .eq("code", normalizedCode)
      .single();

    if (promoError || !promo) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }
    if (promo.uses_remaining <= 0) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }

    // Claim one use ATOMICALLY: the conditional `eq(uses_remaining, <read value>)` only
    // matches if the count hasn't changed since we read it, so concurrent redemptions
    // can't push a capped code below its limit.
    const { data: claimed } = await supabaseAdmin
      .from("promo_codes")
      .update({ uses_remaining: promo.uses_remaining - 1 })
      .eq("code", normalizedCode)
      .eq("uses_remaining", promo.uses_remaining)
      .select("code");

    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ error: "This promo code is no longer available" }, { status: 409 });
    }

    // Grant guard doubles as the one-redemption-per-account rule: a user already on
    // semester/lifetime gains nothing, so the update matches 0 rows and the use is
    // refunded below. The or() keeps legacy NULL plan_type rows grantable (SQL
    // three-valued logic would otherwise exclude them from NOT IN).
    const { data: granted, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ plan_type: "semester" })
      .eq("id", userId)
      .or('plan_type.is.null,plan_type.not.in.("semester","lifetime")')
      .select("id");

    if (updateError || !granted || granted.length === 0) {
      // Grant failed (or matched no profile row) after claiming a use — give it back.
      // Refund is a RELATIVE +1 with the same optimistic-concurrency pattern as the
      // claim: writing back the absolute value we read earlier would un-claim uses
      // consumed concurrently by other redeemers.
      let refunded = false;
      for (let attempt = 0; attempt < 5 && !refunded; attempt++) {
        const { data: fresh } = await supabaseAdmin
          .from("promo_codes")
          .select("uses_remaining")
          .eq("code", normalizedCode)
          .single();
        if (!fresh) break;
        const { data: bumped } = await supabaseAdmin
          .from("promo_codes")
          .update({ uses_remaining: fresh.uses_remaining + 1 })
          .eq("code", normalizedCode)
          .eq("uses_remaining", fresh.uses_remaining)
          .select("code");
        refunded = !!bumped && bumped.length > 0;
      }
      if (!refunded) {
        console.error("promo refund failed (use may be lost):", normalizedCode);
      }
      // Distinguish "already has the plan" (friendly 400) from a real failure —
      // read the profile only on this failure path, not on every redemption.
      if (!updateError) {
        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("plan_type")
          .eq("id", userId)
          .maybeSingle();
        if (currentProfile && ["semester", "lifetime"].includes(currentProfile.plan_type)) {
          return NextResponse.json(
            { error: "Your account already has this plan or better" },
            { status: 400 }
          );
        }
      }
      return NextResponse.json({ error: "Failed to apply promo code" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: "semester" });
  } catch (err) {
    console.error("promo error:", err);
    return NextResponse.json({ error: "Could not apply the promo code. Please try again." }, { status: 500 });
  }
}
