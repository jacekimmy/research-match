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

    const semesterPriceId = process.env.STRIPE_PRICE_SEMESTER || "price_1TIuAlFINW44xCyFcxqgQpeV";
    const lifetimePriceId = process.env.STRIPE_PRICE_LIFETIME || "price_1TIuBBFINW44xCyFoSCtUpFN";
    const weeklyPriceId = process.env.STRIPE_PRICE_WEEKLY || "price_1TMxDSFINW44xCyFWrm6ZTOo";

    let planType = "semester";

    if (session.mode === "payment") {
      // One-time payment — lifetime
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const paidPriceId = lineItems.data[0]?.price?.id;
      planType = paidPriceId === lifetimePriceId ? "lifetime" : "semester";
    } else if (session.mode === "subscription" && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id;
      if (priceId === weeklyPriceId) {
        planType = "weekly";
      } else {
        planType = "semester";
      }
    }

    const { error: updateError, count } = await supabaseAdmin
      .from("profiles")
      .update({ plan_type: planType })
      .eq("id", userId)
      .select("id", { count: "exact", head: true });

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }
    if (count === 0) {
      console.error(`No profile found for userId: ${userId}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`✅ Plan updated to "${planType}" for userId: ${userId}`);

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

  // Helper: look up userId from a subscription ID via checkout session metadata
  async function userIdFromSubscription(subscriptionId: string): Promise<string | null> {
    const sessions = await stripe.checkout.sessions.list({
      subscription: subscriptionId,
      limit: 1,
    });
    return sessions.data[0]?.metadata?.userId ?? null;
  }

  // Subscription deleted (cancelled / reached end of billing period)
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = await userIdFromSubscription(sub.id);
    if (userId) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan_type: "free" })
        .eq("id", userId);
      console.log(`⬇️  Subscription deleted → downgraded userId: ${userId} to free`);
    }
  }

  // Subscription updated — catch status transitions like past_due, unpaid, canceled
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const downgradeStatuses = ["past_due", "unpaid", "canceled", "incomplete_expired"];
    if (downgradeStatuses.includes(sub.status)) {
      const userId = await userIdFromSubscription(sub.id);
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_type: "free" })
          .eq("id", userId);
        console.log(`⬇️  Subscription status "${sub.status}" → downgraded userId: ${userId} to free`);
      }
    }
  }

  // Invoice payment failed — downgrade immediately on failed renewal
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
    if (subscriptionId) {
      const userId = await userIdFromSubscription(subscriptionId);
      if (userId) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_type: "free" })
          .eq("id", userId);
        console.log(`⬇️  Payment failed → downgraded userId: ${userId} to free`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
