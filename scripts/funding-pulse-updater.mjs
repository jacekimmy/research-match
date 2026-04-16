import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PROFESSORS_TABLE = process.env.PROFESSORS_TABLE || "professors";
const ID_COLUMN = process.env.PROFESSORS_ID_COLUMN || "id";
const NAME_COLUMN = process.env.PROFESSORS_NAME_COLUMN || "name";
const INSTITUTION_COLUMN = process.env.PROFESSORS_INSTITUTION_COLUMN || "institution";
const OPENALEX_COLUMN = process.env.PROFESSORS_OPENALEX_COLUMN || "openalex_author_id";

const BATCH_SIZE = Number(process.env.FUNDING_BATCH_SIZE || 20);
const REQUEST_DELAY_MS = Number(process.env.FUNDING_REQUEST_DELAY_MS || 450);
const BATCH_DELAY_MS = Number(process.env.FUNDING_BATCH_DELAY_MS || 1500);
const MAX_BATCHES = Number(process.env.FUNDING_MAX_BATCHES || 0);

const STATUS = {
  ACTIVE: "ACTIVE",
  NOT_RECENT: "NOT_RECENT",
  UNKNOWN: "UNKNOWN",
};

const CUTOFF_DATE = new Date();
CUTOFF_DATE.setMonth(CUTOFF_DATE.getMonth() - 18);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitName(displayName) {
  const cleaned = String(displayName || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { first: null, last: null };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { first: null, last: parts[0] };
  return { first: parts[0], last: parts[parts.length - 1] };
}

function parseDate(value) {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const mdy = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, mm, dd, yyyy] = mdy;
    const d = new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

function institutionMatches(recordInstitution, professorInstitution) {
  if (!recordInstitution || !professorInstitution) return true;
  const a = String(recordInstitution).toLowerCase();
  const b = String(professorInstitution).toLowerCase();
  return a.includes(b) || b.includes(a);
}

async function fetchNihAwardDates(name, institution) {
  const { first, last } = splitName(name);
  if (!last) return [];

  const nowYear = new Date().getFullYear();
  const payload = {
    criteria: {
      fiscal_years: [nowYear, nowYear - 1, nowYear - 2],
      pi_names: [{
        last_name: last,
        ...(first ? { first_name: first } : {}),
      }],
      ...(institution ? { org_names: [institution] } : {}),
    },
    include_fields: ["award_notice_date", "project_start_date", "organization", "principal_investigators"],
    offset: 0,
    limit: 50,
    sort_field: "award_notice_date",
    sort_order: "desc",
  };

  const res = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`NIH API failed: ${res.status}`);
  }

  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];

  return results
    .filter((r) => institutionMatches(r?.organization?.org_name || r?.organization?.name, institution))
    .map((r) => parseDate(r?.award_notice_date || r?.project_start_date))
    .filter(Boolean);
}

async function fetchNsfAwardDates(name, institution) {
  const params = new URLSearchParams({
    pdPIName: String(name || ""),
    rpp: "50",
    offset: "1",
  });

  if (institution) params.set("awardeeName", institution);

  const res = await fetch(`https://api.nsf.gov/services/v1/awards.json?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`NSF API failed: ${res.status}`);
  }

  const data = await res.json();
  const awards = Array.isArray(data?.response?.award) ? data.response.award : [];

  return awards
    .filter((a) => institutionMatches(a?.awardeeName, institution))
    .map((a) => parseDate(a?.date || a?.startDate || a?.expDate))
    .filter(Boolean);
}

function resolveFundingStatus(dates) {
  if (!dates.length) return STATUS.UNKNOWN;
  const hasRecent = dates.some((d) => d >= CUTOFF_DATE);
  return hasRecent ? STATUS.ACTIVE : STATUS.NOT_RECENT;
}

async function updateProfessorFundingStatus(record, columnMap) {
  const name = String(record[columnMap.name] || "").trim();
  const institution = String(record[columnMap.institution] || "").trim();

  let nihDates = [];
  let nsfDates = [];

  try {
    nihDates = await fetchNihAwardDates(name, institution);
  } catch (err) {
    console.warn(`[NIH] ${name}: ${String(err)}`);
  }

  await sleep(REQUEST_DELAY_MS);

  try {
    nsfDates = await fetchNsfAwardDates(name, institution);
  } catch (err) {
    console.warn(`[NSF] ${name}: ${String(err)}`);
  }

  const allDates = [...nihDates, ...nsfDates];
  const fundingStatus = resolveFundingStatus(allDates);

  const { error } = await supabaseAdmin
    .from(PROFESSORS_TABLE)
    .update({
      funding_status: fundingStatus,
      last_funding_check: new Date().toISOString(),
    })
    .eq(columnMap.id, record[columnMap.id]);

  if (error) {
    throw new Error(`Failed to update ${name}: ${error.message}`);
  }

  return { fundingStatus, awardsFound: allDates.length };
}

async function fetchProfessorBatch(offset, columnMap) {
  const selectFields = Array.from(new Set([
    columnMap.id,
    columnMap.name,
    columnMap.institution,
    columnMap.openalex,
  ])).join(",");

  const { data, error } = await supabaseAdmin
    .from(PROFESSORS_TABLE)
    .select(selectFields)
    .range(offset, offset + BATCH_SIZE - 1);

  if (error) throw error;
  return data || [];
}

async function resolveColumnMap() {
  const candidateMaps = [
    { id: ID_COLUMN, name: NAME_COLUMN, institution: INSTITUTION_COLUMN, openalex: OPENALEX_COLUMN },
    { id: "id", name: "display_name", institution: "institution", openalex: "openalex_id" },
    { id: "id", name: "name", institution: "last_known_institution", openalex: "openalex_id" },
  ];

  for (const map of candidateMaps) {
    try {
      await fetchProfessorBatch(0, map);
      return map;
    } catch {
      // try next shape
    }
  }

  throw new Error("Could not resolve professors table column mapping. Set PROFESSORS_* env vars.");
}

async function main() {
  console.log("Funding Pulse updater starting...");
  console.log(`Table: ${PROFESSORS_TABLE}`);
  console.log(`Batch size: ${BATCH_SIZE}, request delay: ${REQUEST_DELAY_MS}ms, batch delay: ${BATCH_DELAY_MS}ms`);

  const columnMap = await resolveColumnMap();
  console.log("Using columns:", columnMap);

  let offset = 0;
  let batchCount = 0;
  let processed = 0;
  let active = 0;
  let notRecent = 0;
  let unknown = 0;

  while (true) {
    if (MAX_BATCHES > 0 && batchCount >= MAX_BATCHES) break;

    const batch = await fetchProfessorBatch(offset, columnMap);
    if (!batch.length) break;

    batchCount += 1;
    console.log(`\nBatch ${batchCount}: ${batch.length} professors`);

    for (const professor of batch) {
      const name = String(professor[columnMap.name] || "Unknown");
      try {
        const result = await updateProfessorFundingStatus(professor, columnMap);
        processed += 1;

        if (result.fundingStatus === STATUS.ACTIVE) active += 1;
        else if (result.fundingStatus === STATUS.NOT_RECENT) notRecent += 1;
        else unknown += 1;

        console.log(`- ${name}: ${result.fundingStatus} (${result.awardsFound} awards)`);
      } catch (err) {
        unknown += 1;
        processed += 1;
        console.error(`- ${name}: UNKNOWN (${String(err)})`);
      }

      await sleep(REQUEST_DELAY_MS);
    }

    offset += BATCH_SIZE;
    await sleep(BATCH_DELAY_MS);
  }

  console.log("\nFunding Pulse updater complete.");
  console.log(`Processed: ${processed}`);
  console.log(`ACTIVE: ${active}, NOT_RECENT: ${notRecent}, UNKNOWN: ${unknown}`);
}

main().catch((err) => {
  console.error("Funding updater failed:", err);
  process.exit(1);
});
