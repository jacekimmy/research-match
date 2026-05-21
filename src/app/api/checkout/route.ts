import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to start checkout." }, { status: 401 });
    }

    const { priceId } = await req.json();
    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ error: "Invalid checkout price." }, { status: 400 });
    }

    // Determine if this is a subscription or one-time based on the price
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      ...(mode === "subscription" ? { subscription_data: { metadata: { userId } } } : {}),
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/welcome`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/app`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
