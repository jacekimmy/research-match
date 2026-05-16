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

async function customerIdsForUser(userId: string) {
  const customerIds = new Set<string>();

  try {
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['userId']:'${userId.replace(/'/g, "\\'")}'`,
      limit: 100,
    });

    subscriptions.data.forEach((subscription) => {
      const customer = subscription.customer;
      if (typeof customer === "string") {
        customerIds.add(customer);
      } else if (!("deleted" in customer && customer.deleted)) {
        customerIds.add(customer.id);
      }
    });
  } catch (err) {
    console.warn("Subscription metadata lookup failed:", err);
  }

  const sessions = await stripe.checkout.sessions
    .list({ limit: 100 })
    .autoPagingToArray({ limit: 1000 });

  sessions.forEach((session) => {
    if (session.metadata?.userId === userId && session.customer) {
      customerIds.add(
        typeof session.customer === "string" ? session.customer : session.customer.id
      );
    }
  });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    const customers = await stripe.customers.list({ email: profile.email, limit: 10 });
    customers.data.forEach((customer) => customerIds.add(customer.id));
  }

  return [...customerIds];
}

function isCancelableSubscription(subscription: Stripe.Subscription) {
  return ["active", "trialing", "past_due"].includes(subscription.status);
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const customerIds = await customerIdsForUser(userId);
    if (customerIds.length === 0) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user. Contact support." },
        { status: 404 }
      );
    }

    const activeSubscriptions: Stripe.Subscription[] = [];
    const alreadyScheduledSubscriptions: Stripe.Subscription[] = [];

    for (const customer of customerIds) {
      const subscriptions = await stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 100,
      });

      for (const subscription of subscriptions.data) {
        if (!isCancelableSubscription(subscription)) continue;
        if (subscription.cancel_at_period_end) {
          alreadyScheduledSubscriptions.push(subscription);
        } else {
          activeSubscriptions.push(subscription);
        }
      }
    }

    if (activeSubscriptions.length === 0) {
      if (alreadyScheduledSubscriptions.length > 0) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan_type: "free" })
          .eq("id", userId);

        return NextResponse.json({
          canceled: alreadyScheduledSubscriptions.map((subscription) => subscription.id),
          alreadyScheduled: true,
        });
      }

      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 }
      );
    }

    const canceled = await Promise.all(
      activeSubscriptions.map((subscription) =>
        stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true })
      )
    );

    await supabaseAdmin
      .from("profiles")
      .update({ plan_type: "free" })
      .eq("id", userId);

    return NextResponse.json({
      canceled: canceled.map((subscription) => subscription.id),
    });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
