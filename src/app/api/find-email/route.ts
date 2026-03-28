import { NextRequest, NextResponse } from "next/server";

interface EmailResult {
  email: string;
  source: string; // "orcid", "openalex", "pattern"
  confidence: "verified" | "likely" | "guess";
}

export async function POST(req: NextRequest) {
  try {
    const { authorId, authorName, institution } = await req.json();
    if (!authorId) {
      return NextResponse.json({ error: "authorId required" }, { status: 400 });
    }

    const emails: EmailResult[] = [];
    let orcidId: string | null = null;
    let homepageUrl: string | null = null;

    // 1. Fetch author from OpenAlex to get ORCID and homepage
    try {
      const authorRes = await fetch(
        `https://api.openalex.org/authors/${authorId}?select=orcid,ids,last_known_institutions,display_name`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (authorRes.ok) {
        const authorData = await authorRes.json();
        if (authorData.orcid) {
          orcidId = authorData.orcid.replace("https://orcid.org/", "");
        }
        // OpenAlex sometimes has a homepage in ids
        if (authorData.ids?.openalex) {
          // We'll use the OpenAlex page as a reference
        }
      }
    } catch { /* continue */ }

    // 2. If we have ORCID, fetch their public profile for email
    if (orcidId) {
      try {
        const orcidRes = await fetch(
          `https://pub.orcid.org/v3.0/${orcidId}/email`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (orcidRes.ok) {
          const orcidData = await orcidRes.json();
          const orcidEmails = orcidData.email || [];
          for (const e of orcidEmails) {
            if (e.email) {
              emails.push({
                email: e.email,
                source: "orcid",
                confidence: "verified",
              });
            }
          }
        }
      } catch { /* continue */ }

      // Also check ORCID for personal websites / faculty pages
      try {
        const orcidRes = await fetch(
          `https://pub.orcid.org/v3.0/${orcidId}/researcher-urls`,
          {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (orcidRes.ok) {
          const urlData = await orcidRes.json();
          const urls = urlData["researcher-url"] || [];
          for (const u of urls) {
            const url = u.url?.value;
            if (url && (url.includes(".edu") || url.includes("faculty") || url.includes("staff") || url.includes("people"))) {
              homepageUrl = url;
              break;
            }
          }
        }
      } catch { /* continue */ }
    }

    // 3. Check recent papers for corresponding author email
    try {
      const worksRes = await fetch(
        `https://api.openalex.org/works?filter=author.id:${authorId}&sort=publication_year:desc&per_page=10&select=corresponding_author_ids,corresponding_institution_ids,authorships`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (worksRes.ok) {
        const worksData = await worksRes.json();
        const works = worksData.results ?? [];

        for (const work of works) {
          // Check if this author is the corresponding author
          const isCorresponding = work.corresponding_author_ids?.some(
            (id: string) => id === `https://openalex.org/${authorId}`
          );

          if (isCorresponding) {
            // Check authorships for raw_author_name with email
            for (const authorship of work.authorships ?? []) {
              if (
                authorship.author?.id === `https://openalex.org/${authorId}` &&
                authorship.raw_author_name
              ) {
                // Some entries have email in the raw data
                const emailMatch = authorship.raw_author_name.match(
                  /[\w.-]+@[\w.-]+\.\w+/
                );
                if (emailMatch) {
                  emails.push({
                    email: emailMatch[0],
                    source: "openalex",
                    confidence: "verified",
                  });
                }
              }
            }
          }
        }
      }
    } catch { /* continue */ }

    // 4. Try to scrape faculty page for email if we found a homepage
    if (homepageUrl && emails.length === 0) {
      try {
        const pageRes = await fetch(homepageUrl, {
          signal: AbortSignal.timeout(5000),
          headers: {
            "User-Agent": "ResearchMatch/1.0 (academic tool)",
          },
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          // Find emails in the page
          const emailRegex = /[\w.-]+@[\w.-]+\.(?:edu|ac\.\w+|org)/gi;
          const foundEmails = html.match(emailRegex) || [];
          // Filter out common false positives
          const filtered = [...new Set(foundEmails)].filter(
            (e) =>
              !e.includes("example") &&
              !e.includes("noreply") &&
              !e.includes("info@") &&
              !e.includes("webmaster")
          );
          for (const e of filtered.slice(0, 2)) {
            if (!emails.some((existing) => existing.email === e)) {
              emails.push({
                email: e,
                source: "faculty page",
                confidence: "likely",
              });
            }
          }
        }
      } catch { /* continue */ }
    }

    // 5. Build search URLs for the user
    const nameParts = (authorName || "").trim().split(/\s+/);
    const searchUrls = {
      google: `https://www.google.com/search?q=${encodeURIComponent(
        `"${authorName}" email ${institution || ""}`
      )}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent(
        `author:"${authorName}"`
      )}`,
      directory: institution
        ? `https://www.google.com/search?q=${encodeURIComponent(
            `"${authorName}" contact site:${guessDomain(institution)}`
          )}`
        : null,
    };

    // 6. Generate pattern-based guesses as last resort
    if (emails.length === 0 && nameParts.length >= 2 && institution) {
      const first = nameParts[0].toLowerCase().replace(/[^a-z]/g, "");
      const last = nameParts[nameParts.length - 1]
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const fi = first[0];
      const domain = guessDomain(institution);

      if (domain) {
        const patterns = [
          `${first}.${last}@${domain}`,
          `${fi}${last}@${domain}`,
          `${last}@${domain}`,
        ];
        for (const p of patterns) {
          emails.push({ email: p, source: "pattern", confidence: "guess" });
        }
      }
    }

    return NextResponse.json({
      emails: emails.slice(0, 5),
      searchUrls,
      homepageUrl,
      orcidUrl: orcidId ? `https://orcid.org/${orcidId}` : null,
    });
  } catch (err) {
    console.error("find-email error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Map university names to likely domains
function guessDomain(institution: string): string | null {
  const domainMap: Record<string, string> = {
    "massachusetts institute of technology": "mit.edu",
    "stanford university": "stanford.edu",
    "harvard university": "harvard.edu",
    "princeton university": "princeton.edu",
    "yale university": "yale.edu",
    "columbia university": "columbia.edu",
    "university of california, berkeley": "berkeley.edu",
    "cornell university": "cornell.edu",
    "university of chicago": "uchicago.edu",
    "university of pennsylvania": "upenn.edu",
    "duke university": "duke.edu",
    "university of michigan": "umich.edu",
    "university of oxford": "ox.ac.uk",
    "university of cambridge": "cam.ac.uk",
    "california institute of technology": "caltech.edu",
    "carnegie mellon university": "cmu.edu",
    "georgia institute of technology": "gatech.edu",
    "university of california, los angeles": "ucla.edu",
    "university of california, san diego": "ucsd.edu",
    "university of washington": "uw.edu",
    "northwestern university": "northwestern.edu",
    "johns hopkins university": "jhu.edu",
    "new york university": "nyu.edu",
    "university of texas at austin": "utexas.edu",
    "university of illinois urbana-champaign": "illinois.edu",
    "brown university": "brown.edu",
    "rice university": "rice.edu",
    "vanderbilt university": "vanderbilt.edu",
    "emory university": "emory.edu",
    "university of southern california": "usc.edu",
    "boston university": "bu.edu",
    "university of virginia": "virginia.edu",
    "purdue university": "purdue.edu",
    "ohio state university": "osu.edu",
    "penn state university": "psu.edu",
    "university of florida": "ufl.edu",
    "eth zurich": "ethz.ch",
    "university of toronto": "utoronto.ca",
    "university of british columbia": "ubc.ca",
    "mcgill university": "mcgill.ca",
    "imperial college london": "imperial.ac.uk",
    "university college london": "ucl.ac.uk",
    "national university of singapore": "nus.edu.sg",
    "university of tokyo": "u-tokyo.ac.jp",
  };

  const instLower = institution.toLowerCase();
  if (domainMap[instLower]) return domainMap[instLower];

  // Fallback: extract likely domain
  const words = instLower
    .replace(/university of |the /gi, "")
    .replace(/university|college|institute|school/gi, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length > 0) {
    return words[0].replace(/[^a-z]/g, "") + ".edu";
  }
  return null;
}
