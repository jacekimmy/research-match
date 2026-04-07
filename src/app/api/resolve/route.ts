import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Step 1: Use LLM to expand a user query into OpenAlex-friendly search terms.
// OpenAlex's topic taxonomy uses specific academic phrases — "applied math" doesn't
// exist but "mathematical modeling", "numerical analysis", etc. do.
async function expandToSearchTerms(topic: string): Promise<string[]> {
  try {
    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You convert informal research topic queries into 3-5 formal academic search terms that would appear in an academic paper database taxonomy. Return only a JSON array of strings. No explanation. Examples:
- "applied math" → ["mathematics", "mathematical modeling", "numerical analysis", "computational mathematics"]
- "bio" → ["biology", "biochemistry", "biomedical engineering", "molecular biology"]
- "CS" → ["computer science", "software engineering", "algorithms", "computing"]
- "econ" → ["economics", "econometrics", "economic policy"]
- "ML" → ["machine learning", "deep learning", "artificial intelligence"]
- "physics" → ["physics", "applied physics", "theoretical physics"]
Use full formal names, not abbreviations.`,
        },
        {
          role: "user",
          content: `Research topic query: "${topic}"\n\nReturn 3-5 formal academic search terms as a JSON array.`,
        },
      ],
      max_tokens: 100,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    const raw = chat.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    // Accept array at root or under any key
    const arr = Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray) as string[] ?? [];
    return arr.filter((s): s is string => typeof s === "string").slice(0, 5);
  } catch {
    // Fallback: just return the original query
    return [topic];
  }
}

async function pickBestIndices(
  query: string,
  candidates: { id: string; display_name: string }[],
  entityType: string,
  maxPick: number
): Promise<number[]> {
  const list = candidates.map((c, i) => `${i}: ${c.display_name}`).join("\n");
  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You pick the best matching items from a list. Reply with only comma-separated numbers (e.g. "0,2,4") — no explanation, no punctuation besides commas. Pick up to ${maxPick} items that are good matches. If none are a good match, return -1.`,
      },
      {
        role: "user",
        content: `Original user query: "${query}"\n\nCandidates:\n${list}\n\nWhich indices best match the ${entityType} for this query, including closely related variations? Return up to ${maxPick} comma-separated indices, or -1 if nothing matches.`,
      },
    ],
    max_tokens: 20,
    temperature: 0,
  });
  const raw = chat.choices[0]?.message?.content?.trim() ?? "0";
  if (raw === "-1") return [];
  const indices = raw.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n >= 0 && n < candidates.length);
  return [...new Set(indices)].slice(0, maxPick);
}

async function resolveTopic(topic: string): Promise<{ ids: string[]; names: string[] }> {
  try {
    // First expand to formal academic terms so OpenAlex can actually find them
    const searchTerms = await expandToSearchTerms(topic);

    // Search OpenAlex for each expanded term in parallel
    const allCandidates: { id: string; display_name: string }[] = [];
    const seenIds = new Set<string>();

    const termResults = await Promise.all(
      searchTerms.map(term =>
        fetch(`https://api.openalex.org/topics?search=${encodeURIComponent(term)}&per_page=5`)
          .then(r => r.json())
          .catch(() => ({ results: [] }))
      )
    );

    for (const data of termResults) {
      for (const topic of (data.results ?? [])) {
        if (!seenIds.has(topic.id)) {
          seenIds.add(topic.id);
          allCandidates.push(topic);
        }
      }
    }

    if (allCandidates.length === 0) return { ids: [], names: [] };

    // Let LLM pick the best 4 from all candidates
    const indices = await pickBestIndices(topic, allCandidates, "research topic", 4);
    if (indices.length === 0) return { ids: [], names: [] };

    return {
      ids: indices.map(i => allCandidates[i].id.split("/").pop()!),
      names: indices.map(i => allCandidates[i].display_name),
    };
  } catch { return { ids: [], names: [] }; }
}

async function resolveUniversity(university: string): Promise<{ id: string; name: string } | null> {
  try {
    const res = await fetch(`https://api.openalex.org/institutions?search=${encodeURIComponent(university)}&per_page=5`);
    const data = await res.json();
    const candidates: { id: string; display_name: string }[] = data.results ?? [];
    if (candidates.length === 0) return null;
    const indices = await pickBestIndices(university, candidates, "university", 1);
    if (indices.length === 0) return null;
    const i = indices[0];
    return { id: candidates[i].id.split("/").pop()!, name: candidates[i].display_name };
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const topics: string[] = body.topics ?? (body.topic ? [body.topic] : []);
    const universities: string[] = body.universities ?? (body.university ? [body.university] : []);

    const [topicResults, uniResults] = await Promise.all([
      Promise.all(topics.map(resolveTopic)),
      Promise.all(universities.map(resolveUniversity)),
    ]);

    // Flatten and deduplicate all resolved topic IDs
    const allTopicIds: string[] = [];
    const allTopicNames: string[] = [];
    for (const r of topicResults) {
      for (let i = 0; i < r.ids.length; i++) {
        if (!allTopicIds.includes(r.ids[i])) {
          allTopicIds.push(r.ids[i]);
          allTopicNames.push(r.names[i]);
        }
      }
    }

    const resolvedUnis = uniResults.filter(Boolean) as { id: string; name: string }[];

    return NextResponse.json({
      topicIds: allTopicIds,
      topicNames: allTopicNames,
      institutionIds: resolvedUnis.map(u => u.id),
      institutionNames: resolvedUnis.map(u => u.name),
      // Legacy fields
      topicId: allTopicIds[0] ?? null,
      topicName: allTopicNames[0] ?? topics[0] ?? "",
      institutionId: resolvedUnis[0]?.id ?? null,
      institutionName: resolvedUnis[0]?.name ?? null,
    });
  } catch (err) {
    console.error("resolve error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
