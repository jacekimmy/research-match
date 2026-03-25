import { NextRequest, NextResponse } from "next/server";

interface AuthorInput {
  id: string;
  works_count: number;
  cited_by_count: number;
  has_institution: boolean;
}

interface ScoredAuthor {
  id: string;
  score: number;
}

export async function POST(req: NextRequest) {
  try {
    const { authors }: { authors: AuthorInput[] } = await req.json();
    const fiveYearsAgo = new Date().getFullYear() - 5;

    const scored: ScoredAuthor[] = await Promise.all(
      authors.map(async (author) => {
        let score = 0;
        const authorId = author.id.split("/").pop();

        // +2 for 15+ total publications
        if (author.works_count >= 15) score += 2;

        // -3 for fewer than 5 papers
        if (author.works_count < 5) score -= 3;

        // +1 for having institutional affiliation
        if (author.has_institution) score += 1;

        // Fetch recent works to check last-author status and publishing span
        try {
          const worksRes = await fetch(
            `https://api.openalex.org/works?filter=author.id:${authorId},publication_year:>${fiveYearsAgo}&sort=publication_year:desc&per_page=15&select=authorships,publication_year`,
            { signal: AbortSignal.timeout(5000) }
          );
          const worksData = await worksRes.json();
          const works = worksData.results ?? [];

          // Count last-author appearances
          let lastAuthorCount = 0;
          let onlyFirstMiddle = true;
          const years: number[] = [];

          for (const w of works) {
            if (w.publication_year) years.push(w.publication_year);
            const authorship = w.authorships?.find(
              (a: any) => a.author?.id === `https://openalex.org/${authorId}`
            );
            if (authorship) {
              if (authorship.author_position === "last") {
                lastAuthorCount++;
                onlyFirstMiddle = false;
              } else if (authorship.author_position !== "first" && authorship.author_position !== "middle") {
                onlyFirstMiddle = false;
              }
            }
          }

          // +3 for last author on 3+ papers (runs a lab)
          if (lastAuthorCount >= 3) score += 3;

          // -2 if only first/middle author (likely grad student/postdoc)
          if (onlyFirstMiddle && works.length >= 3) score -= 2;

          // +2 for publishing span of 5+ years
          if (years.length >= 2) {
            const span = Math.max(...years) - Math.min(...years);
            if (span >= 5) score += 2;
          }
        } catch {
          // If works fetch fails, score based on what we have
        }

        return { id: author.id, score };
      })
    );

    return NextResponse.json({ scored });
  } catch (err) {
    console.error("score-authors error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
