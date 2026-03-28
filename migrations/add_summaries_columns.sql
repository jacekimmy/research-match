-- Add summaries tracking columns to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS summaries_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS summaries_reset_at timestamptz DEFAULT (date_trunc('month', now()) + interval '1 month');
