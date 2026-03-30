import { NextRequest, NextResponse } from "next/server";

interface Authorship {
  author: {
    id: string;
    display_name: string;
  };
  author_position: string;
  institutions: unknown[];
}

interface Work {
  id: string;
  publication_date: string;
  authorships: Authorship[];
}

interface ResponsivenessResult {
  level: "likely_takes_students" | "may_not_take_students" | "inactive_lab" | "unknown";
  label: string;
  tooltip: string;
}

const UNKNOWN_RESULT: ResponsivenessResult = {
  level: "unknown",
  label: "Unknown",
  tooltip: "Based on publication patterns and co-author history",
};

export async function POST(req: NextRequest) {
  try {
    const { authorId }: { authorId: string } = await req.json();

    if (!authorId) {
      return NextResponse.json(UNKNOWN_RESULT);
    }

    const cleanId = authorId.replace("https://openalex.org/", "");

    const now = new Date();
    const threeYearsAgo = new Date(now);
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const threeYearsAgoStr = threeYearsAgo.toISOString().split("T")[0];

    const worksRes = await fetch(
      `https://api.openalex.org/works?filter=author.id:${cleanId},from_publication_date:${threeYearsAgoStr}&per_page=100&select=id,publication_date,authorships&mailto=jace@researchmatch.net`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!worksRes.ok) {
      return NextResponse.json(UNKNOWN_RESULT);
    }

    const worksData = await worksRes.json();
    const works: Work[] = worksData.results ?? [];

    if (works.length === 0) {
      return NextResponse.json({
        level: "inactive_lab",
        label: "Inactive Lab",
        tooltip: "Based on publication patterns and co-author history",
      });
    }

    // Check recency of publications
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const publishedLast12 = works.some(
      (w) => new Date(w.publication_date) >= oneYearAgo
    );
    const publishedLast24 = works.some(
      (w) => new Date(w.publication_date) >= twoYearsAgo
    );

    if (!publishedLast24) {
      return NextResponse.json({
        level: "inactive_lab",
        label: "Inactive Lab",
        tooltip: "Based on publication patterns and co-author history",
      });
    }

    // Extract all unique co-authors (excluding the target author)
    const targetAuthorUrl = `https://openalex.org/${cleanId}`;
    const coAuthorMap = new Map<
      string,
      { displayName: string; worksCount: number; years: Set<number> }
    >();

    for (const work of works) {
      const pubYear = new Date(work.publication_date).getFullYear();
      for (const authorship of work.authorships ?? []) {
        const coAuthorId = authorship.author?.id;
        if (!coAuthorId || coAuthorId === targetAuthorUrl) continue;

        if (!coAuthorMap.has(coAuthorId)) {
          coAuthorMap.set(coAuthorId, {
            displayName: authorship.author.display_name,
            worksCount: 0,
            years: new Set(),
          });
        }
        const entry = coAuthorMap.get(coAuthorId)!;
        entry.years.add(pubYear);
      }
    }

    // Check each co-author's works_count from the authorships data
    // We look at the raw authorships to count how many works each co-author appears in
    const coAuthorWorkCounts = new Map<string, number>();
    for (const work of works) {
      for (const authorship of work.authorships ?? []) {
        const coAuthorId = authorship.author?.id;
        if (!coAuthorId || coAuthorId === targetAuthorUrl) continue;
        coAuthorWorkCounts.set(
          coAuthorId,
          (coAuthorWorkCounts.get(coAuthorId) ?? 0) + 1
        );
      }
    }

    // Count co-authors with fewer than 5 works (likely students)
    let newStudentCoAuthors = 0;
    for (const [coAuthorId, count] of coAuthorWorkCounts) {
      if (count < 5) {
        newStudentCoAuthors++;
      }
    }

    // Group co-authors by year to see if new names appear each year
    const coAuthorsByYear = new Map<number, Set<string>>();
    for (const [coAuthorId, entry] of coAuthorMap) {
      for (const year of entry.years) {
        if (!coAuthorsByYear.has(year)) {
          coAuthorsByYear.set(year, new Set());
        }
        coAuthorsByYear.get(year)!.add(coAuthorId);
      }
    }

    // Determine badge level
    if (newStudentCoAuthors >= 2 && publishedLast12) {
      return NextResponse.json({
        level: "likely_takes_students",
        label: "Likely Takes Students",
        tooltip: "Based on publication patterns and co-author history",
      });
    }

    return NextResponse.json({
      level: "may_not_take_students",
      label: "May Not Take Students",
      tooltip: "Based on publication patterns and co-author history",
    });
  } catch (err) {
    console.error("responsiveness error:", err);
    return NextResponse.json(UNKNOWN_RESULT);
  }
}
