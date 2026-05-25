import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  args.set(key, value);
}

const envPath = resolve(process.cwd(), ".env.local");
loadEnvFile(envPath);

const existingDevId = Number(process.env.VITE_DEV_TEST_MATCH_ID ?? "1001");
const overridePath = resolve(process.cwd(), "scripts/api-football-fixture-overrides.json");
const overrides = existsSync(overridePath) ? JSON.parse(readFileSync(overridePath, "utf8")) : {};
const overrideIds = Object.keys(overrides).map(Number).filter(Number.isFinite);
const matchId = args.has("match-id")
  ? Number(args.get("match-id"))
  : Math.max(existingDevId, 1001, ...overrideIds) + 1;
const minutes = args.has("minutes") ? Number(args.get("minutes")) : 10;
const kickoffIso = new Date(Date.now() + minutes * 60 * 1000).toISOString();

if (!Number.isSafeInteger(matchId) || matchId <= 0) throw new Error("Invalid match id.");
if (!Number.isFinite(minutes) || minutes < 2) throw new Error("Use --minutes=2 or higher.");

console.log(`Preparing mock auto-resolve test match ${matchId}`);
console.log(`Kickoff: ${kickoffIso}`);

run("node", ["scripts/seed-test-match.mjs"], {
  KNEWBALL_TEST_MATCH_ID: String(matchId),
  KNEWBALL_TEST_MATCH_KICKOFF: kickoffIso,
});

upsertMockProvider(matchId, kickoffIso);
writeEnvValue(envPath, "VITE_DEV_TEST_MATCH_ID", String(matchId));
writeEnvValue(envPath, "VITE_DEV_TEST_MATCH_KICKOFF", kickoffIso);

overrides[String(matchId)] = {
  external_provider: "mock",
  external_match_id: `dev-${matchId}`,
  note: "Local X Layer testnet automation fixture",
};
writeFileSync(overridePath, `${JSON.stringify(overrides, null, 2)}\n`, "utf8");

console.log("");
console.log("Ready.");
console.log(`Open http://127.0.0.1:8080/matches/${matchId}`);
console.log("After kickoff passes, run:");
console.log("npm.cmd run auto-resolve -- --dry-run=true --limit=5");
console.log("npm.cmd run auto-resolve -- --dry-run=false --limit=5");

function upsertMockProvider(id, kickoff) {
  const sql = `
    insert into public.matches (
      id,
      contract_match_id,
      home_team,
      away_team,
      home_code,
      away_code,
      home_flag,
      away_flag,
      stage,
      kickoff_time,
      status,
      external_provider,
      external_match_id
    )
    values (
      ${id},
      ${id},
      'Mexico',
      'South Africa',
      'MEX',
      'RSA',
      '🇲🇽',
      '🇿🇦',
      'Dev Test',
      '${escapeSql(kickoff)}',
      'open',
      'mock',
      'dev-${id}'
    )
    on conflict (id) do update
    set kickoff_time = excluded.kickoff_time,
        status = 'open',
        external_provider = 'mock',
        external_match_id = excluded.external_match_id,
        updated_at = now();
  `;
  runSupabaseQuery(sql);
}

function runSupabaseQuery(sql) {
  const tokenFile = resolve(homedir(), ".knewball-supabase-token.txt");
  const token = process.env.SUPABASE_ACCESS_TOKEN ?? (existsSync(tokenFile) ? readFileSync(tokenFile, "utf8").trim() : "");
  if (!token) throw new Error("Missing Supabase access token.");

  const file = resolve(tmpdir(), `knewball-prepare-${Date.now()}.sql`);
  writeFileSync(file, sql, "utf8");
  const result = spawnSync("npx", ["supabase", "db", "query", "--linked", "--file", file], {
    cwd: process.cwd(),
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "Supabase query failed.");
}

function writeEnvValue(path, key, value) {
  const lines = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
  let replaced = false;
  const next = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!replaced) next.push(`${key}=${value}`);
  writeFileSync(path, `${next.filter((line, index) => line || index < next.length - 1).join("\n")}\n`, "utf8");
}

function run(command, commandArgs, extraEnv = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    encoding: "utf8",
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(" ")} failed.`);
}

function loadEnvFile(path) {
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

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}
