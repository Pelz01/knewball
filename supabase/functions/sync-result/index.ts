import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  decodeResolvedMatch,
  getXLayerConfig,
  isAddress,
  isHash,
  knewBallCupAbi,
} from "../_shared/xlayer.ts";

type ResultSyncRequest = {
  walletAddress?: string;
  matchId?: number | string;
  txHash?: string;
  isUpsetResult?: boolean;
  chaosOutcome?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "POST required." }, 405);

  try {
    const payload = await request.json() as ResultSyncRequest;
    if (!isAddress(payload.walletAddress)) return jsonResponse({ error: "Invalid walletAddress." }, 400);
    if (!isHash(payload.txHash)) return jsonResponse({ error: "Invalid txHash." }, 400);

    const matchId = toMatchId(payload.matchId);
    const walletAddress = payload.walletAddress.toLowerCase();
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) throw new Error("Missing Supabase service secrets.");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id,contract_match_id")
      .eq("id", matchId)
      .maybeSingle();
    if (matchError) throw matchError;
    if (!match) return jsonResponse({ error: "Match does not exist in Supabase." }, 409);

    const { contractAddress, network, publicClient } = getXLayerConfig();
    const [transaction, receipt, owner] = await Promise.all([
      publicClient.getTransaction({ hash: payload.txHash }),
      publicClient.getTransactionReceipt({ hash: payload.txHash }),
      publicClient.readContract({
        abi: knewBallCupAbi,
        address: contractAddress,
        functionName: "owner",
      }),
    ]);
    if (receipt.status !== "success") return jsonResponse({ error: "Resolve transaction failed." }, 409);
    if (transaction.from.toLowerCase() !== walletAddress) return jsonResponse({ error: "Transaction sender mismatch." }, 403);
    if (transaction.from.toLowerCase() !== owner.toLowerCase()) return jsonResponse({ error: "Only the KnewBallCup owner can sync results." }, 403);
    if (transaction.to?.toLowerCase() !== contractAddress.toLowerCase()) return jsonResponse({ error: "Contract target mismatch." }, 403);

    const resolved = decodeResolvedMatch(transaction.input);
    if (resolved.matchId !== BigInt(matchId)) return jsonResponse({ error: "Resolve matchId mismatch." }, 409);
    if (BigInt(match.contract_match_id) !== resolved.matchId) return jsonResponse({ error: "Supabase contract_match_id mismatch." }, 409);

    const contractResult = await publicClient.readContract({
      abi: knewBallCupAbi,
      address: contractAddress,
      functionName: "results",
      args: [BigInt(matchId)],
    });
    const resultResolved = contractResult[7];
    if (!resultResolved || contractResult[6] <= 0n) {
      return jsonResponse({ error: "Contract result is not resolved." }, 409);
    }
    if (
      numeric(contractResult[0]) !== numeric(resolved.homeScore) ||
      numeric(contractResult[1]) !== numeric(resolved.awayScore) ||
      numeric(contractResult[3]) !== numeric(resolved.firstGoal)
    ) {
      return jsonResponse({ error: "Contract result does not match submitted calldata." }, 409);
    }
    const resolvedBlock = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
    const resolvedAtSeconds = contractResult[6] > 0n ? contractResult[6] : resolvedBlock.timestamp;

    const { data: syncedRows, error: syncError } = await supabase.rpc("sync_result_memory", {
      target_match_id: matchId,
      target_home_score: Number(contractResult[0]),
      target_away_score: Number(contractResult[1]),
      target_winner: winnerPick(contractResult[2]),
      target_first_goal: firstGoalPick(contractResult[3]),
      target_both_teams_scored: binaryPick(contractResult[4]),
      target_total_goals: totalGoalsPick(contractResult[5]),
      target_resolved_tx_hash: payload.txHash,
      target_resolved_at: new Date(Number(resolvedAtSeconds) * 1000).toISOString(),
      target_is_upset_result: Boolean(payload.isUpsetResult),
      target_chaos_outcome: payload.chaosOutcome?.trim() || null,
    });
    if (syncError) throw syncError;

    const synced = Array.isArray(syncedRows) ? syncedRows[0] : syncedRows;
    return jsonResponse({
      status: synced.status,
      network,
      matchId: synced.match_id,
      resolvedAt: synced.resolved_at,
      result: {
        homeScore: Number(contractResult[0]),
        awayScore: Number(contractResult[1]),
        winner: winnerPick(contractResult[2]),
        firstGoal: firstGoalPick(contractResult[3]),
        btts: binaryPick(contractResult[4]),
        overUnder: totalGoalsPick(contractResult[5]),
      },
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Result sync failed." }, 500);
  }
});

function toMatchId(value: ResultSyncRequest["matchId"]) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) throw new Error("Invalid matchId.");
  return numeric;
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
