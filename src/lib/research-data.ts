// Read helpers for the programmatic /research pages. These run at BUILD time
// (generateStaticParams + static page render), never on a user request — the
// pages are fully static. Reads go through the shared anon Supabase client; the
// field_professors / field_content tables expose a public-read RLS policy.
import { supabase } from "@/lib/supabase";

export interface FieldProfessor {
  professor_name: string;
  institution: string | null;
  recent_topic: string | null;
  openalex_author_id: string | null;
  last_publication_year: number | null;
}

export interface FieldFaqItem {
  question: string;
  answer: string;
}

export interface FieldContent {
  field_slug: string;
  field_name: string;
  meta_title: string | null;
  meta_description: string | null;
  email_angle: string | null;
  research_overview: string | null;
  remote_friendly: "remote-friendly" | "hands-on" | "mixed" | null;
  faq: FieldFaqItem[] | null;
}

export async function getFieldContent(slug: string): Promise<FieldContent | null> {
  const { data } = await supabase
    .from("field_content")
    .select("*")
    .eq("field_slug", slug)
    .single();
  return (data as FieldContent) ?? null;
}

export async function getFieldProfessors(slug: string): Promise<FieldProfessor[]> {
  const { data } = await supabase
    .from("field_professors")
    .select("professor_name, institution, recent_topic, openalex_author_id, last_publication_year")
    .eq("field_slug", slug)
    .order("last_publication_year", { ascending: false });
  return (data as FieldProfessor[]) ?? [];
}

/** Slugs that actually have generated content — the only pages we build. */
export async function getPopulatedFieldSlugs(): Promise<string[]> {
  const { data } = await supabase.from("field_content").select("field_slug");
  return (data ?? []).map((r: { field_slug: string }) => r.field_slug);
}

/** Index-page rows: every field that has content. */
export async function getAllFieldContent(): Promise<FieldContent[]> {
  const { data } = await supabase
    .from("field_content")
    .select("*")
    .order("field_name", { ascending: true });
  return (data as FieldContent[]) ?? [];
}
