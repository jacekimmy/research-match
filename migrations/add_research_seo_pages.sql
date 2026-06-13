-- Programmatic SEO: /research/[field-slug] field pages.
-- Run this in the Supabase SQL Editor before running the seo-fetch / seo-generate scripts.
--
-- Two tables back the static pages:
--   field_professors — real, recently-publishing professors per field (the moat + anti-spam signal)
--   field_content    — per-field generated copy (meta, email angle, overview, FAQ)
--
-- Both hold PUBLIC, non-sensitive SEO content: RLS is enabled with a read-only
-- policy for anon/authenticated so pages can read them; all writes go through the
-- service-role key (which bypasses RLS) from the fetch/generate scripts.

create extension if not exists pgcrypto;

-- ── field_professors ────────────────────────────────────────────────────────
create table if not exists public.field_professors (
  id uuid primary key default gen_random_uuid(),
  field_slug text not null,
  field_name text not null,
  professor_name text not null,
  institution text,
  recent_topic text,
  openalex_author_id text,
  last_publication_year int,
  created_at timestamptz not null default now()
);

create index if not exists field_professors_field_slug_idx
  on public.field_professors (field_slug);

-- Dedupe per field so re-running the fetch script upserts instead of duplicating.
create unique index if not exists field_professors_field_author_unique
  on public.field_professors (field_slug, openalex_author_id);

-- ── field_content ───────────────────────────────────────────────────────────
create table if not exists public.field_content (
  field_slug text primary key,
  field_name text not null,
  meta_title text,
  meta_description text,
  email_angle text,
  research_overview text,
  remote_friendly text,
  faq jsonb,
  created_at timestamptz not null default now()
);

alter table public.field_content
  drop constraint if exists field_content_remote_friendly_check;
alter table public.field_content
  add constraint field_content_remote_friendly_check
  check (remote_friendly is null or remote_friendly in ('remote-friendly', 'hands-on', 'mixed'));

-- ── Row Level Security: public read, service-role-only writes ────────────────
alter table public.field_professors enable row level security;
alter table public.field_content enable row level security;

drop policy if exists "field_professors public read" on public.field_professors;
create policy "field_professors public read"
  on public.field_professors for select
  to anon, authenticated
  using (true);

drop policy if exists "field_content public read" on public.field_content;
create policy "field_content public read"
  on public.field_content for select
  to anon, authenticated
  using (true);
