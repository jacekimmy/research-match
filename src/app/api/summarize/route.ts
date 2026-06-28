import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasPaidAccess } from "@/lib/buddy-pass";
import { oaUrl } from "@/lib/openalex";
import { generateJSON } from "@/lib/llm";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FREE_LIMIT = 2;
const ANON_LIMIT = 2;

interface OpenAlexAuthorship {
  author?: { id?: string };
  author_position?: string;
}

interface OpenAlexWork {
  title?: string;
  publication_year?: number;
  cited_by_count?: number;
  abstract_inverted_index?: Record<string, number[]>;
  authorships?: OpenAlexAuthorship[];
  doi?: string | null;
}

// Structured-output schema for the Haiku path; the Groq fallback relies on the prompt.
const SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    highlights: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { paper: { type: "string" }, detail: { type: "string" } },
        required: ["paper", "detail"],
      },
    },
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "highlights", "questions"],
};

export async function POST(req: NextRequest) {
  try {
    const { authorId } = await req.json();
    if (!authorId) {
      return NextResponse.json({ error: "authorId required" }, { status: 400 });
    }

    // --- Server-side rate limiting ---
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    let userId: string | null = null;

    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }

    if (userId) {
      // Authenticated user: check Supabase
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("plan_type, summaries_used, summaries_reset_at, buddy_pass_active_until")
        .eq("id", userId)
        .single();

      const isPaid = hasPaidAccess(profile);

      if (!isPaid) {
        // Lifetime cap — no monthly reset. 2 summaries total, ever.
        const used = profile?.summaries_used ?? 0;
        if (used >= FREE_LIMIT) {
          return NextResponse.json({ error: "limit_reached" }, { status: 403 });
        }
      }
    } else {
      // Anonymous user: IP-based limiting
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";

      const { data: anonUse } = await supabaseAdmin
        .from("anon_summary_uses")
        .select("count")
        .eq("ip", ip)
        .single();

      if ((anonUse?.count ?? 0) >= ANON_LIMIT) {
        return NextResponse.json({ error: "limit_reached" }, { status: 403 });
      }
    }

    // --- Fetch recent papers ---
    const fromYear = new Date().getFullYear() - 3;
    const worksRes = await fetch(
      oaUrl(`https://api.openalex.org/works?filter=author.id:${authorId},publication_year:>${fromYear}&sort=cited_by_count:desc&per_page=20&select=title,abstract_inverted_index,cited_by_count,publication_year,authorships,doi`)
    );
    const worksData = await worksRes.json();
    const allWorks = (worksData.results ?? []) as OpenAlexWork[];
    const works = allWorks.slice(0, 8);

    if (works.length === 0) {
      return NextResponse.json({ summary: "No recent papers found for this researcher.", highlights: [] });
    }

    // Get author position and DOI for each paper
    const authorPositions: Record<string, string> = {};
    const paperDois: Record<string, string> = {};
    for (const w of works) {
      const authorship = w.authorships?.find(
        (a) => a.author?.id === `https://openalex.org/${authorId}`
      );
      if (authorship && w.title) {
        authorPositions[w.title] = authorship.author_position ?? "unknown";
      }
      if (w.title && w.doi) {
        paperDois[w.title] = w.doi;
      }
    }

    // Reconstruct abstracts from inverted index
    const papers = works.map((w) => {
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
1. "summary": 3-4 sentences describing what this professor actually works on. Be specific: name the real topics, methods, or problems they study. Write like you're explaining to a smart undergrad. Use plain, direct language. No jargon, no filler phrases like "significant contributions" or "robust frameworks". Do not start with "This professor".
2. "highlights": an array of 3 objects, each with:
   - "paper": the exact paper title
   - "detail": one specific finding, method, or result from that paper. Focus on what they actually discovered or built, a number, a comparison, a technique. Never just restate the title or topic. Explain the concrete outcome in one sentence, plain English.
3. "questions": an array of 3 strings. Generate 3 questions a curious student might naturally ask over coffee. Reference something specific from the abstracts but make it conversational. Start questions with "I noticed", "I was wondering", "What made you decide to" instead of "How do you plan to" or "Can you discuss". Never compliment the research. Never use phrases like "I found your work fascinating." Should sound like genuine curiosity, not an interview.

Return only valid JSON, no markdown, no explanation.`;

    const SYSTEM = "You explain research in plain, specific language. You never use academic filler words. You never use em dashes; use commas or periods instead. You always return a single, valid JSON object.";

    const parsed = await generateJSON<{ summary?: string; highlights?: { paper: string; detail: string }[]; questions?: string[] }>({
      system: SYSTEM,
      prompt,
      schema: SUMMARY_SCHEMA,
      maxTokens: 700,
      temperature: 0.3,
    });

    // Never dump a raw error to the user — return a clean, retry-able message.
    if (!parsed) {
      return NextResponse.json({
        summary: "We couldn't generate a summary for this professor right now. Please try again.",
        highlights: [],
        questions: [],
      });
    }

    const highlightsWithPosition = (parsed.highlights ?? []).map((h) => ({
      ...h,
      authorPosition: authorPositions[h.paper] ?? "unknown",
      doi: paperDois[h.paper] ?? null,
    }));

    const result = {
      summary: parsed.summary ?? "",
      highlights: highlightsWithPosition,
      questions: parsed.questions ?? [],
    };

    // Only count as used if we got real content
    const gotRealContent = highlightsWithPosition.length > 0 &&
      !result.summary.includes("unavailable") &&
      !result.summary.includes("No recent papers");

    if (gotRealContent) {
      if (userId) {
        // Increment server-side for authenticated user
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("plan_type, summaries_used, summaries_reset_at, buddy_pass_active_until")
          .eq("id", userId)
          .single();

        const isPaid = hasPaidAccess(profile);

        if (!isPaid) {
          // Lifetime cap — just increment, never reset.
          await supabaseAdmin.from("profiles").update({
            summaries_used: (profile?.summaries_used ?? 0) + 1,
          }).eq("id", userId);
        }
      } else {
        // Increment IP counter for anon user
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          "unknown";

        const { data: existing } = await supabaseAdmin
          .from("anon_summary_uses")
          .select("count")
          .eq("ip", ip)
          .single();

        if (existing) {
          await supabaseAdmin
            .from("anon_summary_uses")
            .update({ count: existing.count + 1 })
            .eq("ip", ip);
        } else {
          await supabaseAdmin
            .from("anon_summary_uses")
            .insert({ ip, count: 1, first_used_at: new Date().toISOString() });
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("summarize error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the summary. Please try again." },
      { status: 500 }
    );
  }
}
