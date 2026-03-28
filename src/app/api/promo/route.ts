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

    // Look up the promo code
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

    // Apply the promo: set user to student_monthly (unlimited access)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ plan_type: "student_monthly" })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to apply promo code" }, { status: 500 });
    }

    // Decrement uses_remaining
    await supabaseAdmin
      .from("promo_codes")
      .update({ uses_remaining: promo.uses_remaining - 1 })
      .eq("code", normalizedCode);

    return NextResponse.json({ success: true, plan: "student_monthly" });
  } catch (err) {
    console.error("promo error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
