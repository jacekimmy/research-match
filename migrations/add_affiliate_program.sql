-- Affiliate / creator revenue-share program.
--
-- The five tables below ALREADY EXIST in production (created earlier but never wired
-- into the app). This file documents them in source control and — the part that
-- actually matters — adds the indexes the Stripe webhook relies on to attribute sales
-- and to make commissions double-count-proof.
--
-- Safe + idempotent: CREATE TABLE/INDEX IF NOT EXISTS are no-ops on the existing
-- objects. Run it in the Supabase SQL Editor before deploying the wired webhook.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  payout_email text,
  code text,
  stripe_promotion_code_id text,
  commission_rate numeric NOT NULL DEFAULT 0.30,  -- 0.30 = 30%
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  stripe_invoice_id text,  -- invoice id (subscriptions) or payment_intent/session id (one-time)
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',  -- pending | paid | void
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  provider text,
  external_id text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Webhook idempotency ledger: one row per Stripe event id we've fully processed.
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One affiliate per code / per promo code; fast lookup from the webhook.
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_code_unique
  ON public.affiliates (code) WHERE code IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_promo_code_unique
  ON public.affiliates (stripe_promotion_code_id) WHERE stripe_promotion_code_id IS NOT NULL;

-- CRITICAL: never record two commissions for the same Stripe invoice / payment.
-- This is the hard backstop behind the webhook's check-before-insert.
CREATE UNIQUE INDEX IF NOT EXISTS commissions_invoice_unique
  ON public.commissions (stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- One referral per subscription. Non-partial so the webhook's idempotent
-- upsert(onConflict: stripe_subscription_id) works; NULLs (one-time payments) are
-- treated as distinct, so multiple NULL-subscription referrals are still allowed.
-- First collapse any pre-existing duplicate subscription rows (keep the earliest),
-- repointing their commissions to the survivor, so the UNIQUE index can't abort on
-- dirty data. (No-op on an empty/clean table.)
UPDATE public.commissions c
SET referral_id = keep.keep_id
FROM (
  SELECT id,
         first_value(id) OVER (PARTITION BY stripe_subscription_id ORDER BY created_at, id) AS keep_id
  FROM public.referrals
  WHERE stripe_subscription_id IS NOT NULL
) keep
WHERE c.referral_id = keep.id AND keep.id <> keep.keep_id;

DELETE FROM public.referrals r
USING (
  SELECT id, row_number() OVER (PARTITION BY stripe_subscription_id ORDER BY created_at, id) AS rn
  FROM public.referrals
  WHERE stripe_subscription_id IS NOT NULL
) d
WHERE r.id = d.id AND d.rn > 1;

DROP INDEX IF EXISTS referrals_subscription_idx;
CREATE UNIQUE INDEX IF NOT EXISTS referrals_subscription_unique
  ON public.referrals (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS referrals_affiliate_customer_idx
  ON public.referrals (affiliate_id, stripe_customer_id);
CREATE INDEX IF NOT EXISTS commissions_affiliate_status_idx
  ON public.commissions (affiliate_id, status);
