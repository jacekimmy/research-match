-- Grandfather existing weekly subscribers for email checker access.
-- New weekly subscribers will default to false (no email checker).
-- Existing weekly subscribers are set to true before this column is added.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_checker_grandfathered boolean NOT NULL DEFAULT false;

-- Grant access to all currently active weekly subscribers
UPDATE public.profiles
  SET email_checker_grandfathered = true
  WHERE plan_type = 'weekly';
