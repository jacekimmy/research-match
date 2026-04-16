import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client — only available server-side
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type FundingStatus = "ACTIVE" | "NOT_RECENT" | "UNKNOWN";

interface ProfessorInput {
  id: string;          // short OpenAlex ID, e.g. "A2123456789"
  name: string;
  institution: string;
}

/**
 * POST /api/funding-pulse
 *
 * Body: { professors: [{ id, name, institution }] }
 *
 * - Upserts each professor into professor_funding (UNKNOWN by default,
 *   ignoring rows that already have a real status).
 * - Returns the current funding_status for every supplied ID.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const professors: ProfessorInput[] = Array.isArray(body?.professors)
      ? body.professors.slice(0, 50) // cap per-request to prevent abuse
      : [];

    if (professors.length === 0) {
      return NextResponse.json({ statuses: {} });
    }

    const supabase = getSupabase();

    // Upsert rows — only insert new ones (ignoreDuplicates keeps existing statuses)
    const rows = professors.map((p) => ({
      openalex_id: p.id,
      display_name: p.name ?? "",
      institution: p.institution ?? "",
      funding_status: "UNKNOWN" as FundingStatus,
      last_funding_check: null,
    }));

    await supabase
      .from("professor_funding")
      .upsert(rows, { onConflict: "openalex_id", ignoreDuplicates: true });

    // Fetch current statuses for all supplied IDs
    const ids = professors.map((p) => p.id);
    const { data, error } = await supabase
      .from("professor_funding")
      .select("openalex_id, funding_status")
      .in("openalex_id", ids);

    if (error) {
      console.error("funding-pulse fetch error:", error.message);
      return NextResponse.json({ statuses: {} });
    }

    const statuses: Record<string, FundingStatus> = {};
    for (const row of data ?? []) {
      statuses[row.openalex_id] = row.funding_status as FundingStatus;
    }

    return NextResponse.json({ statuses });
  } catch (err) {
    console.error("funding-pulse error:", err);
    return NextResponse.json({ statuses: {} });
  }
}

/**
 * GET /api/funding-pulse?ids=A123,A456
 *
 * Lightweight read-only endpoint — returns statuses for a comma-separated
 * list of OpenAlex IDs without any upsert side-effect.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ids = (searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ statuses: {} });
  }

  const supabase = getSupabase();
  const { data } = await supabase
    .from("professor_funding")
    .select("openalex_id, funding_status")
    .in("openalex_id", ids);

  const statuses: Record<string, FundingStatus> = {};
  for (const row of data ?? []) {
    statuses[row.openalex_id] = row.funding_status as FundingStatus;
  }

  return NextResponse.json({ statuses });
}
