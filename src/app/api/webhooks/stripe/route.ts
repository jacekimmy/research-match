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

const WEEKLY_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_WEEKLY,
  process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY,
  "price_1TQAAIFINW44xCyFF3QP0SRL",
  "price_1TMxDSFINW44xCyFWrm6ZTOo",
].filter(Boolean));

function planTypeFromPrice(priceId?: string | null) {
  return priceId && WEEKLY_PRICE_IDS.has(priceId) ? "weekly" : "semester";
}

function stripeId(ref: string | { id?: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id ?? null;
}

// ── Affiliate attribution ─────────────────────────────────────────────────────
// Records the first-payment commission for a creator whose promo code was used at
// checkout. Returns `true` if a transient DB failure means the event should be
// retried (so the caller leaves the event un-marked). Throwing is avoided so plan
// provisioning still runs; money-write failures are signalled via the return value.
async function recordAffiliateAttribution(session: Stripe.Checkout.Session): Promise<boolean> {
  let needsRetry = false;

  // The applied promotion code is what identifies the creator. Re-fetch with the
  // discounts expanded — the raw webhook session may not include them.
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["discounts"],
  });
  const promotionCodeId =
    (fullSession.discounts ?? [])
      .map((d) =>
        typeof d.promotion_code === "string" ? d.promotion_code : d.promotion_code?.id ?? null
      )
      .find(Boolean) ?? null;
  if (!promotionCodeId) return false;

  const { data: affiliate } = await supabaseAdmin
    .from("affiliates")
    .select("id, commission_rate, status, email")
    .eq("stripe_promotion_code_id", promotionCodeId)
    .maybeSingle();
  if (!affiliate || (affiliate.status ?? "active") !== "active") return false;

  // Self-referral guard: a creator can't earn commission on their own purchase.
  const buyerEmail = (session.customer_details?.email || session.customer_email || "")
    .trim()
    .toLowerCase();
  const affiliateEmail = (affiliate.email || "").trim().toLowerCase();
  if (buyerEmail && affiliateEmail && buyerEmail === affiliateEmail) {
    console.warn(`⛔ Affiliate self-referral blocked for ${affiliateEmail}`);
    return false;
  }

  const customerId = stripeId(session.customer);
  const subscriptionId = stripeId(session.subscription);

  // One referral per subscription (idempotent upsert). One-time payments have no
  // subscription and no renewals, so a plain insert is fine there.
  let referralId: string | null = null;
  if (subscriptionId) {
    const { data, error } = await supabaseAdmin
      .from("referrals")
      .upsert(
        {
          affiliate_id: affiliate.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        },
        { onConflict: "stripe_subscription_id" }
      )
      .select("id")
      .single();
    if (error) {
      console.error("Affiliate referral upsert failed:", error);
      needsRetry = true;
    }
    referralId = data?.id ?? null;
  } else {
    const { data, error } = await supabaseAdmin
      .from("referrals")
      .insert({ affiliate_id: affiliate.id, stripe_customer_id: customerId, stripe_subscription_id: null })
      .select("id")
      .single();
    if (error) {
      console.error("Affiliate referral insert failed:", error);
      needsRetry = true;
    }
    referralId = data?.id ?? null;
  }

  // First-payment commission, on what the customer actually paid (net of discount),
  // deduped by invoice/payment ref so a retry or the first invoice.paid can't double it.
  const invoiceRef = stripeId(session.invoice) ?? stripeId(session.payment_intent) ?? session.id;
  const amountTotal = session.amount_total ?? 0;
  const rate = Number(affiliate.commission_rate ?? 0.3);

  if (referralId && amountTotal > 0 && rate > 0) {
    const { data: existing } = await supabaseAdmin
      .from("commissions")
      .select("id")
      .eq("stripe_invoice_id", invoiceRef)
      .maybeSingle();
    if (!existing) {
      const amountCents = Math.round(amountTotal * rate);
      const { error } = await supabaseAdmin.from("commissions").insert({
        affiliate_id: affiliate.id,
        referral_id: referralId,
        stripe_invoice_id: invoiceRef,
        amount_cents: amountCents,
        currency: session.currency ?? "usd",
        status: "pending",
      });
      // 23505 = a concurrent delivery already recorded it → success, not a failure.
      if (error && error.code !== "23505") {
        console.error("Affiliate commission insert failed:", error);
        needsRetry = true;
      } else if (!error) {
        console.log(`💸 Affiliate first-payment commission: affiliate=${affiliate.id} amount_cents=${amountCents}`);
      }
    }
  }

  return needsRetry;
}

// Recurring commission on a renewal payment. Returns true if it should be retried.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordRenewalCommission(invoice: any, subscriptionId: string): Promise<boolean> {
  let needsRetry = false;
  const { data: referral } = await supabaseAdmin
    .from("referrals")
    .select("id, affiliate_id, affiliates(commission_rate, status)")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  const affiliateRow = Array.isArray(referral?.affiliates)
    ? referral?.affiliates[0]
    : referral?.affiliates;
  if (!referral || !affiliateRow || (affiliateRow.status ?? "active") !== "active") return false;

  const invoiceId: string | null = invoice.id ?? null;
  const amountPaid: number = invoice.amount_paid ?? 0;
  const rate = Number(affiliateRow.commission_rate ?? 0.3);
  if (!invoiceId || amountPaid <= 0 || rate <= 0) return false;

  const { data: existing } = await supabaseAdmin
    .from("commissions")
    .select("id")
    .eq("stripe_invoice_id", invoiceId)
    .maybeSingle();
  if (existing) return false;

  const amountCents = Math.round(amountPaid * rate);
  const { error } = await supabaseAdmin.from("commissions").insert({
    affiliate_id: referral.affiliate_id,
    referral_id: referral.id,
    stripe_invoice_id: invoiceId,
    amount_cents: amountCents,
    currency: invoice.currency ?? "usd",
    status: "pending",
  });
  if (error && error.code !== "23505") {
    console.error("Affiliate renewal commission insert failed:", error);
    needsRetry = true;
  } else if (!error) {
    console.log(`💸 Affiliate renewal commission: affiliate=${referral.affiliate_id} invoice=${invoiceId} amount_cents=${amountCents}`);
  }
  return needsRetry;
}

// Void any pending commissions tied to a reversed payment (refund or lost dispute),
// so the creator is never paid on money the business gave back. Returns true if the
// void FAILED transiently (caller should set needsRetry so Stripe redelivers — without
// this, a failed void would be acked and the creator stays paid on reversed money).
async function voidCommissionsForRefs(refs: (string | null | undefined)[], reason: string): Promise<boolean> {
  const ids = [...new Set(refs.filter((r): r is string => !!r))];
  if (ids.length === 0) return false;
  const { data: voided, error } = await supabaseAdmin
    .from("commissions")
    .update({ status: "void" })
    .in("stripe_invoice_id", ids)
    .eq("status", "pending")
    .select("id");
  if (error) {
    console.error("Commission void failed:", error);
    return true;
  }
  if (voided && voided.length > 0) {
    console.log(`↩️  Voided ${voided.length} commission(s) (${reason}) for ${ids.join(", ")}`);
  }
  // Already-paid commissions can't be auto-reclaimed — flag for manual clawback.
  const { data: paid } = await supabaseAdmin
    .from("commissions")
    .select("id, amount_cents, affiliate_id")
    .in("stripe_invoice_id", ids)
    .eq("status", "paid");
  for (const p of paid ?? []) {
    console.warn(`⚠️  MANUAL CLAWBACK: paid commission ${p.id} (affiliate ${p.affiliate_id}, ${p.amount_cents}c) was reversed (${reason}).`);
  }
  return false;
}

// Map a refunded/disputed payment_intent back to its invoice id(s). Subscription
// commissions are keyed on the invoice id (in_…), and on API 2026-02-25.clover a
// Charge/PaymentIntent no longer exposes `invoice` directly — the link lives on
// InvoicePayment, so we resolve it there.
async function invoiceRefsForPaymentIntent(pi: string | null | undefined): Promise<string[]> {
  if (!pi) return [];
  try {
    const list = await stripe.invoicePayments.list({
      payment: { type: "payment_intent", payment_intent: pi },
      limit: 10,
    });
    return list.data.map((p) => stripeId(p.invoice)).filter((id): id is string => !!id);
  } catch (err) {
    console.error("invoicePayments lookup failed:", err);
    return [];
  }
}

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

  // Idempotency guard — insert FIRST. If the id is already there, a prior delivery
  // fully succeeded → ack and stop (prevents double commissions / double-counting the
  // lifetime counter on Stripe retries). If a money-write fails below, we DELETE this
  // row and return non-2xx so Stripe redelivers and we reprocess cleanly.
  const { error: guardError } = await supabaseAdmin
    .from("processed_stripe_events")
    .insert({ id: event.id });
  if (guardError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  // guardWritten === the dedup ledger row is durably in place. If the guard insert
  // failed (transient), we still process best-effort — commission inserts are
  // independently deduped by their unique invoice id — but NON-idempotent side
  // effects (the lifetime counter) must be skipped, or a later redelivery (which
  // would now find no ledger row) could run them a second time.
  const guardWritten = !guardError;
  if (guardError) {
    console.error("Idempotency guard insert error:", guardError);
  }

  let needsRetry = false;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const lifetimePriceId = process.env.STRIPE_PRICE_LIFETIME || "price_1TIuBBFINW44xCyFoSCtUpFN";

    let planType = "semester";
    let paidPriceIdForReferral: string | null = null;

    if (session.mode === "payment") {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const paidPriceId = lineItems.data[0]?.price?.id;
      paidPriceIdForReferral = paidPriceId ?? null;
      planType = paidPriceId === lifetimePriceId ? "lifetime" : "semester";
    } else if (session.mode === "subscription" && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id;
      paidPriceIdForReferral = priceId ?? null;
      planType = planTypeFromPrice(priceId);
    }

    // (A) Affiliate attribution — runs regardless of our profile bookkeeping. The
    // customer paid and the creator earned even if our profiles row never resolves,
    // so this must not be coupled to the plan-provisioning success/failure below.
    try {
      needsRetry = (await recordAffiliateAttribution(session)) || needsRetry;
    } catch (err) {
      console.error("Affiliate attribution error:", err);
    }

    // (B) Provision the plan. A missing userId / profile is logged but NOT retried
    // forever (it's deterministic); a real DB error IS retried.
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error("checkout.session.completed has no metadata.userId — plan not provisioned");
    } else {
      const { error: updateError, data: updatedRows } = await supabaseAdmin
        .from("profiles")
        .update({ plan_type: planType })
        .eq("id", userId)
        .select("id");

      if (updateError) {
        console.error("Supabase update error:", updateError);
        needsRetry = true;
      } else if (!updatedRows || updatedRows.length === 0) {
        console.error(`No profile found for userId: ${userId}`);
      } else {
        console.log(`✅ Plan updated to "${planType}" for userId: ${userId}`);

        // Buddy Pass referral reward (peer-to-peer; separate from the affiliate program).
        if (
          session.metadata?.referrerId &&
          session.metadata?.referralCode &&
          session.metadata?.referredUserId === userId &&
          session.metadata.referrerId !== userId
        ) {
          try {
            const referrerId = session.metadata.referrerId;
            const referralCode = session.metadata.referralCode;

            const { data: existingSessionReward } = await supabaseAdmin
              .from("buddy_pass_referrals")
              .select("id")
              .eq("checkout_session_id", session.id)
              .maybeSingle();

            const { data: existingUserReward } = await supabaseAdmin
              .from("buddy_pass_referrals")
              .select("id")
              .eq("referred_user_id", userId)
              .eq("status", "rewarded")
              .limit(1)
              .maybeSingle();

            if (!existingSessionReward && !existingUserReward) {
              const { error: insertError } = await supabaseAdmin
                .from("buddy_pass_referrals")
                .insert({
                  referrer_id: referrerId,
                  referred_user_id: userId,
                  referral_code: referralCode,
                  checkout_session_id: session.id,
                  stripe_customer_id: stripeId(session.customer),
                  price_id: paidPriceIdForReferral,
                  status: "rewarded",
                  discount_percent: 25,
                  reward_weeks: 1,
                  rewarded_at: new Date().toISOString(),
                });

              if (insertError) {
                console.error("Buddy Pass referral insert failed:", insertError);
              } else {
                const { error: grantError } = await supabaseAdmin.rpc("grant_buddy_pass_week", {
                  p_referrer_id: referrerId,
                  p_weeks: 1,
                });
                if (grantError) console.error("Buddy Pass reward grant failed:", grantError);
                else console.log(`✅ Buddy Pass reward granted to referrerId: ${referrerId}`);
              }
            }
          } catch (err) {
            console.error("Buddy Pass reward error:", err);
          }
        }

        // Increment lifetime-spots counter — only when we're NOT about to retry, so a
        // redelivery (which re-runs this handler) can't inflate the count. The
        // insert-first guard makes the success path run exactly once.
        if (planType === "lifetime" && !needsRetry && guardWritten) {
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
    }
  }

  // Helper: look up userId from subscription metadata first, then checkout metadata.
  async function userIdFromSubscription(subscriptionId: string): Promise<string | null> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.metadata?.userId) {
      return subscription.metadata.userId;
    }
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
      await supabaseAdmin.from("profiles").update({ plan_type: "free" }).eq("id", userId);
      console.log(`⬇️  Subscription deleted → downgraded userId: ${userId} to free`);
    }
  }

  // Subscription updated — downgrade only on TERMINAL states (keep access through the
  // past_due dunning window), and catch cancel_at_period_end being newly set.
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const downgradeStatuses = ["unpaid", "canceled", "incomplete_expired"];

    // Only downgrade on TERMINAL statuses. A scheduled cancel (cancel_at_period_end)
    // keeps the subscription active and paid through the current period — do NOT strip
    // access then; the downgrade happens at period end via customer.subscription.deleted.
    // (This also means reactivating before period end keeps access, since it was never
    // downgraded.)
    if (downgradeStatuses.includes(sub.status)) {
      const userId = await userIdFromSubscription(sub.id);
      if (userId) {
        await supabaseAdmin.from("profiles").update({ plan_type: "free" }).eq("id", userId);
        console.log(`⬇️  Subscription status "${sub.status}" → downgraded userId: ${userId} to free`);
      }
    }
  }

  // Invoice payment succeeded — re-grant plan on renewal + record the recurring
  // affiliate commission for this cycle.
  if (event.type === "invoice.paid") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = event.data.object as any;
    if (invoice.billing_reason === "subscription_cycle") {
      const subscriptionId: string | undefined =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id ??
            (invoice.parent?.type === "subscription_details"
              ? invoice.parent?.subscription_details?.subscription
              : undefined);
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (!sub.cancel_at_period_end) {
          const userId = await userIdFromSubscription(subscriptionId);
          if (userId) {
            const priceId = sub.items.data[0]?.price.id;
            const planType = planTypeFromPrice(priceId);
            await supabaseAdmin.from("profiles").update({ plan_type: planType }).eq("id", userId);
            console.log(`🔄  Renewal succeeded → kept userId: ${userId} on "${planType}"`);
          }
        }

        // Recurring commission — independent of cancel state (the payment was made).
        try {
          needsRetry = (await recordRenewalCommission(invoice, subscriptionId)) || needsRetry;
        } catch (err) {
          console.error("Affiliate renewal commission error:", err);
        }
      }
    }
  }

  // Invoice payment failed — keep access through the grace window; just log.
  if (event.type === "invoice.payment_failed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = event.data.object as any;
    const subscriptionId: string | undefined =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ??
          (invoice.parent?.type === "subscription_details"
            ? invoice.parent?.subscription_details?.subscription
            : undefined);
    if (subscriptionId) {
      const userId = await userIdFromSubscription(subscriptionId);
      console.log(`⏳  Payment failed (grace period — access kept) userId: ${userId ?? "unknown"} sub: ${subscriptionId}`);
    }
  }

  // Refund — void the commission so the creator isn't paid on returned money. Only
  // act on a FULL refund; partial refunds are left for manual review.
  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge & { invoice?: string | Stripe.Invoice | null };
    if (charge.amount_refunded >= charge.amount) {
      const pi = stripeId(charge.payment_intent);
      // payment_intent covers one-time commissions; resolve the invoice id for
      // subscription commissions (charge.invoice is not populated on this API version).
      const refs = [stripeId(charge.invoice), pi, ...(await invoiceRefsForPaymentIntent(pi))];
      needsRetry = (await voidCommissionsForRefs(refs, "refund")) || needsRetry;
    }
  }

  // Chargeback opened — the business will likely lose the funds; void the commission.
  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object as Stripe.Dispute;
    const pi = stripeId(dispute.payment_intent);
    const refs: (string | null)[] = [pi, ...(await invoiceRefsForPaymentIntent(pi))];
    const chargeId = stripeId(dispute.charge);
    if (chargeId) {
      try {
        const charge = (await stripe.charges.retrieve(chargeId)) as Stripe.Charge & {
          invoice?: string | Stripe.Invoice | null;
        };
        const chPi = stripeId(charge.payment_intent);
        refs.push(stripeId(charge.invoice), chPi, ...(await invoiceRefsForPaymentIntent(chPi)));
      } catch (err) {
        console.error("Could not retrieve disputed charge:", err);
      }
    }
    needsRetry = (await voidCommissionsForRefs(refs, "dispute")) || needsRetry;
  }

  // Finalize. If a money-write failed transiently, un-mark the event and return 500
  // so Stripe redelivers; the idempotent retry re-records cleanly.
  if (needsRetry) {
    await supabaseAdmin.from("processed_stripe_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "transient failure, please retry" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
