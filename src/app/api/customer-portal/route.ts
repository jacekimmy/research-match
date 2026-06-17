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

async function customerWithCurrentSubscription(customerIds: string[]) {
  for (const customer of customerIds) {
    const subscriptions = await stripe.subscriptions.list({
      customer,
      status: "all",
      limit: 100,
    });

    const hasCurrentSubscription = subscriptions.data.some((subscription) =>
      ["active", "trialing", "past_due"].includes(subscription.status) &&
      !subscription.cancel_at_period_end
    );

    if (hasCurrentSubscription) return customer;
  }

  return customerIds[0];
}

async function authenticatedUserId(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

// Opens a billing portal session. If no Customer Portal configuration has been
// saved yet (the classic "customers can't cancel" cause — Stripe throws until
// you save portal settings once in the Dashboard), create a sensible default
// with cancellation enabled and retry. The first config created becomes the
// account default, so this self-heals after one call.
async function createPortalSession(customer: string, returnUrl: string) {
  try {
    return await stripe.billingPortal.sessions.create({ customer, return_url: returnUrl });
  } catch (err) {
    const missingConfig =
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      /configuration/i.test(err.message || "");
    if (!missingConfig) throw err;

    const config = await stripe.billingPortal.configurations.create({
      business_profile: { headline: "Manage your Research Match subscription" },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true },
      },
    });
    return await stripe.billingPortal.sessions.create({
      customer,
      configuration: config.id,
      return_url: returnUrl,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to manage billing." }, { status: 401 });
    }

    const customerIds = await customerIdsForUser(userId);

    if (customerIds.length === 0) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user. Contact support." },
        { status: 404 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const customer = await customerWithCurrentSubscription(customerIds);

    const portalSession = await createPortalSession(customer, `${origin}/profile`);

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Customer portal error:", err);
    return NextResponse.json({ error: "Could not open the billing portal. Please try again or contact support." }, { status: 500 });
  }
}
