import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  decodeSubmittedPrediction,
  getXLayerConfig,
  isAddress,
  isHash,
  knewBallCupAbi,
} from "../_shared/xlayer.ts";

type PredictionSyncRequest = {
  walletAddress?: string;
  matchId?: number | string;
  txHash?: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "POST required." }, 405);

  try {
    const payload = await request.json() as PredictionSyncRequest;
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
    const [transaction, receipt] = await Promise.all([
      publicClient.getTransaction({ hash: payload.txHash }),
      publicClient.getTransactionReceipt({ hash: payload.txHash }),
    ]);
    if (receipt.status !== "success") return jsonResponse({ error: "Prediction transaction failed." }, 409);
    if (transaction.from.toLowerCase() !== walletAddress) {
      return jsonResponse({ error: "Transaction sender mismatch." }, 403);
    }
    if (transaction.to?.toLowerCase() !== contractAddress.toLowerCase()) {
      return jsonResponse({ error: "Contract target mismatch." }, 403);
    }

    const submitted = decodeSubmittedPrediction(transaction.input);
    if (submitted.matchId !== BigInt(matchId)) {
      return jsonResponse({ error: "Prediction matchId mismatch." }, 409);
    }
    if (BigInt(match.contract_match_id) !== submitted.matchId) {
      return jsonResponse({ error: "Supabase contract_match_id mismatch." }, 409);
    }

    const contractPrediction = await publicClient.readContract({
      abi: knewBallCupAbi,
      address: contractAddress,
      functionName: "predictions",
      args: [BigInt(matchId), walletAddress],
    });
    const lockedAt = contractPrediction[6];
    const exists = contractPrediction[8];
    if (!exists || lockedAt <= 0n) {
      return jsonResponse({ error: "Contract prediction is not locked." }, 409);
    }
    if (!matchesContractPrediction(contractPrediction, submitted)) {
      return jsonResponse({ error: "Contract prediction does not match submitted calldata." }, 409);
    }

    const { data: syncedRows, error: syncError } = await supabase.rpc("sync_prediction_memory", {
      target_wallet: walletAddress,
      target_match_id: matchId,
      target_winner_pick: winnerPick(submitted.winner),
      target_home_score_pick: Number(submitted.homeScore),
      target_away_score_pick: Number(submitted.awayScore),
      target_total_goals_pick: totalGoalsPick(submitted.totalGoals),
      target_both_teams_scored_pick: binaryPick(submitted.bothTeamsScored),
      target_first_goal_pick: firstGoalPick(submitted.firstGoal),
      target_lock_tx_hash: payload.txHash,
      target_locked_at: new Date(Number(lockedAt) * 1000).toISOString(),
      target_contract_address: contractAddress,
      target_network: network,
    });
    if (syncError) throw syncError;

    const synced = Array.isArray(syncedRows) ? syncedRows[0] : syncedRows;
    return jsonResponse({
      status: synced.status,
      prediction: {
        id: synced.prediction_id,
        walletAddress: synced.wallet_address,
        matchId: synced.match_id,
        lockTxHash: synced.lock_tx_hash,
        lockedAt: synced.locked_at,
      },
      badgesUnlocked: synced.badges_awarded,
      proofUrl: `/proof/${synced.prediction_id}`,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Prediction sync failed." }, 500);
  }
});

function toMatchId(value: PredictionSyncRequest["matchId"]) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) throw new Error("Invalid matchId.");
  return numeric;
}

function matchesContractPrediction(
  contractPrediction: readonly [number, number, number, number, number, number, bigint, bigint, boolean, boolean],
  submitted: ReturnType<typeof decodeSubmittedPrediction>,
) {
  return BigInt(contractPrediction[0]) === submitted.winner &&
    BigInt(contractPrediction[1]) === submitted.homeScore &&
    BigInt(contractPrediction[2]) === submitted.awayScore &&
    BigInt(contractPrediction[3]) === submitted.totalGoals &&
    BigInt(contractPrediction[4]) === submitted.bothTeamsScored &&
    BigInt(contractPrediction[5]) === submitted.firstGoal;
}

function winnerPick(value: bigint) {
  if (value === 0n) return "home";
  if (value === 1n) return "draw";
  if (value === 2n) return "away";
  throw new Error("Invalid winner pick.");
}

function totalGoalsPick(value: bigint) {
  if (value === 0n) return "under";
  if (value === 1n) return "over";
  throw new Error("Invalid total goals pick.");
}

function binaryPick(value: bigint) {
  if (value === 0n) return "no";
  if (value === 1n) return "yes";
  throw new Error("Invalid binary pick.");
}

function firstGoalPick(value: bigint) {
  if (value === 0n) return "home";
  if (value === 1n) return "away";
  if (value === 2n) return "none";
  throw new Error("Invalid first goal pick.");
}
