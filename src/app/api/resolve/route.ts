import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function pickBestMatch(
  query: string,
  candidates: { id: string; display_name: string }[],
  entityType: string
): Promise<number> {
  const list = candidates
    .map((c, i) => `${i}: ${c.display_name}`)
    .join("\n");

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

export async function POST(req: NextRequest) {
  try {
    const { topic, university } = await req.json();

    // Resolve topic
    const topicRes = await fetch(
      `https://api.openalex.org/topics?search=${encodeURIComponent(topic)}&per_page=5`
    );
    const topicData = await topicRes.json();
    const topics: { id: string; display_name: string }[] = topicData.results ?? [];

    const topicIdx = topics.length > 0
      ? await pickBestMatch(topic, topics, "research topic")
      : -1;

    if (topicIdx === -1) {
      let institutionId: string | null = null;
      let institutionName: string | null = null;
      if (university) {
        const instRes = await fetch(
          `https://api.openalex.org/institutions?search=${encodeURIComponent(university)}&per_page=5`
        );
        const instData = await instRes.json();
        const institutions: { id: string; display_name: string }[] = instData.results ?? [];
        if (institutions.length > 0) {
          const instIdx = await pickBestMatch(university, institutions, "university");
          if (instIdx !== -1) {
            const bestInst = institutions[instIdx];
            institutionId = bestInst.id.split("/").pop() ?? null;
            institutionName = bestInst.display_name;
          }
        }
      }
      return NextResponse.json({
        topicId: null,
        topicName: topic,
        institutionId,
        institutionName,
      });
    }

    const bestTopic = topics[topicIdx];
    const topicId = bestTopic.id.split("/").pop();

    // Resolve institution (optional)
    let institutionId: string | null = null;
    let institutionName: string | null = null;

    if (university) {
      const instRes = await fetch(
        `https://api.openalex.org/institutions?search=${encodeURIComponent(university)}&per_page=5`
      );
      const instData = await instRes.json();
      const institutions: { id: string; display_name: string }[] = instData.results ?? [];

      if (institutions.length === 0) {
        return NextResponse.json({ error: "University not found." }, { status: 404 });
      }

      const instIdx = await pickBestMatch(university, institutions, "university");
      const bestInst = institutions[instIdx];
      institutionId = bestInst.id.split("/").pop() ?? null;
      institutionName = bestInst.display_name;
    }

    return NextResponse.json({
      topicId,
      topicName: bestTopic.display_name,
      institutionId,
      institutionName,
    });
  } catch (err) {
    console.error("resolve error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
