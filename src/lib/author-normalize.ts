// Author-name normalization for matching across OpenAlex's fragmented spellings.
//
// OpenAlex routinely splits one real person into many author entities when their
// name contains diacritics or special hyphens. Benjamin Schuster‐Böckler, for
// example, exists as the canonical ORCID-backed record "Benjamin Schuster‐Böckler"
// (67 works) AND as ghost fragments "Benjamin Schuster-Boeckler" (2 works),
// "B Schuster-Böeckler" (1 work), etc. foldName() collapses these to a comparable
// key so we can dedupe fragments and prefer the canonical record.

const GERMAN_TRANSLIT: Record<string, string> = {
  ä: "ae", ö: "oe", ü: "ue", Ä: "ae", Ö: "oe", Ü: "ue", ß: "ss",
};

/**
 * Fold a name to a lowercase, ascii, punctuation-free key for comparison.
 * German umlauts expand (ö→oe) to line up with the common transliterated spelling;
 * any remaining diacritics are stripped; unicode hyphens/dashes/dots become spaces.
 *   "Benjamin Schuster‐Böckler" → "benjamin schuster boeckler"
 *   "Benjamin Schuster-Boeckler" → "benjamin schuster boeckler"
 */
export function foldName(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/[äöüÄÖÜß]/g, (c) => GERMAN_TRANSLIT[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // hyphens, dots, dashes, etc. → space
    .trim();
}

/** Folded tokens of a name, e.g. "benjamin schuster boeckler" → [...]. */
export function nameTokens(raw: string | null | undefined): string[] {
  return foldName(raw).split(" ").filter(Boolean);
}

/** Levenshtein edit distance, capped early — only used on short name tokens. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[n];
}

/** Two surname tokens match if equal, near-equal (oe/o, doubled letters), or initial. */
function tokenMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length === 1 || b.length === 1) return a[0] === b[0]; // initial vs full
  if (a.length >= 4 && b.length >= 4 && editDistance(a, b) <= 1) return true;
  return false;
}

/**
 * Does `query` look like a personal name rather than a research topic?
 * 2–4 word tokens, each ≥2 chars, no digits. ("machine learning" resolves to a
 * topic upstream so it never reaches here; this only gates the no-topic fallback.)
 */
export function looksLikePersonName(raw: string): boolean {
  if (/\d/.test(raw)) return false;
  const t = nameTokens(raw);
  return t.length >= 2 && t.length <= 4 && t.every((tok) => tok.length >= 2);
}

/**
 * Best-effort: does a candidate display name plausibly match the queried name?
 * Lenient on the surname (handles Böckler/Boeckler/Bockler) so the real person is
 * never dropped over a spelling variant; requires the surname to appear so wholly
 * unrelated authors from a broad text search are excluded.
 */
export function nameMatches(query: string, candidate: string): boolean {
  const q = nameTokens(query);
  const c = nameTokens(candidate);
  if (q.length === 0 || c.length === 0) return false;
  const surname = q[q.length - 1];
  return c.some((tok) => tokenMatches(surname, tok));
}
