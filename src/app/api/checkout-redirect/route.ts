import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2026-02-25.clover" as any,
});

const PRICE_IDS: Record<string, string> = {
  weekly:   process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY   || "price_1TMxDSFINW44xCyFWrm6ZTOo",
  semester: process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER || "price_1TIuAlFINW44xCyFcxqgQpeV",
  lifetime: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME || "price_1TIuBBFINW44xCyFoSCtUpFN",
};

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const plan = req.nextUrl.searchParams.get("plan") ?? "";
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return NextResponse.redirect(`${origin}/app`);
  }

  // Try to resolve the logged-in user from the Supabase auth cookie
  let userId: string | null = null;
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").filter(Boolean).map((c) => {
        const idx = c.indexOf("=");
        return [c.slice(0, idx), c.slice(idx + 1)];
      })
    );

    // Supabase stores tokens in sb-<ref>-auth-token (may be chunked: …-0, -1 …)
    const base = Object.keys(cookies).find(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token") && !/-auth-token-\d+$/.test(k)
    );
    const tokenRaw = base ? decodeURIComponent(cookies[base]) : null;

    if (tokenRaw) {
      const parsed = JSON.parse(tokenRaw);
      const accessToken: string | null =
        parsed?.access_token ??
        (Array.isArray(parsed) ? parsed[0]?.access_token : null) ??
        null;

      if (accessToken) {
        const { data } = await supabase.auth.getUser(accessToken);
        userId = data.user?.id ?? null;
      }
    }
  } catch {
    // Auth lookup failed — fall through to guest flow
  }

  // Not logged in → send them to the app to sign up / log in, then upgrade
  if (!userId) {
    const fallback = plan === "semester" ? "true" : plan;
    return NextResponse.redirect(`${origin}/app?upgrade=${fallback}`);
  }

  // Logged in → create Stripe session and redirect directly
  try {
    const price = await stripe.prices.retrieve(priceId);
    const mode: "payment" | "subscription" =
      price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      allow_promotion_codes: true,
      success_url: `${origin}/welcome`,
      cancel_url:  `${origin}/app`,
    });

    if (session.url) {
      return NextResponse.redirect(session.url);
    }
  } catch (err) {
    console.error("[checkout-redirect] Stripe error:", err);
  }

  // Fallback
  const fallback = plan === "semester" ? "true" : plan;
  return NextResponse.redirect(`${origin}/app?upgrade=${fallback}`);
}
