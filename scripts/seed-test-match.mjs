import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, createWalletClient, parseAbi } from "viem";
import { getContractAddress, getContractEnvironment } from "./contract-env.mjs";

const abi = parseAbi([
  "function createMatch(uint256 matchId, string homeTeam, string awayTeam, uint256 kickoffTime)",
  "function matches(uint256 matchId) view returns (string homeTeam, string awayTeam, uint256 kickoffTime, bool exists)",
]);

const TESTNET_CHAIN_ID = 1952;
const matchId = BigInt(process.env.KNEWBALL_TEST_MATCH_ID ?? "1000");
const kickoffIso =
  process.env.KNEWBALL_TEST_MATCH_KICKOFF ??
  process.env.VITE_DEV_TEST_MATCH_KICKOFF ??
  new Date(Date.now() + 5 * 60 * 1000).toISOString();
const kickoffTime = BigInt(Math.floor(new Date(kickoffIso).getTime() / 1000));

if (!Number.isFinite(new Date(kickoffIso).getTime())) {
  throw new Error(`Invalid test kickoff timestamp: ${kickoffIso}`);
}

const address = getContractAddress();
const { account, chain, explorerUrl, transport } = getContractEnvironment();
if (chain.id !== TESTNET_CHAIN_ID) {
  throw new Error("Refusing to seed a dev test match outside X Layer testnet.");
}
if (kickoffTime <= BigInt(Math.floor(Date.now() / 1000))) {
  throw new Error("KnewBallCup rejects past kickoff creation. Use a kickoff a few minutes in the future.");
}

const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ account, chain, transport });

console.log(`Seeding test-only match ${matchId} on ${chain.name}`);
console.log(`Kickoff: ${kickoffIso}`);
console.log(`Contract: ${address}`);

const current = await publicClient.readContract({
  abi,
  address,
  functionName: "matches",
  args: [matchId],
});

if (current[3]) {
  console.log(`Skip ${matchId}: ${current[0]} vs ${current[1]} already exists, kickoff ${new Date(Number(current[2]) * 1000).toISOString()}.`);
} else {
  const hash = await walletClient.writeContract({
    abi,
    account,
    address,
    functionName: "createMatch",
    args: [matchId, "MEX", "RSA", kickoffTime],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Created ${matchId}: MEX vs RSA - ${explorerUrl}/tx/${hash}`);
}

await upsertSupabaseMatch();

console.log("");
console.log("Use this in .env.local while testing the dev match:");
console.log(`VITE_DEV_TEST_MATCH_KICKOFF=${kickoffIso}`);
console.log("");
console.log(`Open http://127.0.0.1:8080/matches/${matchId.toString()}`);

async function upsertSupabaseMatch() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.log(`Supabase service env is missing, so DB match ${matchId} was not upserted.`);
    console.log("Run this in Supabase SQL if needed:");
    console.log(`insert into public.matches (id, contract_match_id, home_team, away_team, home_code, away_code, home_flag, away_flag, stage, kickoff_time, status)
values (${matchId}, ${matchId}, 'Mexico', 'South Africa', 'MEX', 'RSA', '🇲🇽', '🇿🇦', 'Dev Test', '${kickoffIso}', 'open')
on conflict (id) do update set kickoff_time = excluded.kickoff_time, status = 'open';`);
    return;
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { error } = await supabase
    .from("matches")
    .upsert({
      id: Number(matchId),
      contract_match_id: Number(matchId),
      home_team: "Mexico",
      away_team: "South Africa",
      home_code: "MEX",
      away_code: "RSA",
      home_flag: "🇲🇽",
      away_flag: "🇿🇦",
      stage: "Dev Test",
      kickoff_time: kickoffIso,
      status: "open",
    }, { onConflict: "id" });
  if (error) throw error;
  console.log("Supabase match row upserted.");
}
