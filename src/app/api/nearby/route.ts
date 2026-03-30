import { NextRequest, NextResponse } from "next/server";

const OPENALEX_MAILTO = "mailto:jace@researchmatch.net";

interface NearbyRequest {
  institutionName: string;
  topicId: string | null;
  query: string;
  excludeAuthorIds: string[];
}

interface GeoInfo {
  latitude: number | null;
  longitude: number | null;
}

interface InstitutionResult {
  id: string;
  display_name: string;
  geo: GeoInfo;
}

interface ProfessorResult {
  id: string;
  name: string;
  institution: string;
  distance_miles: number;
  topics: string[];
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function oaFetch(url: string): Promise<any> {
  const separator = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${separator}mailto=${OPENALEX_MAILTO}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}: ${url}`);
  return res.json();
}

async function resolveInstitutionGeo(
  name: string
): Promise<{ id: string; display_name: string; lat: number; lng: number }> {
  const data = await oaFetch(
    `https://api.openalex.org/institutions?search=${encodeURIComponent(name)}&per_page=1&select=id,display_name,geo`
  );
  const inst = data.results?.[0];
  if (!inst) throw new Error("Institution not found");
  const lat = inst.geo?.latitude;
  const lng = inst.geo?.longitude;
  if (lat == null || lng == null) throw new Error("Institution has no geo data");
  return { id: inst.id, display_name: inst.display_name, lat, lng };
}

async function findNearbyInstitutions(
  lat: number,
  lng: number,
  radiusKm: number,
  excludeId: string
): Promise<InstitutionResult[]> {
  const data = await oaFetch(
    `https://api.openalex.org/institutions?filter=geo.is_within:${lat},${lng},${radiusKm}km&per_page=20&select=id,display_name,geo`
  );
  const results: InstitutionResult[] = data.results ?? [];
  return results.filter((inst) => inst.id !== excludeId);
}

async function findAuthorsAtInstitution(
  institutionId: string,
  topicId: string | null,
  query: string
): Promise<any[]> {
  const shortId = institutionId.split("/").pop();

  if (topicId) {
    // Use topic filter + institution filter
    const data = await oaFetch(
      `https://api.openalex.org/authors?filter=topics.id:${topicId},last_known_institutions.id:${shortId}&per_page=10&sort=cited_by_count:desc&select=id,display_name,works_count,cited_by_count,topics,last_known_institutions`
    );
    return data.results ?? [];
  }

  // Keyword search: find works matching query at this institution, extract authors
  const data = await oaFetch(
    `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=institutions.id:${shortId}&sort=cited_by_count:desc&per_page=10&select=authorships`
  );
  const works = data.results ?? [];

  // Collect unique authors from these works
  const authorMap = new Map<string, { id: string; count: number }>();
  for (const work of works) {
    for (const authorship of work.authorships ?? []) {
      const aId = authorship.author?.id;
      if (!aId) continue;
      // Only include authors affiliated with the target institution
      const affiliatedHere = authorship.institutions?.some(
        (inst: any) => inst.id === institutionId
      );
      if (!affiliatedHere) continue;
      const existing = authorMap.get(aId);
      if (existing) {
        existing.count++;
      } else {
        authorMap.set(aId, { id: aId, count: 1 });
      }
    }
  }

  // Fetch author details for top candidates
  const topAuthorIds = Array.from(authorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const authors = await Promise.all(
    topAuthorIds.map(async ({ id }) => {
      try {
        const shortAuthorId = id.split("/").pop();
        const authorData = await oaFetch(
          `https://api.openalex.org/authors/${shortAuthorId}?select=id,display_name,works_count,cited_by_count,topics,last_known_institutions`
        );
        return authorData;
      } catch {
        return null;
      }
    })
  );

  return authors.filter(Boolean);
}

function scoreAuthor(author: any): number {
  let score = 0;
  // Favor higher citation counts (log scale to avoid extreme skew)
  score += Math.log10(Math.max(author.cited_by_count ?? 1, 1)) * 2;
  // Favor reasonable publication counts
  const wc = author.works_count ?? 0;
  if (wc >= 10) score += 2;
  if (wc >= 30) score += 1;
  if (wc < 5) score -= 2;
  return score;
}

async function findNearbyProfessors(
  originLat: number,
  originLng: number,
  originId: string,
  radiusKm: number,
  topicId: string | null,
  query: string,
  excludeAuthorIds: Set<string>
): Promise<ProfessorResult[]> {
  const nearby = await findNearbyInstitutions(
    originLat,
    originLng,
    radiusKm,
    originId
  );

  if (nearby.length === 0) return [];

  // Search each nearby institution for matching authors (in parallel, limited)
  const allCandidates: {
    author: any;
    institution: InstitutionResult;
    distance: number;
  }[] = [];

  const batchResults = await Promise.all(
    nearby.map(async (inst) => {
      try {
        const authors = await findAuthorsAtInstitution(
          inst.id,
          topicId,
          query
        );
        const distance =
          inst.geo?.latitude != null && inst.geo?.longitude != null
            ? haversineDistance(
                originLat,
                originLng,
                inst.geo.latitude,
                inst.geo.longitude
              )
            : 0;
        return authors.map((a) => ({ author: a, institution: inst, distance }));
      } catch {
        return [];
      }
    })
  );

  for (const batch of batchResults) {
    allCandidates.push(...batch);
  }

  // Filter out excluded authors and deduplicate
  const seen = new Set<string>();
  const filtered = allCandidates.filter((c) => {
    const aId = c.author.id;
    if (!aId || excludeAuthorIds.has(aId) || seen.has(aId)) return false;
    // Also check short-form ID
    const shortId = aId.split("/").pop() ?? "";
    if (excludeAuthorIds.has(shortId)) return false;
    seen.add(aId);
    return true;
  });

  // Score and rank
  const scored = filtered.map((c) => ({
    ...c,
    score: scoreAuthor(c.author),
  }));
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((c) => ({
    id: c.author.id,
    name: c.author.display_name ?? "Unknown",
    institution: c.institution.display_name,
    distance_miles: Math.round(c.distance * 10) / 10,
    topics: (c.author.topics ?? [])
      .slice(0, 5)
      .map((t: any) => t.display_name),
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body: NearbyRequest = await req.json();
    const { institutionName, topicId, query, excludeAuthorIds } = body;

    if (!institutionName || !query) {
      return NextResponse.json(
        { error: "institutionName and query are required" },
        { status: 400 }
      );
    }

    const excludeSet = new Set(excludeAuthorIds ?? []);

    // Step 1: Resolve institution geo
    const origin = await resolveInstitutionGeo(institutionName);

    // Step 2: Try 50-mile radius first (~80.47 km)
    let professors = await findNearbyProfessors(
      origin.lat,
      origin.lng,
      origin.id,
      80.47,
      topicId ?? null,
      query,
      excludeSet
    );
    let radiusMiles = 50;

    // Step 3: If fewer than 3, expand to 100 miles (~161 km)
    if (professors.length < 3) {
      professors = await findNearbyProfessors(
        origin.lat,
        origin.lng,
        origin.id,
        161,
        topicId ?? null,
        query,
        excludeSet
      );
      radiusMiles = 100;
    }

    return NextResponse.json({
      professors,
      radius_miles: radiusMiles,
      searched_institution: origin.display_name,
    });
  } catch (err) {
    console.error("nearby error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
