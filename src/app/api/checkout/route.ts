import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const PRICE_MAP: Record<string, string | undefined> = {
      student_monthly: process.env.STRIPE_PRICE_STUDENT_MONTHLY,
      student_annual: process.env.STRIPE_PRICE_STUDENT_ANNUAL,
      lifetime: process.env.STRIPE_PRICE_LIFETIME,
    };

    const { plan, userId } = await req.json();
    const priceId = PRICE_MAP[plan];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "Must be logged in" }, { status: 401 });
    }

    const isOneTime = plan === "lifetime";

    const session = await stripe.checkout.sessions.create({
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/app?success=true`,
      cancel_url: `${req.nextUrl.origin}/app`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
