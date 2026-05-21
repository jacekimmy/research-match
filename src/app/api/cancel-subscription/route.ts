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
  return ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(subscription.status);
}

async function authenticatedUserId(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: {
      type?: string;
      subscription_details?: { subscription?: string | null };
    } | null;
  };

  const subscription = invoiceWithSubscription.subscription;
  if (typeof subscription === "string") return subscription;
  if (subscription?.id) return subscription.id;
  if (invoiceWithSubscription.parent?.type === "subscription_details") {
    return invoiceWithSubscription.parent.subscription_details?.subscription ?? null;
  }
  return null;
}

async function voidOpenInvoicesForSubscription(subscription: Stripe.Subscription) {
  const customer =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const openInvoices = await stripe.invoices.list({
    customer,
    status: "open",
    limit: 100,
  });

  const subscriptionInvoices = openInvoices.data.filter(
    (invoice) => invoiceSubscriptionId(invoice) === subscription.id
  );

  const voidedInvoices: string[] = [];
  for (const invoice of subscriptionInvoices) {
    try {
      const voided = await stripe.invoices.voidInvoice(invoice.id);
      voidedInvoices.push(voided.id);
    } catch (err) {
      console.warn(`Could not void invoice ${invoice.id} for subscription ${subscription.id}:`, err);
    }
  }

  return voidedInvoices;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in to cancel a subscription." }, { status: 401 });
    }

    const customerIds = await customerIdsForUser(userId);
    if (customerIds.length === 0) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user. Contact support." },
        { status: 404 }
      );
    }

    const cancelableSubscriptions: Stripe.Subscription[] = [];

    for (const customer of customerIds) {
      const subscriptions = await stripe.subscriptions.list({
        customer,
        status: "all",
        limit: 100,
      });

      for (const subscription of subscriptions.data) {
        if (!isCancelableSubscription(subscription)) continue;
        cancelableSubscriptions.push(subscription);
      }
    }

    if (cancelableSubscriptions.length === 0) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 }
      );
    }

    const canceled: Stripe.Subscription[] = [];
    const voidedInvoices: string[] = [];

    for (const subscription of cancelableSubscriptions) {
      const canceledSubscription = await stripe.subscriptions.cancel(subscription.id, {
        invoice_now: false,
        prorate: false,
      });
      canceled.push(canceledSubscription);
      voidedInvoices.push(...await voidOpenInvoicesForSubscription(canceledSubscription));
    }

    await supabaseAdmin
      .from("profiles")
      .update({ plan_type: "free" })
      .eq("id", userId);

    return NextResponse.json({
      canceled: canceled.map((subscription) => subscription.id),
      voidedInvoices,
    });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
