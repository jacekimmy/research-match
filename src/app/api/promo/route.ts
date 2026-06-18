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

    const { data: granted, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ plan_type: "semester" })
      .eq("id", userId)
      .select("id");

    if (updateError || !granted || granted.length === 0) {
      // Grant failed (or matched no profile row) after claiming a use — give it back.
      const { error: refundError } = await supabaseAdmin
        .from("promo_codes")
        .update({ uses_remaining: promo.uses_remaining })
        .eq("code", normalizedCode);
      if (refundError) {
        console.error("promo refund failed (use may be lost):", normalizedCode, refundError);
      }
      return NextResponse.json({ error: "Failed to apply promo code" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: "semester" });
  } catch (err) {
    console.error("promo error:", err);
    return NextResponse.json({ error: "Could not apply the promo code. Please try again." }, { status: 500 });
  }
}
