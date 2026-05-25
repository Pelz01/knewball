import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  getResolverWallet,
  getXLayerConfig,
  knewBallCupAbi,
} from "../_shared/xlayer.ts";

type MatchRow = {
  id: number;
  contract_match_id: number;
  home_code: string;
  away_code: string;
  kickoff_time: string;
  status: string;
  external_provider: string | null;
  external_match_id: string | null;
};

type ApiFootballFixture = {
  fixture: {
    id: number;
    status: {
      short: string;
      long: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type ApiFootballEvent = {
  team: { id: number; name: string };
  type: string;
  detail: string;
};

const FINISHED_STATUS = new Set(["FT", "AET", "PEN"]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "POST required." }, 405);

  try {
    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    const baseUrl = Deno.env.get("API_FOOTBALL_BASE_URL") ?? "https://v3.football.api-sports.io";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!apiKey) throw new Error("Missing API_FOOTBALL_KEY secret.");
    if (!serviceRoleKey || !supabaseUrl) throw new Error("Missing Supabase service secrets.");

    const payload = await safeJson(request);
    const limit = clamp(Number(payload.limit ?? 4), 1, 10);
    const dryRun = Boolean(payload.dryRun);
    const targetMatchId = payload.matchId ? Number(payload.matchId) : null;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let query = supabase
      .from("matches")
      .select("id,contract_match_id,home_code,away_code,kickoff_time,status,external_provider,external_match_id")
      .neq("status", "resolved")
      .lte("kickoff_time", new Date().toISOString())
      .not("external_match_id", "is", null)
      .order("kickoff_time", { ascending: true })
      .limit(limit);
    if (targetMatchId) query = query.eq("id", targetMatchId);

    const { data, error } = await query;
    if (error) throw error;

    const matches = (data ?? []) as MatchRow[];
    const settled = [];
    const skipped = [];

    for (const match of matches) {
      if ((match.external_provider ?? "api-football") === "mock") {
        const result = mockResult(match);
        if (dryRun) {
          settled.push({ matchId: match.id, dryRun: true, provider: "mock", result });
          continue;
        }

        const synced = await resolveAndSync({ match, result, supabase });
        settled.push({ matchId: match.id, provider: "mock", ...synced });
        continue;
      }

      const fixture = await fetchFixture(baseUrl, apiKey, match.external_match_id!);
      if (!fixture) {
        skipped.push({ matchId: match.id, reason: "fixture_not_found" });
        continue;
      }
      if (!FINISHED_STATUS.has(fixture.fixture.status.short)) {
        skipped.push({ matchId: match.id, reason: `not_finished:${fixture.fixture.status.short}` });
        continue;
      }
      if (fixture.goals.home === null || fixture.goals.away === null) {
        skipped.push({ matchId: match.id, reason: "missing_score" });
        continue;
      }

      const events = await fetchEvents(baseUrl, apiKey, match.external_match_id!);
      const firstGoal = deriveFirstGoal(events, match);
      const result = {
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        firstGoal,
      };

      if (dryRun) {
        settled.push({ matchId: match.id, dryRun: true, result, apiStatus: fixture.fixture.status.short });
        continue;
      }

      const synced = await resolveAndSync({ match, result, supabase });
      settled.push({ matchId: match.id, ...synced });
    }

    return jsonResponse({ status: "ok", checked: matches.length, settled, skipped });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Auto resolve failed." }, 500);
  }
});

async function resolveAndSync({
  match,
  result,
  supabase,
}: {
  match: MatchRow;
  result: { homeScore: number; awayScore: number; firstGoal: "home" | "away" | "none" };
  supabase: ReturnType<typeof createClient>;
}) {
  const { contractAddress, publicClient } = getXLayerConfig();
  const { account, walletClient } = getResolverWallet();

  const existing = await publicClient.readContract({
    abi: knewBallCupAbi,
    address: contractAddress,
    functionName: "results",
    args: [BigInt(match.contract_match_id)],
  });

  let txHash: `0x${string}`;
  if (existing[7]) {
    const { data: row, error } = await supabase.rpc("sync_result_memory", {
      target_match_id: match.id,
      target_home_score: Number(existing[0]),
      target_away_score: Number(existing[1]),
      target_winner: winnerPick(existing[2]),
      target_first_goal: firstGoalPick(existing[3]),
      target_both_teams_scored: binaryPick(existing[4]),
      target_total_goals: totalGoalsPick(existing[5]),
      target_resolved_tx_hash: null,
      target_resolved_at: new Date(Number(existing[6]) * 1000).toISOString(),
      target_is_upset_result: false,
      target_chaos_outcome: null,
    });
    if (error) throw error;
    return { status: "already_resolved_onchain", synced: row };
  }

  txHash = await walletClient.writeContract({
    abi: knewBallCupAbi,
    account,
    address: contractAddress,
    functionName: "resolveMatch",
    args: [
      BigInt(match.contract_match_id),
      result.homeScore,
      result.awayScore,
      firstGoalCode(result.firstGoal),
    ],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const resolvedBlock = await publicClient.getBlock({ blockNumber: receipt.blockNumber });

  const contractResult = await publicClient.readContract({
    abi: knewBallCupAbi,
    address: contractAddress,
    functionName: "results",
    args: [BigInt(match.contract_match_id)],
  });
  const resolvedAtSeconds = contractResult[6] > 0n ? contractResult[6] : resolvedBlock.timestamp;
  const { data: syncedRows, error: syncError } = await supabase.rpc("sync_result_memory", {
    target_match_id: match.id,
    target_home_score: Number(contractResult[0]),
    target_away_score: Number(contractResult[1]),
    target_winner: winnerPick(contractResult[2]),
    target_first_goal: firstGoalPick(contractResult[3]),
    target_both_teams_scored: binaryPick(contractResult[4]),
    target_total_goals: totalGoalsPick(contractResult[5]),
    target_resolved_tx_hash: txHash,
    target_resolved_at: new Date(Number(resolvedAtSeconds) * 1000).toISOString(),
    target_is_upset_result: false,
    target_chaos_outcome: null,
  });
  if (syncError) throw syncError;

  return {
    status: "resolved",
    txHash,
    synced: Array.isArray(syncedRows) ? syncedRows[0] : syncedRows,
  };
}

async function fetchFixture(baseUrl: string, apiKey: string, fixtureId: string) {
  const url = new URL("/fixtures", baseUrl);
  url.searchParams.set("id", fixtureId);
  const payload = await apiFootballFetch<{ response: ApiFootballFixture[] }>(url, apiKey);
  return payload.response?.[0] ?? null;
}

async function fetchEvents(baseUrl: string, apiKey: string, fixtureId: string) {
  const url = new URL("/fixtures/events", baseUrl);
  url.searchParams.set("fixture", fixtureId);
  const payload = await apiFootballFetch<{ response: ApiFootballEvent[] }>(url, apiKey);
  return payload.response ?? [];
}

async function apiFootballFetch<T>(url: URL, apiKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!response.ok) {
    throw new Error(`API-FOOTBALL request failed: ${response.status}`);
  }
  return await response.json() as T;
}

function deriveFirstGoal(events: ApiFootballEvent[], match: MatchRow) {
  const firstGoalEvent = events.find((event) => (
    event.type.toLowerCase() === "goal" &&
    !event.detail.toLowerCase().includes("missed penalty")
  ));
  if (!firstGoalEvent) return "none";

  const teamName = firstGoalEvent.team.name.toLowerCase();
  if (teamName.includes(match.home_code.toLowerCase())) return "home";
  if (teamName.includes(match.away_code.toLowerCase())) return "away";
  return "home";
}

function mockResult(_match: MatchRow) {
  return {
    homeScore: 2,
    awayScore: 1,
    firstGoal: "home" as const,
  };
}

async function safeJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function numeric(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

function winnerPick(value: number | bigint) {
  const pick = numeric(value);
  if (pick === 0) return "home";
  if (pick === 1) return "draw";
  if (pick === 2) return "away";
  throw new Error("Invalid winner result.");
}

function totalGoalsPick(value: number | bigint) {
  const pick = numeric(value);
  if (pick === 0) return "under";
  if (pick === 1) return "over";
  throw new Error("Invalid total goals result.");
}

function binaryPick(value: number | bigint) {
  const pick = numeric(value);
  if (pick === 0) return "no";
  if (pick === 1) return "yes";
  throw new Error("Invalid binary result.");
}

function firstGoalPick(value: number | bigint) {
  const pick = numeric(value);
  if (pick === 0) return "home";
  if (pick === 1) return "away";
  if (pick === 2) return "none";
  throw new Error("Invalid first goal result.");
}

function firstGoalCode(value: "home" | "away" | "none") {
  if (value === "home") return 0;
  if (value === "away") return 1;
  return 2;
}
