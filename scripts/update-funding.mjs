/**
 * Funding Pulse — Background Updater
 *
 * Queries NIH RePORTER and NSF Awards APIs to check grant activity
 * for professors in our database, then writes ACTIVE / NOT_RECENT / UNKNOWN.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/update-funding.mjs
 *
 * Schedule via cron (e.g. weekly):
 *   0 3 * * 0  cd /path/to/project && node scripts/update-funding.mjs >> logs/funding.log 2>&1
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/** How many days before a record is considered stale and re-checked */
const STALE_AFTER_DAYS = 7;

/** Max professors to process per run (keep API usage manageable) */
const MAX_PER_RUN = 100;

/** Milliseconds to wait between each professor's API calls */
const RATE_LIMIT_DELAY_MS = 1500;

/** A grant is "active" if its end date is within the last 18 months */
const ACTIVE_CUTOFF_MS = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 18);
  return d.getTime();
})();

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse a professor's full name into { firstName, lastName }.
 * Handles "First Last", "Last, First", and single-word names.
 */
function parseName(fullName) {
  const name = fullName.trim();
  if (name.includes(",")) {
    const [last, first] = name.split(",").map((s) => s.trim());
    return { firstName: first ?? "", lastName: last };
  }
  const parts = name.split(/\s+/);
  const lastName = parts.at(-1) ?? name;
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

// ── NIH RePORTER v2 ───────────────────────────────────────────────────────────

/**
 * Search NIH RePORTER for grants awarded to a PI at a given institution.
 * Returns an array of grant objects, or null on error.
 */
async function queryNIH(displayName, institution) {
  const { firstName, lastName } = parseName(displayName);

  const body = {
    criteria: {
      pi_names: [{ last_name: lastName, first_name: firstName }],
      ...(institution ? { org_names: [institution] } : {}),
    },
    include_fields: ["ProjectStartDate", "ProjectEndDate", "AwardAmount"],
    offset: 0,
    limit: 10,
    sort_field: "project_end_date",
    sort_order: "desc",
  };

  try {
    const res = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : null;
  } catch {
    return null;
  }
}

// ── NSF Awards API ────────────────────────────────────────────────────────────

/**
 * Search NSF Awards for recent grants to a PI.
 * Returns an array of award objects, or null on error.
 */
async function queryNSF(displayName) {
  const { lastName } = parseName(displayName);

  // NSF allows filtering by PI last name and a start date floor
  const cutoffDate = new Date(ACTIVE_CUTOFF_MS)
    .toISOString()
    .split("T")[0]
    .replace(/-/g, "/");

  const params = new URLSearchParams({
    pdPIName: lastName,
    dateStart: cutoffDate,
    printFields: "id,startDate,expDate,title",
  });

  try {
    const res = await fetch(
      `https://api.nsf.gov/services/v1/awards.json?${params}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const awards = data?.response?.award;
    return Array.isArray(awards) ? awards : null;
  } catch {
    return null;
  }
}

// ── Core logic ────────────────────────────────────────────────────────────────

/**
 * Determine funding status for one professor.
 *
 * Priority: any grant with an end date ≥ 18 months ago → ACTIVE
 *           grants found but all older               → NOT_RECENT
 *           no grants found (or all queries failed)  → UNKNOWN
 */
async function determineFundingStatus(displayName, institution) {
  const [nihResult, nsfResult] = await Promise.allSettled([
    queryNIH(displayName, institution),
    queryNSF(displayName),
  ]);

  const nihGrants = nihResult.status === "fulfilled" ? nihResult.value : null;
  const nsfAwards = nsfResult.status === "fulfilled" ? nsfResult.value : null;

  // Both APIs completely failed — we can't make a determination
  if (nihGrants === null && nsfAwards === null) return "UNKNOWN";

  let anyGrantFound = false;

  // Check NIH grants
  for (const grant of nihGrants ?? []) {
    anyGrantFound = true;
    const endDate = grant.project_end_date
      ? new Date(grant.project_end_date).getTime()
      : null;
    if (endDate !== null && endDate >= ACTIVE_CUTOFF_MS) return "ACTIVE";
  }

  // Check NSF awards
  for (const award of nsfAwards ?? []) {
    anyGrantFound = true;
    const expDate = award.expDate
      ? new Date(award.expDate).getTime()
      : null;
    if (expDate !== null && expDate >= ACTIVE_CUTOFF_MS) return "ACTIVE";
  }

  return anyGrantFound ? "NOT_RECENT" : "UNKNOWN";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Funding Pulse Updater ===");
  console.log(`Started at ${new Date().toISOString()}`);
  console.log(`Active cutoff: grants ending after ${new Date(ACTIVE_CUTOFF_MS).toDateString()}`);
  console.log();

  // Fetch professors that haven't been checked in STALE_AFTER_DAYS days
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_AFTER_DAYS);

  const { data: professors, error } = await supabase
    .from("professor_funding")
    .select("openalex_id, display_name, institution, last_funding_check")
    .or(
      `last_funding_check.is.null,last_funding_check.lt.${staleThreshold.toISOString()}`
    )
    .order("last_funding_check", { ascending: true, nullsFirst: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error("Failed to fetch professors:", error.message);
    process.exit(1);
  }

  if (!professors || professors.length === 0) {
    console.log("No stale records found. All professors are up to date.");
    return;
  }

  console.log(`Found ${professors.length} professor(s) to check.\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < professors.length; i++) {
    const prof = professors[i];
    const label = `[${i + 1}/${professors.length}]`;

    process.stdout.write(`${label} ${prof.display_name} (${prof.institution || "unknown institution"}) ... `);

    try {
      const status = await determineFundingStatus(
        prof.display_name,
        prof.institution
      );

      const { error: updateError } = await supabase
        .from("professor_funding")
        .update({
          funding_status: status,
          last_funding_check: new Date().toISOString(),
        })
        .eq("openalex_id", prof.openalex_id);

      if (updateError) {
        console.log(`ERROR (db): ${updateError.message}`);
        failed++;
      } else {
        console.log(status);
        updated++;
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failed++;
    }

    // Rate-limit between professors (not after the last one)
    if (i < professors.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Updated: ${updated}  |  Failed: ${failed}`);
  console.log(`Finished at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
