-- Harden RLS on public.profiles.
--
-- Why: the profiles row is created from the browser at signup (src/lib/auth-context.tsx),
-- so without a strict WITH CHECK a tampered client could insert plan_type='lifetime'
-- (free paid access) or someone else's email. API routes now use the auth-verified
-- email for Stripe lookups, but the table itself should also refuse bad rows.
--
-- The only client-side writes in the app are: SELECT own row, and the signup INSERT
-- with plan_type='free' and the user's own email. Everything else (plan changes,
-- usage counters, promo grants) goes through API routes using the service role,
-- which bypasses RLS and these grants.
--
-- Apply in the Supabase SQL editor. Run the verification query at the bottom after.

alter table public.profiles enable row level security;

-- Signup insert: own id, own (auth-verified) email, free plan only.
drop policy if exists "profiles self insert free only" on public.profiles;
create policy "profiles self insert free only"
  on public.profiles for insert
  to authenticated
  with check (
    id = auth.uid()
    and plan_type = 'free'
    and lower(email) = lower(coalesce(auth.email(), ''))
  );

-- Users read their own profile.
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- No client-side updates or deletes at all (nothing in the app does them).
revoke update, delete on table public.profiles from anon, authenticated;

-- NOTE: if an older permissive insert/select policy exists with a different name,
-- drop it too — list them with:
--   select policyname, cmd, qual, with_check from pg_policies where tablename = 'profiles';
