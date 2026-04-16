-- Add Funding Pulse fields to professors table
-- Valid funding_status values: ACTIVE, NOT_RECENT, UNKNOWN
-- Run this in Supabase SQL Editor

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'professors'
  ) THEN
    ALTER TABLE public.professors
      ADD COLUMN IF NOT EXISTS funding_status text,
      ADD COLUMN IF NOT EXISTS last_funding_check timestamptz;

    ALTER TABLE public.professors
      DROP CONSTRAINT IF EXISTS professors_funding_status_check;

    ALTER TABLE public.professors
      ADD CONSTRAINT professors_funding_status_check
      CHECK (funding_status IS NULL OR funding_status IN ('ACTIVE', 'NOT_RECENT', 'UNKNOWN'));

    CREATE INDEX IF NOT EXISTS idx_professors_funding_status
      ON public.professors (funding_status);

    CREATE INDEX IF NOT EXISTS idx_professors_last_funding_check
      ON public.professors (last_funding_check);
  ELSE
    RAISE NOTICE 'Table public.professors not found. Skipping funding status migration.';
  END IF;
END $$;
