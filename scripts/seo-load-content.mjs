// Loads the hand-authored per-field content (scripts/data/field-content.mjs)
// into field_content. Validates lengths and FAQ shape, then upserts.
//
// Usage:
//   node scripts/seo-load-content.mjs --check   # validate + print, no write
//   node scripts/seo-load-content.mjs           # validate + upsert to Supabase

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { FIELD_CONTENT } from "./data/field-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
try {
  const envFile = fs.readFileSync(path.join(ROOT, ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && !key.startsWith("#")) process.env[key.trim()] ??= rest.join("=").trim();
  }
} catch {
  console.error("Could not read .env.local at repo root.");
  process.exit(1);
}

const wc = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;

function validate(c) {
  const issues = [];
  if (!c.meta_title || c.meta_title.length > 60) issues.push(`meta_title ${c.meta_title?.length}`);
  if (!/research position/i.test(c.meta_title)) issues.push("meta_title missing 'research position'");
  if (!c.meta_title.includes(c.field_name)) issues.push("meta_title missing field name");
  if (c.meta_description.length < 140 || c.meta_description.length > 160) issues.push(`meta_desc ${c.meta_description.length}`);
  if (!["remote-friendly", "hands-on", "mixed"].includes(c.remote_friendly)) issues.push("bad remote_friendly");
  if (wc(c.research_overview) < 80) issues.push(`overview ${wc(c.research_overview)}w`);
  if (wc(c.email_angle) < 80) issues.push(`email ${wc(c.email_angle)}w`);
  if (!Array.isArray(c.faq) || c.faq.length !== 4) issues.push(`faq count ${c.faq?.length}`);
  (c.faq || []).forEach((f, i) => {
    if (wc(f.answer) < 35 || wc(f.answer) > 60) issues.push(`faq${i + 1} ${wc(f.answer)}w`);
  });
  return issues;
}

async function main() {
  const check = process.argv.includes("--check");
  let ok = true;
  for (const c of FIELD_CONTENT) {
    const issues = validate(c);
    const flag = issues.length ? `⚠️  ${issues.join(", ")}` : "ok";
    if (issues.length) ok = false;
    console.log(
      `${c.field_slug.padEnd(24)} title=${String(c.meta_title.length).padStart(2)} ` +
        `desc=${String(c.meta_description.length).padStart(3)} ovr=${String(wc(c.research_overview)).padStart(3)}w ` +
        `email=${String(wc(c.email_angle)).padStart(3)}w ${c.remote_friendly.padEnd(15)} ${flag}`
    );
  }
  if (FIELD_CONTENT.length !== 15) { console.log(`\n⚠️  expected 15 fields, got ${FIELD_CONTENT.length}`); ok = false; }

  if (check) {
    console.log(`\nCHECK ONLY — ${ok ? "all valid" : "issues above"}. Nothing written.`);
    process.exit(ok ? 0 : 1);
  }
  if (!ok) {
    console.error("\nValidation issues above — fix before writing. Aborting.");
    process.exit(1);
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const rows = FIELD_CONTENT.map((c) => ({ ...c, faq: c.faq }));
  const { error } = await supabase.from("field_content").upsert(rows, { onConflict: "field_slug" });
  if (error) { console.error("Upsert failed:", error.message); process.exit(1); }
  console.log(`\n✅ wrote ${rows.length} field_content rows.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
