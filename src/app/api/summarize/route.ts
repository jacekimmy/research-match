import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { authorId } = await req.json();
    if (!authorId) {
      return NextResponse.json({ error: "authorId required" }, { status: 400 });
    }

    // Fetch recent papers (last 3 years) sorted by citation count
    const fromYear = new Date().getFullYear() - 3;
    const worksRes = await fetch(
      `https://api.openalex.org/works?filter=author.id:${authorId},publication_year:>${fromYear}&sort=cited_by_count:desc&per_page=20&select=title,abstract_inverted_index,cited_by_count,publication_year,authorships`
    );
    const worksData = await worksRes.json();
    const allWorks = worksData.results ?? [];
    const works = allWorks.slice(0, 8);

    if (works.length === 0) {
      return NextResponse.json({ summary: "No recent papers found for this researcher.", highlights: [] });
    }

    // Get author position for each paper
    const authorPositions: Record<string, string> = {};
    for (const w of works) {
      const authorship = w.authorships?.find(
        (a: any) => a.author?.id === `https://openalex.org/${authorId}`
      );
      if (authorship && w.title) {
        authorPositions[w.title] = authorship.author_position ?? "unknown";
      }
    }

    // Reconstruct abstracts from inverted index
    const papers = works.map((w: any) => {
      let abstract = "";
      if (w.abstract_inverted_index) {
        const words: { word: string; pos: number }[] = [];
        for (const [word, positions] of Object.entries(w.abstract_inverted_index as Record<string, number[]>)) {
          for (const pos of positions) {
            words.push({ word, pos });
          }
        }
        abstract = words
          .sort((a, b) => a.pos - b.pos)
          .map((w) => w.word)
          .join(" ");
      }
      return `Title: ${w.title}\nYear: ${w.publication_year}\nCitations: ${w.cited_by_count}\n${abstract ? `Abstract: ${abstract.slice(0, 300)}` : ""}`;
    });

    const prompt = `Here are the top research papers by a professor:

${papers.join("\n\n---\n\n")}

Return a JSON object with two fields:
1. "summary": 3-4 sentences describing what this professor actually works on. Be specific — name the real topics, methods, or problems they study. Write like you're explaining to a smart undergrad. Use plain, direct language. No jargon, no filler phrases like "significant contributions" or "robust frameworks". Do not start with "This professor".
2. "highlights": an array of 3 objects, each with:
   - "paper": the exact paper title
   - "detail": one specific finding, method, or result from that paper. Focus on what they actually discovered or built — a number, a comparison, a technique. Never just restate the title or topic. Explain the concrete outcome in one sentence, plain English.
3. "questions": an array of 3 strings. Generate 3 questions a curious student might naturally ask over coffee. Reference something specific from the abstracts but make it conversational. Start questions with "I noticed", "I was wondering", "What made you decide to" instead of "How do you plan to" or "Can you discuss". Never compliment the research. Never use phrases like "I found your work fascinating." Should sound like genuine curiosity, not an interview.

Return only valid JSON, no markdown, no explanation.`;

    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You explain research in plain, specific language. You never use academic filler words. You always return valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = chat.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: { summary?: string; highlights?: { paper: string; detail: string }[]; questions?: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { summary: raw, highlights: [] };
    }

    // Attach author position to each highlight
    const highlightsWithPosition = (parsed.highlights ?? []).map((h) => ({
      ...h,
      authorPosition: authorPositions[h.paper] ?? "unknown",
    }));

    return NextResponse.json({
      summary: parsed.summary ?? "",
      highlights: highlightsWithPosition,
      questions: parsed.questions ?? [],
    });
  } catch (err) {
    console.error("summarize error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
