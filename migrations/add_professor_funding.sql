-- Add professor_funding table for Funding Pulse feature
-- Run this in Supabase SQL Editor

CREATE TYPE funding_status_enum AS ENUM ('ACTIVE', 'NOT_RECENT', 'UNKNOWN');

CREATE TABLE IF NOT EXISTS professor_funding (
  openalex_id       text PRIMARY KEY,
  display_name      text NOT NULL,
  institution       text NOT NULL DEFAULT '',
  funding_status    funding_status_enum NOT NULL DEFAULT 'UNKNOWN',
  last_funding_check timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Index to efficiently find stale records for the background updater
CREATE INDEX IF NOT EXISTS idx_professor_funding_stale
  ON professor_funding (last_funding_check ASC NULLS FIRST);

-- Row Level Security: readable by anyone (funding is public info),
-- only writable via service role key (background script + API route)
ALTER TABLE professor_funding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON professor_funding
  FOR SELECT USING (true);
