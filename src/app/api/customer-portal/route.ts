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
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Look up the Stripe customer ID from the most recent checkout session for this user
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    const userSession = sessions.data.find(
      (s) => s.metadata?.userId === userId && s.customer
    );

    if (!userSession?.customer) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user. Contact support." },
        { status: 404 }
      );
    }

    const customerId =
      typeof userSession.customer === "string"
        ? userSession.customer
        : userSession.customer.id;

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Customer portal error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
