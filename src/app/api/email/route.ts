import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { draft, professorName, institution, topics, highlights, questions } =
      await req.json();

    if (!draft || draft.trim().length < 10) {
      return NextResponse.json({
        flags: [
          {
            type: "error",
            issue: "Email is too short",
            suggestion:
              "Write at least a few sentences introducing yourself and why you're reaching out.",
          },
        ],
      });
    }

    const paperList = highlights?.length
      ? highlights.map((h: any) => `- "${h.paper}"`).join("\n")
      : "No papers loaded";

    const prompt = `Review this cold email to Professor ${professorName}.

The professor's recent papers include:
${paperList}

The email:
"""
${draft}
"""

For each check below, first look for evidence in the email, then decide whether to flag:

1. TOO LONG — over 200 words. Count carefully.
2. NO SPECIFIC PAPER — flag ONLY if the email does not mention any paper title, specific finding, or concrete research detail. Referencing a specific result like "2.7B parameter model outperforming larger models" counts as specific.
3. MISSING AN ASK — flag ONLY if there is no question, request for a meeting, or expression of interest in joining. Asking about their research direction counts.
4. SOUNDS GENERIC — flag ONLY if the email could be copy-pasted to a different professor with just the name changed. If it references specific research details unique to this professor, it is NOT generic.
5. NO PERSONAL CONNECTION — flag ONLY if the student never mentions their own projects, classes, experiences, or why they personally care about this topic. Mentioning their own work counts.
6. TOO MUCH FLATTERY — flag ONLY if it uses words like "groundbreaking," "deeply inspired," "incredible," "revolutionary."
7. ASKING FOR TOO MUCH — flag if asking for paid work, funding, or admission in a first email.
8. NO INTRODUCTION — flag ONLY if the student never states their name, school, or year.
9. SYCOPHANTIC TONE — flag if the email contains excessive flattery, offers to do anything the professor wants, or uses phrases like "groundbreaking work", "it would be an honor", "deeply inspired", "incredible contributions", "I am willing to do whatever you ask", "I would love to research anything you need." This tone screams AI-generated and signals no real interests.

Return JSON: { "flags": [ { "type": "error" or "warning", "issue": "FLAG_NAME", "suggestion": "one sentence explanation" } ] }
Only flag real problems. If the email is solid, return { "flags": [] }. Max 4 flags.`;

    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a strict but fair cold email reviewer. Before flagging any issue, you MUST quote the specific part of the email that proves the problem exists. If you cannot quote evidence of the problem, do NOT flag it. You return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = chat.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: {
      flags?: { type: string; issue: string; suggestion: string }[];
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { flags: [] };
    }

    return NextResponse.json({ flags: parsed.flags ?? [] });
  } catch (err) {
    console.error("email check error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
