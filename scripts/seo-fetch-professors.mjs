// Phase 1/2: pull 8-12 real, actively-publishing professors per research field
// from OpenAlex and store them in field_professors.
//
// Usage:
//   node scripts/seo-fetch-professors.mjs neuroscience --dry-run   # print only, no DB
//   node scripts/seo-fetch-professors.mjs neuroscience             # write to Supabase
//   node scripts/seo-fetch-professors.mjs all                      # all 15 fields
//
// Field anchors + OpenAlex logic live in scripts/lib/research-anchors.mjs (shared
// with seo-generate-content.mjs). Env is loaded from .env.local manually, matching
// scripts/fix-cancelled-subscribers.ts (dotenv isn't installed).

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { FIELDS, TARGET_MIN, sleep, fetchFieldProfessors } from "./lib/research-anchors.mjs";

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

function printRows({ field, matchedTopics, rows, note }) {
  console.log(`\n=== ${field.name} (${field.slug}) ===`);
  console.log(
    `anchor topics (${matchedTopics.length}): ${matchedTopics.slice(0, 4).map((t) => t.name).join(" | ") || "(none)"}` +
      `${matchedTopics.length > 4 ? " …" : ""}`
  );
  if (note) console.log(`note: ${note}`);
  console.log(`professors found: ${rows.length}`);
  rows.forEach((r, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${r.professor_name}  —  ${r.institution}  —  ${r.recent_topic}  (${r.last_publication_year})`
    );
  });
  if (rows.length < TARGET_MIN) {
    console.log(`⚠️  THIN DATA: only ${rows.length} (target ${TARGET_MIN}+). Flagging, not padding.`);
  }
}

async function store(supabase, field, rows) {
  const del = await supabase.from("field_professors").delete().eq("field_slug", field.slug);
  if (del.error) throw new Error(`delete failed: ${del.error.message}`);
  if (rows.length === 0) return;
  const ins = await supabase.from("field_professors").insert(rows);
  if (ins.error) throw new Error(`insert failed: ${ins.error.message}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const target = args.find((a) => !a.startsWith("--")) || "all";
  const fields = target === "all" ? FIELDS : FIELDS.filter((f) => f.slug === target);
  if (fields.length === 0) {
    console.error(`Unknown field "${target}". Known: ${FIELDS.map((f) => f.slug).join(", ")}`);
    process.exit(1);
  }

  let supabase = null;
  if (!dryRun) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
      process.exit(1);
    }
    supabase = createClient(url, key);
  }

  const thin = [];
  for (const field of fields) {
    try {
      const result = await fetchFieldProfessors(field);
      printRows(result);
      if (result.rows.length < TARGET_MIN) thin.push(`${field.slug} (${result.rows.length})`);
      if (!dryRun) {
        await store(supabase, field, result.rows);
        console.log(`✅ stored ${result.rows.length} rows for ${field.slug}`);
      }
    } catch (err) {
      console.error(`❌ ${field.slug}: ${err.message}`);
      thin.push(`${field.slug} (error)`);
    }
    await sleep(400);
  }

  console.log(`\n${dryRun ? "DRY RUN — nothing written." : "Done writing to Supabase."}`);
  if (thin.length) console.log(`⚠️  Fields needing attention: ${thin.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
