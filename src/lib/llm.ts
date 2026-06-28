import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";

// Shared JSON-generation helper for the AI tools (summarizer, email checker).
//
// Preferred backend is Claude Haiku 4.5 via the Anthropic API: it follows the
// "flag ONLY if…" style instructions far more faithfully than Llama (fewer
// false-positive flags), and structured outputs return schema-valid JSON without the
// json_validate_failed retry/salvage dance Groq needs. If ANTHROPIC_API_KEY is unset
// — or a Haiku call errors — we fall back to Groq automatically, so the feature
// degrades to its previous behavior instead of breaking.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const aiProvider: "anthropic" | "groq" = anthropic ? "anthropic" : "groq";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const HAIKU_MODEL = "claude-haiku-4-5";

// Pull a JSON object out of a model response, tolerating stray prose/markdown.
function tryExtractJSON(s: string | null | undefined): unknown {
  if (!s) return null;
  try { return JSON.parse(s); } catch { /* not clean JSON */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* still bad */ } }
  return null;
}

export interface GenerateJSONOptions {
  system: string;
  prompt: string;
  // JSON Schema for structured outputs (Haiku) — keep it within the supported subset:
  // every object needs additionalProperties:false and all keys in required; no
  // min/maxLength or numeric bounds. Groq ignores it and relies on the prompt.
  schema: Record<string, unknown>;
  maxTokens: number;
  // Groq-only sampling temperature; Haiku ignores it (structured outputs constrain it).
  temperature?: number;
}

// Returns a parsed JSON object, or null if every attempt failed. Never throws.
export async function generateJSON<T = unknown>(opts: GenerateJSONOptions): Promise<T | null> {
  const { system, prompt, schema, maxTokens, temperature = 0.3 } = opts;

  // Preferred path: Haiku 4.5 with structured outputs (guaranteed schema-valid JSON).
  if (anthropic) {
    try {
      const res = await anthropic.messages.create({
        model: HAIKU_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: { type: "json_schema", schema } },
      });
      const block = res.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      const parsed = tryExtractJSON(block?.text);
      if (parsed) return parsed as T;
    } catch (err) {
      console.warn("anthropic generateJSON failed, falling back to Groq:", (err as Error)?.message);
    }
  }

  // Fallback: Groq Llama. JSON mode occasionally returns json_validate_failed (invalid
  // JSON); retry with different sampling and salvage the raw generation if present.
  let parsed: unknown = null;
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      const chat = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: attempt === 0 ? temperature : Math.min(temperature + 0.2, 1),
        response_format: { type: "json_object" },
      });
      parsed = tryExtractJSON(chat.choices[0]?.message?.content);
    } catch (err) {
      const e = err as { error?: { failed_generation?: string }; failed_generation?: string };
      parsed = tryExtractJSON(e.error?.failed_generation ?? e.failed_generation);
      if (!parsed) console.warn(`groq JSON attempt ${attempt + 1} failed:`, (err as Error)?.message);
    }
  }

  // Last resort: plain mode (no schema enforcement that can 400), parse it ourselves.
  if (!parsed) {
    try {
      const chat = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${prompt}\n\nReturn ONLY one valid JSON object. Every string value MUST be wrapped in double quotes.` },
        ],
        max_tokens: maxTokens,
        temperature,
      });
      parsed = tryExtractJSON(chat.choices[0]?.message?.content);
    } catch (err) {
      console.error("groq fallback failed:", err);
    }
  }

  return (parsed as T) ?? null;
}
