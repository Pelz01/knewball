import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  decodeClaimMatchId,
  getXLayerConfig,
  isAddress,
  isHash,
  knewBallCupAbi,
} from "../_shared/xlayer.ts";

type ClaimRequest = {
  walletAddress?: string;
  matchId?: number | string;
  txHash?: string;
};

type PredictionRow = {
  id: string;
  wallet_address: string;
  match_id: number;
  winner_pick: "home" | "draw" | "away";
  home_score_pick: number;
  away_score_pick: number;
  total_goals_pick: "under" | "over";
  both_teams_scored_pick: "no" | "yes";
  first_goal_pick: "home" | "away" | "none";
  claimed: boolean;
};

type MatchResultRow = {
  home_score: number;
  away_score: number;
  winner: "home" | "draw" | "away";
  first_goal: "home" | "away" | "none";
  both_teams_scored: "no" | "yes";
  total_goals: "under" | "over";
};

type MatchRow = {
  home_code: string;
  away_code: string;
  underdog_team: string | null;
  is_upset_result: boolean;
  chaos_outcome: string | null;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "POST required." }, 405);

  try {
    const payload = await request.json() as ClaimRequest;
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
    const { data: prediction, error: predictionError } = await supabase
      .from("predictions")
      .select("id,wallet_address,match_id,winner_pick,home_score_pick,away_score_pick,total_goals_pick,both_teams_scored_pick,first_goal_pick,claimed")
      .eq("wallet_address", walletAddress)
      .eq("match_id", matchId)
      .maybeSingle<PredictionRow>();
    if (predictionError) throw predictionError;
    if (!prediction) return jsonResponse({ error: "Prediction is not synced yet." }, 409);

    if (prediction.claimed) {
      return jsonResponse({
        status: "already_synced",
        message: "Claim already synced.",
        predictionId: prediction.id,
      });
    }

    const { contractAddress, network, publicClient } = getXLayerConfig();
    const [transaction, receipt] = await Promise.all([
      publicClient.getTransaction({ hash: payload.txHash }),
      publicClient.getTransactionReceipt({ hash: payload.txHash }),
    ]);
    if (receipt.status !== "success") return jsonResponse({ error: "Claim transaction failed." }, 409);
    if (transaction.from.toLowerCase() !== walletAddress) return jsonResponse({ error: "Transaction sender mismatch." }, 403);
    if (transaction.to?.toLowerCase() !== contractAddress.toLowerCase()) return jsonResponse({ error: "Contract target mismatch." }, 403);

    const claimedMatchId = decodeClaimMatchId(transaction.input);
    if (claimedMatchId !== BigInt(matchId)) return jsonResponse({ error: "Claim matchId mismatch." }, 409);

    const contractPrediction = await publicClient.readContract({
      abi: knewBallCupAbi,
      address: contractAddress,
      functionName: "predictions",
      args: [BigInt(matchId), walletAddress],
    });
    const pointsEarned = Number(contractPrediction[7]);
    const exists = contractPrediction[8];
    const claimed = contractPrediction[9];
    if (!exists || !claimed) return jsonResponse({ error: "Contract claim state is not settled." }, 409);

    const [{ data: result, error: resultError }, { data: match, error: matchError }, claimBlock] = await Promise.all([
      supabase
        .from("match_results")
        .select("home_score,away_score,winner,first_goal,both_teams_scored,total_goals")
        .eq("match_id", matchId)
        .single<MatchResultRow>(),
      supabase
        .from("matches")
        .select("home_code,away_code,underdog_team,is_upset_result,chaos_outcome")
        .eq("id", matchId)
        .single<MatchRow>(),
      publicClient.getBlock({ blockHash: receipt.blockHash }),
    ]);
    if (resultError) throw resultError;
    if (matchError) throw matchError;

    const badgeIds = await calculateBadgeIds(supabase, walletAddress, prediction, result, match);
    const outcome = calculateOutcome(prediction, result);
    const { data: syncedRows, error: syncError } = await supabase.rpc("sync_claim_memory", {
      target_wallet: walletAddress,
      target_match_id: matchId,
      target_claim_tx_hash: payload.txHash,
      target_claimed_at: new Date(Number(claimBlock.timestamp) * 1000).toISOString(),
      target_points_earned: pointsEarned,
      target_correct_count: outcome.correctCount,
      target_tier: outcome.tier,
      target_badge_ids: badgeIds,
    });
    if (syncError) throw syncError;

    const synced = Array.isArray(syncedRows) ? syncedRows[0] : syncedRows;
    return jsonResponse({
      status: synced.status,
      network,
      pointsEarned: synced.points_earned,
      correctCount: synced.correct_count,
      tier: synced.tier,
      badgesUnlocked: synced.badges_awarded,
      predictionId: synced.prediction_id,
      proofUrl: `/proof/${synced.prediction_id}`,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Claim sync failed." }, 500);
  }
});

function toMatchId(value: ClaimRequest["matchId"]) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) throw new Error("Invalid matchId.");
  return numeric;
}

function calculateOutcome(prediction: PredictionRow, result: MatchResultRow) {
  const exactScore =
    prediction.home_score_pick === result.home_score &&
    prediction.away_score_pick === result.away_score;
  const correct = [
    prediction.winner_pick === result.winner,
    exactScore,
    prediction.total_goals_pick === result.total_goals,
    prediction.both_teams_scored_pick === result.both_teams_scored,
    prediction.first_goal_pick === result.first_goal,
  ];
  const correctCount = correct.filter(Boolean).length;
  const tier =
    correctCount === 5 ? "perfect_slate" :
    correctCount === 4 ? "sharp_call" :
    correctCount === 3 ? "strong_call" :
    correctCount > 0 ? "partial" :
    "none";
  return { correctCount, exactScore, tier };
}

async function calculateBadgeIds(
  supabase: ReturnType<typeof createClient>,
  walletAddress: string,
  prediction: PredictionRow,
  result: MatchResultRow,
  match: MatchRow,
) {
  const outcome = calculateOutcome(prediction, result);
  const winnerCorrect = prediction.winner_pick === result.winner;
  const firstGoalCorrect =
    result.first_goal !== "none" && prediction.first_goal_pick === result.first_goal;
  const underdogWon =
    match.underdog_team &&
    ((result.winner === "home" && match.underdog_team === match.home_code) ||
      (result.winner === "away" && match.underdog_team === match.away_code));
  const candidates = [
    outcome.tier === "strong_call" ? "strong_call" : null,
    outcome.tier === "sharp_call" ? "sharp_call" : null,
    outcome.tier === "perfect_slate" ? "perfect_slate" : null,
    outcome.exactScore ? "score_prophet" : null,
    firstGoalCorrect ? "first_blood" : null,
    winnerCorrect && underdogWon ? "upset_hunter" : null,
    winnerCorrect && (match.is_upset_result || match.chaos_outcome) ? "chaos_merchant" : null,
  ].filter((badgeId): badgeId is string => Boolean(badgeId));

  if (winnerCorrect) {
    const { data: knewBall, error } = await supabase
      .from("user_badges")
      .select("id")
      .eq("wallet_address", walletAddress)
      .eq("badge_id", "knew_ball")
      .limit(1);
    if (error) throw error;
    if (!knewBall || knewBall.length === 0) candidates.push("knew_ball");
  }

  const { data: recentClaims, error: recentError } = await supabase
    .from("predictions")
    .select("correct_count")
    .eq("wallet_address", walletAddress)
    .eq("claimed", true)
    .order("claimed_at", { ascending: false })
    .limit(4);
  if (recentError) throw recentError;

  const formWindow = [
    outcome.correctCount,
    ...((recentClaims ?? []) as { correct_count: number }[]).map((claim) => claim.correct_count),
  ].slice(0, 5);
  if (formWindow.length >= 5) {
    const formPercentage = Math.round((formWindow.reduce((sum, count) => sum + count, 0) / 25) * 100);
    if (formPercentage >= 60) {
      const { data: inForm, error } = await supabase
        .from("user_badges")
        .select("id")
        .eq("wallet_address", walletAddress)
        .eq("badge_id", "in_form")
        .limit(1);
      if (error) throw error;
      if (!inForm || inForm.length === 0) candidates.push("in_form");
    }
  }

  return [...new Set(candidates)];
}
