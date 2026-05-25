import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

loadEnvFile(".env.local");

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  args.set(key, value);
}

const dryRun = args.get("dry-run") !== "false";
const limit = args.has("limit") ? Number(args.get("limit")) : 30;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canUseSupabaseClient = Boolean(supabaseUrl && serviceRoleKey);
const apiKey = process.env.API_FOOTBALL_KEY;
const baseUrl = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";
const overrides = readOverrides();

if (!apiKey) {
  throw new Error("Set API_FOOTBALL_KEY.");
}

const supabase = canUseSupabaseClient
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

const matches = supabase
  ? await loadMatchesFromSupabase(supabase, limit)
  : await loadMatchesWithCli(limit);

let saved = 0;
let reviewed = 0;

for (const match of matches ?? []) {
  const override = overrides[String(match.id)];
  if (override) {
    await maybeSave(match, {
      provider: override.external_provider ?? "api-football",
      externalMatchId: String(override.external_match_id),
      confidence: 100,
      note: override.note ?? "manual override",
    });
    continue;
  }

  const date = new Date(match.kickoff_time).toISOString().slice(0, 10);
  const candidates = await fetchFixturesByDate(date);
  const ranked = candidates
    .map((candidate) => scoreCandidate(match, candidate))
    .filter((candidate) => candidate.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
  const best = ranked[0];

  if (!best) {
    reviewed++;
    console.log(`${label(match)}\n  No likely fixture found\n  Status: needs manual review\n`);
    continue;
  }

  const fixtureLabel = `${best.fixture.teams.home.name} vs ${best.fixture.teams.away.name}`;
  console.log(`${label(match)}`);
  console.log(`  Found fixture: ${fixtureLabel}`);
  console.log(`  Fixture ID: ${best.fixture.fixture.id}`);
  console.log(`  Kickoff: ${best.fixture.fixture.date}`);
  console.log(`  Confidence: ${best.confidence}%`);

  if (best.confidence >= 85) {
    await maybeSave(match, {
      provider: "api-football",
      externalMatchId: String(best.fixture.fixture.id),
      confidence: best.confidence,
      note: "high confidence",
    });
  } else {
    reviewed++;
    console.log("  Status: needs manual review\n");
  }
}

console.log(`Done. Saved: ${saved}. Needs review: ${reviewed}. Dry run: ${dryRun}.`);

async function maybeSave(match, external) {
  console.log(`${label(match)}`);
  console.log(`  Provider: ${external.provider}`);
  console.log(`  Fixture ID: ${external.externalMatchId}`);
  console.log(`  Confidence: ${external.confidence}%`);
  console.log(`  Note: ${external.note}`);

  if (dryRun) {
    console.log("  Status: dry-run\n");
    return;
  }

  if (supabase) {
    const { error: updateError } = await supabase
      .from("matches")
      .update({
        external_provider: external.provider,
        external_match_id: external.externalMatchId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.id);
    if (updateError) throw updateError;
  } else {
    runSupabaseQuery(`
      update public.matches
      set external_provider = '${escapeSql(external.provider)}',
          external_match_id = '${escapeSql(external.externalMatchId)}',
          updated_at = now()
      where id = ${Number(match.id)};
    `);
  }
  saved++;
  console.log("  Status: saved\n");
}

async function loadMatchesFromSupabase(client, rowLimit) {
  const { data, error } = await client
    .from("matches")
    .select("id,home_team,away_team,home_code,away_code,kickoff_time,external_provider,external_match_id")
    .is("external_match_id", null)
    .order("kickoff_time", { ascending: true })
    .limit(rowLimit);
  if (error) throw error;
  return data ?? [];
}

async function loadMatchesWithCli(rowLimit) {
  const sql = `
    select json_agg(row_to_json(matches_query)) as matches
    from (
      select id, home_team, away_team, home_code, away_code, kickoff_time, external_provider, external_match_id
      from public.matches
      where external_match_id is null
      order by kickoff_time asc
      limit ${Number(rowLimit)}
    ) matches_query;
  `;
  const payload = runSupabaseQuery(sql);
  const firstRow = payload.rows?.[0];
  return firstRow?.matches ?? [];
}

async function fetchFixturesByDate(date) {
  const url = new URL("/fixtures", baseUrl);
  url.searchParams.set("date", date);
  const response = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!response.ok) throw new Error(`API-FOOTBALL fixtures request failed: ${response.status}`);
  const payload = await response.json();
  return payload.response ?? [];
}

function scoreCandidate(match, fixture) {
  const homeScore = similarity(match.home_team, fixture.teams.home.name);
  const awayScore = similarity(match.away_team, fixture.teams.away.name);
  const swappedHome = similarity(match.home_team, fixture.teams.away.name);
  const swappedAway = similarity(match.away_team, fixture.teams.home.name);
  const normalTeamScore = (homeScore + awayScore) / 2;
  const swappedTeamScore = (swappedHome + swappedAway) / 2 - 20;
  const teamScore = Math.max(normalTeamScore, swappedTeamScore);
  const kickoffDeltaMinutes = Math.abs(new Date(match.kickoff_time).getTime() - new Date(fixture.fixture.date).getTime()) / 60000;
  const timeScore = kickoffDeltaMinutes <= 120 ? Math.max(0, 100 - Math.round(kickoffDeltaMinutes / 2)) : 0;
  const confidence = Math.max(0, Math.round(teamScore * 0.7 + timeScore * 0.3));
  return { fixture, confidence };
}

function similarity(a, b) {
  const left = normalizeTeam(a);
  const right = normalizeTeam(b);
  if (left === right) return 100;
  if (left.includes(right) || right.includes(left)) return 88;

  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const total = new Set([...leftTokens, ...rightTokens]).size || 1;
  return Math.round((shared / total) * 100);
}

function normalizeTeam(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bunited states\b/g, "usa")
    .replace(/\bsouth korea\b/g, "korea republic")
    .replace(/\bczechia\b/g, "czech republic")
    .replace(/\btürkiye\b/g, "turkey")
    .replace(/\bivory coast\b/g, "cote d ivoire")
    .replace(/\bdr congo\b/g, "congo dr")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function label(match) {
  return `${match.home_code} vs ${match.away_code}`;
}

function readOverrides() {
  const file = resolve(process.cwd(), "scripts/api-football-fixture-overrides.json");
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8"));
}

function runSupabaseQuery(sql) {
  const tokenFile = resolve(homedir(), ".knewball-supabase-token.txt");
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? (existsSync(tokenFile) ? readFileSync(tokenFile, "utf8").trim() : "");
  if (!token) {
    throw new Error("Set SUPABASE_SERVICE_ROLE_KEY or keep ~/.knewball-supabase-token.txt available.");
  }

  const file = resolve(tmpdir(), `knewball-fixtures-${Date.now()}.sql`);
  writeFileSync(file, sql, "utf8");
  const result = spawnSync("npx", ["supabase", "db", "query", "--linked", "--file", file], {
    cwd: process.cwd(),
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Supabase query failed.");
  }
  return JSON.parse(result.stdout);
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    if (process.env[key]) continue;
    process.env[key] = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}
