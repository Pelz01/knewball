import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !anonKey) {
  throw new Error("Set SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.");
}

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  args.set(key, value);
}

const body = {
  dryRun: args.get("dry-run") === "true",
  limit: args.has("limit") ? Number(args.get("limit")) : 4,
  matchId: args.get("match-id") ? Number(args.get("match-id")) : undefined,
};

const response = await fetch(`${supabaseUrl}/functions/v1/auto-resolve-results`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  },
  body: JSON.stringify(body),
});

const payload = await response.json();
console.log(JSON.stringify(payload, null, 2));
if (!response.ok) process.exit(1);

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
