import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json();

    // Determine if this is a subscription or one-time based on the price
    const price = await stripe.prices.retrieve(priceId);
    const mode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      allow_promotion_codes: true,
      success_url: `${req.headers.get("origin") || "http://localhost:3000"}/app?success=true`,
      cancel_url: `${req.headers.get("origin") || "http://localhost:3000"}/app`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
