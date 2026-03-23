import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PLAN_MAP: Record<string, string> = {
  student_monthly: "student_monthly",
  student_annual: "student_annual",
  lifetime: "lifetime",
};

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    if (userId && plan) {
      const planType = PLAN_MAP[plan] || "student_monthly";

      await supabaseAdmin
        .from("profiles")
        .update({ plan_type: planType })
        .eq("id", userId);

      if (plan === "lifetime") {
        const { data } = await supabaseAdmin
          .from("settings")
          .select("value")
          .eq("key", "lifetime_spots_claimed")
          .single();

        const current = parseInt(data?.value ?? "0", 10);
        await supabaseAdmin
          .from("settings")
          .update({ value: String(current + 1) })
          .eq("key", "lifetime_spots_claimed");
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (customer && !customer.deleted && customer.email) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan_type: "free" })
        .eq("email", customer.email);
    }
  }

  return NextResponse.json({ received: true });
}
