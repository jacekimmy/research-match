import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function pickBestMatch(
  query: string,
  candidates: { id: string; display_name: string }[],
  entityType: string
): Promise<number> {
  const list = candidates.map((c, i) => `${i}: ${c.display_name}`).join("\n");
  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You pick the best matching item from a list. Reply with only a single number — no explanation, no punctuation. If none of the candidates are a strong, direct match for the query, return -1 instead of forcing a bad match.",
      },
      {
        role: "user",
        content: `Query: "${query}"\n\nCandidates:\n${list}\n\nWhich index is the broadest, most general match for the ${entityType}? Avoid niche subfields unless the query is specific. If nothing is a good match, return -1.`,
      },
    ],
    max_tokens: 5,
    temperature: 0,
  });
  const raw = chat.choices[0]?.message?.content?.trim() ?? "0";
  const idx = parseInt(raw, 10);
  if (idx === -1) return -1;
  return isNaN(idx) || idx < 0 || idx >= candidates.length ? 0 : idx;
}

async function resolveTopic(topic: string): Promise<{ id: string; name: string } | null> {
  try {
    const res = await fetch(`https://api.openalex.org/topics?search=${encodeURIComponent(topic)}&per_page=5`);
    const data = await res.json();
    const candidates: { id: string; display_name: string }[] = data.results ?? [];
    if (candidates.length === 0) return null;
    const idx = await pickBestMatch(topic, candidates, "research topic");
    if (idx === -1) return null;
    return { id: candidates[idx].id.split("/").pop()!, name: candidates[idx].display_name };
  } catch { return null; }
}

async function resolveUniversity(university: string): Promise<{ id: string; name: string } | null> {
  try {
    const res = await fetch(`https://api.openalex.org/institutions?search=${encodeURIComponent(university)}&per_page=5`);
    const data = await res.json();
    const candidates: { id: string; display_name: string }[] = data.results ?? [];
    if (candidates.length === 0) return null;
    const idx = await pickBestMatch(university, candidates, "university");
    if (idx === -1) return null;
    return { id: candidates[idx].id.split("/").pop()!, name: candidates[idx].display_name };
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both legacy single and new multi format
    const topics: string[] = body.topics ?? (body.topic ? [body.topic] : []);
    const universities: string[] = body.universities ?? (body.university ? [body.university] : []);

    // Resolve all topics and universities in parallel
    const [topicResults, uniResults] = await Promise.all([
      Promise.all(topics.map(resolveTopic)),
      Promise.all(universities.map(resolveUniversity)),
    ]);

    const resolvedTopics = topicResults.filter(Boolean) as { id: string; name: string }[];
    const resolvedUnis = uniResults.filter(Boolean) as { id: string; name: string }[];

    // Legacy single-topic response for backward compat
    if (topics.length === 1 && universities.length <= 1) {
      const topic = resolvedTopics[0] ?? null;
      const uni = resolvedUnis[0] ?? null;
      if (universities.length === 1 && !uni) {
        return NextResponse.json({ error: "University not found." }, { status: 404 });
      }
      return NextResponse.json({
        topicId: topic?.id ?? null,
        topicName: topic?.name ?? topics[0],
        institutionId: uni?.id ?? null,
        institutionName: uni?.name ?? null,
        // Also include arrays for new callers
        topicIds: topic ? [topic.id] : [],
        topicNames: topic ? [topic.name] : [],
        institutionIds: uni ? [uni.id] : [],
        institutionNames: uni ? [uni.name] : [],
      });
    }

    return NextResponse.json({
      topicIds: resolvedTopics.map(t => t.id),
      topicNames: resolvedTopics.map(t => t.name),
      institutionIds: resolvedUnis.map(u => u.id),
      institutionNames: resolvedUnis.map(u => u.name),
      // Legacy fields pointing to first result
      topicId: resolvedTopics[0]?.id ?? null,
      topicName: resolvedTopics[0]?.name ?? topics[0] ?? "",
      institutionId: resolvedUnis[0]?.id ?? null,
      institutionName: resolvedUnis[0]?.name ?? null,
    });
  } catch (err) {
    console.error("resolve error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
