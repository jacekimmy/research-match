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
      `https://api.openalex.org/works?filter=author.id:${authorId},publication_year:>${fromYear}&sort=cited_by_count:desc&per_page=8&select=title,abstract_inverted_index,cited_by_count,publication_year`
    );
    const worksData = await worksRes.json();
    const works = worksData.results ?? [];

    if (works.length === 0) {
      return NextResponse.json({ summary: "No recent papers found for this researcher.", highlights: [] });
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
   - "detail": one specific, interesting finding or idea from that paper — something concrete and surprising, not a vague description. One sentence, plain English.
3. "questions": an array of 3 strings. For each question, pick a specific finding or limitation from one of the paper abstracts above and ask about its future direction or methodology. The question should sound like a curious high school student — genuine, a little informal, and clearly referencing something concrete from the paper. Not a formal interview question. Example tone: "In your paper on X, you found that Y — do you think that could also work for Z?"

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

    return NextResponse.json({
      summary: parsed.summary ?? "",
      highlights: parsed.highlights ?? [],
      questions: parsed.questions ?? [],
    });
  } catch (err) {
    console.error("summarize error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
