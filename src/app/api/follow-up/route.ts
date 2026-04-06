import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You write short, genuine follow-up emails for students reaching out to professors. Return only valid JSON. No extra text.",
        },
        {
          role: "user",
          content: `A student sent this cold email to a professor:

---
${email}
---

Write two follow-up emails. Each one should be 3-4 sentences max. Respectful, specific, not desperate. Extract the professor's name from the email if present, otherwise use "[Professor's name]". Extract the student's name/sign-off if present, otherwise use "[Your name]".

Follow-Up 1 (sent 7 days after the original):
- Open: "Hi Professor [name], just wanted to follow up on my email from last week."
- One sentence referencing something specific from their original email (a paper they mentioned, their background, the ask)
- Soft close: "I'd love to hear your thoughts if you have a moment."
- Sign-off with student's name

Follow-Up 2 (sent 14 days after the original):
- Open: "Hi Professor [name], I know this is a busy time of year."
- One sentence that adds a new angle or a new question — do NOT just repeat follow-up 1
- Clear close: "If the timing isn't right, no worries at all. I appreciate your time either way."
- Sign-off with student's name

Return JSON exactly like this:
{
  "followUp1": "full email text here",
  "followUp2": "full email text here"
}`,
        },
      ],
      max_tokens: 700,
      temperature: 0.65,
      response_format: { type: "json_object" },
    });

    const raw = chat.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      followUp1: parsed.followUp1 ?? "",
      followUp2: parsed.followUp2 ?? "",
    });
  } catch (err) {
    console.error("follow-up error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
