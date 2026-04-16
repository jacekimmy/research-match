import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type FundingStatus = "ACTIVE" | "NOT_RECENT" | "UNKNOWN";

interface ProfessorLookupInput {
  authorId: string;
  name?: string;
  institution?: string;
}

interface FundingStatusMap {
  [authorId: string]: FundingStatus;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeStatus(value: unknown): FundingStatus {
  if (value === "ACTIVE" || value === "NOT_RECENT") return value;
  return "UNKNOWN";
}

function toShortAuthorId(authorId: string): string {
  const trimmed = String(authorId || "").trim();
  if (!trimmed) return "";
  return trimmed.includes("/") ? trimmed.split("/").pop() || "" : trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const { professors }: { professors: ProfessorLookupInput[] } = await req.json();

    if (!Array.isArray(professors) || professors.length === 0) {
      return NextResponse.json({ fundingByAuthorId: {} });
    }

    const shortIds = Array.from(new Set(professors.map((p) => toShortAuthorId(p.authorId)).filter(Boolean)));
    const fundingByAuthorId: FundingStatusMap = {};

    for (const p of professors) {
      fundingByAuthorId[toShortAuthorId(p.authorId)] = "UNKNOWN";
    }

    const candidateOpenAlexColumns = ["openalex_author_id", "openalex_id"];
    let rows: unknown[] = [];

    for (const column of candidateOpenAlexColumns) {
      const { data, error } = await supabaseAdmin
        .from("professors")
        .select(`${column}, funding_status`)
        .in(column, shortIds);

      if (!error) {
        rows = Array.isArray(data) ? data : [];
        if (rows.length > 0) {
          for (const rawRow of rows) {
            const row = rawRow as Record<string, unknown>;
            const id = toShortAuthorId(String(row?.[column] ?? ""));
            if (!id) continue;
            fundingByAuthorId[id] = normalizeStatus(row?.funding_status);
          }
        }
        break;
      }
    }

    return NextResponse.json({ fundingByAuthorId });
  } catch (err) {
    console.error("funding-status error:", err);
    return NextResponse.json({ fundingByAuthorId: {} });
  }
}
