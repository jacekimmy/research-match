import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json();
    if (!code || !userId) {
      return NextResponse.json({ error: "code and userId required" }, { status: 400 });
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

    // Only ever apply to a real account, so a use can't be spent on a bogus id.
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    if (!target) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
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

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ plan_type: "semester" })
      .eq("id", userId);

    if (updateError) {
      // Grant failed after claiming a use — give the use back.
      await supabaseAdmin
        .from("promo_codes")
        .update({ uses_remaining: promo.uses_remaining })
        .eq("code", normalizedCode);
      return NextResponse.json({ error: "Failed to apply promo code" }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan: "semester" });
  } catch (err) {
    console.error("promo error:", err);
    return NextResponse.json({ error: "Could not apply the promo code. Please try again." }, { status: 500 });
  }
}
