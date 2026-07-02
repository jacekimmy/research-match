// Shared billing-route helpers. customer-portal and cancel-subscription used to
// carry byte-identical private copies of these; the verified-email security fix
// had to be applied to both in lockstep, which is exactly the failure mode this
// module exists to prevent.
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Identify the caller from their verified Supabase bearer token. Both the id and
// the email come from the token — never from the request body or the profiles row.
export async function authenticatedUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

// Resolve every Stripe customer that belongs to this user: subscriptions tagged
// with their userId, checkout sessions tagged with their userId, and customers
// matching their AUTH-VERIFIED email. Never look up by profiles.email — that row
// is client-writable, and a tampered email would hand out another person's
// Stripe customer (their billing portal / their subscriptions).
export async function customerIdsForUser(
  stripe: Stripe,
  userId: string,
  verifiedEmail: string | null
) {
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

  if (verifiedEmail) {
    const customers = await stripe.customers.list({ email: verifiedEmail, limit: 10 });
    customers.data.forEach((customer) => customerIds.add(customer.id));
  }

  return [...customerIds];
}
