import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { institutionName, topicId, excludeIds }: {
      institutionName: string;
      topicId: string;
      excludeIds: string[];
    } = await req.json();

    // Step 1: Ask AI for geographically nearby universities
    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You return a JSON array of university names — nothing else. No explanation, no markdown, no extra text.",
        },
        {
          role: "user",
          content: `List 8 universities geographically closest to "${institutionName}". Do not include "${institutionName}" itself. Return only a JSON array of university names, e.g. ["Harvard University", "Boston University"]`,
        },
      ],
      max_tokens: 200,
      temperature: 0,
    });

    const raw = chat.choices[0]?.message?.content?.trim() ?? "[]";
    let nearbyNames: string[] = [];
    try {
      nearbyNames = JSON.parse(raw);
    } catch {
      // Try to extract JSON array from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) nearbyNames = JSON.parse(match[0]);
    }

    if (!nearbyNames.length) {
      return NextResponse.json({ authors: [] });
    }

    // Step 2: Resolve each nearby university name to an OpenAlex institution ID
    const resolvedInstIds: string[] = [];
    await Promise.all(
      nearbyNames.slice(0, 8).map(async (name) => {
        try {
          const r = await fetch(
            `https://api.openalex.org/institutions?search=${encodeURIComponent(name)}&per_page=1`,
            { signal: AbortSignal.timeout(4000) }
          );
          const d = await r.json();
          const inst = d.results?.[0];
          if (inst?.id) {
            const shortId = inst.id.split("/").pop();
            if (shortId) resolvedInstIds.push(shortId);
          }
        } catch { /* skip */ }
      })
    );

    if (!resolvedInstIds.length) {
      return NextResponse.json({ authors: [] });
    }

    // Step 3: For each institution, fetch top author in that topic
    const authorsByInst = await Promise.all(
      resolvedInstIds.map(async (instId) => {
        try {
          const r = await fetch(
            `https://api.openalex.org/authors?filter=topics.id:${topicId},last_known_institutions.id:${instId}&per_page=3&sort=cited_by_count:desc`,
            { signal: AbortSignal.timeout(5000) }
          );
          const d = await r.json();
          return (d.results ?? []) as any[];
        } catch { return []; }
      })
    );

    // Flatten, deduplicate, filter out excluded IDs and low work counts
    const seen = new Set<string>(excludeIds);
    const candidates: any[] = [];
    for (const group of authorsByInst) {
      for (const author of group) {
        const shortId = author.id?.split("/").pop();
        if (!shortId || seen.has(author.id) || seen.has(shortId)) continue;
        if ((author.works_count ?? 0) < 15) continue;
        seen.add(author.id);
        seen.add(shortId);
        candidates.push(author);
      }
    }

    // Sort by citations and return top 3
    candidates.sort((a, b) => (b.cited_by_count ?? 0) - (a.cited_by_count ?? 0));
    return NextResponse.json({ authors: candidates.slice(0, 3) });
  } catch (err) {
    console.error("nearby-authors error:", err);
    return NextResponse.json({ authors: [] });
  }
}
