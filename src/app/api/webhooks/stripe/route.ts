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

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (!userId)
      return NextResponse.json({ error: "No userId" }, { status: 400 });

    // Determine plan type from the subscription/payment
    let planType = "student_monthly";
    const lifetimePriceId = process.env.STRIPE_PRICE_LIFETIME || "price_1TFLm1FINW44xCyF3FAt3jF5";

    if (session.mode === "payment") {
      // One-time payment — check if it's the lifetime price
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const paidPriceId = lineItems.data[0]?.price?.id;
      if (paidPriceId === lifetimePriceId) {
        planType = "lifetime";
      }
    } else if (session.mode === "subscription" && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const priceId = sub.items.data[0]?.price.id;
      if (priceId === process.env.STRIPE_PRICE_STUDENT_ANNUAL) {
        planType = "student_annual";
      }
    }

    await supabaseAdmin
      .from("profiles")
      .update({ plan_type: planType })
      .eq("id", userId);

    // Increment lifetime spots counter if lifetime purchase
    if (planType === "lifetime") {
      const { data: setting } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "lifetime_spots_claimed")
        .single();

      const currentClaimed = setting ? parseInt(setting.value, 10) : 0;

      if (setting) {
        await supabaseAdmin
          .from("settings")
          .update({ value: String(currentClaimed + 1) })
          .eq("key", "lifetime_spots_claimed");
      } else {
        await supabaseAdmin
          .from("settings")
          .insert({ key: "lifetime_spots_claimed", value: "1" });
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const sessions = await stripe.checkout.sessions.list({
      subscription: sub.id,
      limit: 1,
    });
    const userId = sessions.data[0]?.metadata?.userId;
    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan_type: "free" })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
