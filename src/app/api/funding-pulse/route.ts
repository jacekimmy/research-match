import { NextRequest, NextResponse } from "next/server";

function splitName(displayName: string): { first: string | null; last: string | null } {
  const cleaned = String(displayName ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { first: null, last: null };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { first: null, last: parts[0] };
  const last = parts[parts.length - 1];
  const first = parts[0];
  return { first, last };
}

export async function POST(req: NextRequest) {
  try {
    const { piName } = await req.json();
    const name = String(piName ?? "").trim();
    if (!name) return NextResponse.json({ error: "piName required" }, { status: 400 });

    const { first, last } = splitName(name);
    if (!last) return NextResponse.json({ error: "Invalid piName" }, { status: 400 });

    const nowYear = new Date().getFullYear();
    const fiscalYears = [nowYear, nowYear - 1];

    // NIH RePORTER v2
    // Docs: https://api.reporter.nih.gov/
    const payload = {
      criteria: {
        fiscal_years: fiscalYears,
        pi_names: [
          {
            last_name: last,
            ...(first ? { first_name: first } : {}),
          },
        ],
      },
      include_fields: [
        "project_title",
        "award_amount",
        "fiscal_year",
        "project_start_date",
        "project_end_date",
        "organization",
        "activity",
        "award_notice_date",
        "principal_investigators",
        "project_num",
      ],
      offset: 0,
      limit: 10,
      sort_field: "award_notice_date",
      sort_order: "desc",
    };

    const res = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch NIH funding" }, { status: 502 });
    }

    const data = await res.json();
    const projects: any[] = data?.results ?? [];

    const normalized = projects.slice(0, 5).map((p) => ({
      title: p?.project_title ?? "",
      awardAmount: p?.award_amount ?? null,
      fiscalYear: p?.fiscal_year ?? null,
      awardNoticeDate: p?.award_notice_date ?? null,
      org: p?.organization?.org_name ?? p?.organization?.name ?? null,
      activity: p?.activity ?? null,
      projectNum: p?.project_num ?? null,
    }));

    // Heuristic: if there is an award notice date within last 365 days, mark as "recentlyFunded".
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const mostRecent = normalized.find((p) => p.awardNoticeDate) ?? null;
    const mostRecentDate = mostRecent?.awardNoticeDate ? new Date(mostRecent.awardNoticeDate) : null;

    return NextResponse.json({
      piName: name,
      source: "NIH RePORTER",
      projects: normalized,
      summary: {
        projectCount: projects.length,
        mostRecentAwardNoticeDate: mostRecent?.awardNoticeDate ?? null,
        recentlyFunded: !!(mostRecentDate && mostRecentDate > oneYearAgo),
      },
    });
  } catch (err) {
    console.error("funding-pulse error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
