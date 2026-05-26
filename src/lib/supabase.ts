import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type KnewBallDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          wallet_address: string;
          display_name: string;
          display_name_normalized: string;
          country: string;
          ball_iq_cached: number;
          created_at: string;
          updated_at: string;
        };
      };
      matches: {
        Row: {
          id: number;
          contract_match_id: number;
          home_team: string;
          away_team: string;
          home_code: string;
          away_code: string;
          home_flag: string | null;
          away_flag: string | null;
          stage: string | null;
          kickoff_time: string;
          status: "open" | "locked" | "live" | "resolved";
          underdog_team: string | null;
          is_upset_result: boolean;
          chaos_outcome: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          wallet_address: string;
          match_id: number;
          contract_match_id: number;
          winner_pick: "home" | "draw" | "away";
          home_score_pick: number;
          away_score_pick: number;
          total_goals_pick: "under" | "over";
          both_teams_scored_pick: "no" | "yes";
          first_goal_pick: "home" | "away" | "none";
          lock_tx_hash: string;
          locked_at: string | null;
          contract_address: string;
          network: "testnet" | "mainnet";
          claimed: boolean;
          claim_tx_hash: string | null;
          claimed_at: string | null;
          points_earned: number;
          correct_count: number;
          tier: "none" | "partial" | "strong_call" | "sharp_call" | "perfect_slate";
          created_at: string;
          updated_at: string;
        };
      };
      match_results: {
        Row: {
          match_id: number;
          contract_match_id: number;
          home_score: number;
          away_score: number;
          winner: "home" | "draw" | "away";
          first_goal: "home" | "away" | "none";
          both_teams_scored: "no" | "yes";
          total_goals: "under" | "over";
          source: "admin" | "sports_api" | "chainlink_later";
          external_match_id: string | null;
          resolved_tx_hash: string | null;
          resolved_at: string;
          created_at: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          wallet_address: string;
          badge_id: string;
          match_id: number | null;
          prediction_id: string | null;
          awarded_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_profile_ball_iq: {
        Args: { target_wallet: string; points_delta: number };
        Returns: KnewBallDatabase["public"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let supabaseClient: SupabaseClient<KnewBallDatabase> | null = null;

export type SupabasePredictionRow = KnewBallDatabase["public"]["Tables"]["predictions"]["Row"];
export type SupabaseMatchResultRow = KnewBallDatabase["public"]["Tables"]["match_results"]["Row"];
export type SupabaseUserBadgeRow = KnewBallDatabase["public"]["Tables"]["user_badges"]["Row"];

export type SupabasePredictionMemory = {
  prediction: SupabasePredictionRow;
  result: SupabaseMatchResultRow | null;
  badges: SupabaseUserBadgeRow[];
};

export type SupabaseLeaderboardFan = {
  wallet: string;
  displayName: string;
  country: string;
  ballIq: number;
  claimedCalls: number;
  formPercentage: number | null;
  formLabel: string;
};

export function hasSupabaseConfig() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabaseClient() {
  if (!hasSupabaseConfig()) return null;

  if (!supabaseClient) {
    supabaseClient = createClient<KnewBallDatabase>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    );
  }

  return supabaseClient;
}

export async function invokeKnewBallFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
) {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.functions.invoke<T>(functionName, { body });
  if (error) throw await functionError(error);
  return data;
}

export async function fetchProfileByWallet(walletAddress: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  const result = await client
    .from("profiles")
    .select("wallet_address,display_name,country,created_at")
    .eq("wallet_address", walletAddress.toLowerCase())
    .maybeSingle();
  const error = result.error;
  const data = result.data as KnewBallDatabase["public"]["Tables"]["profiles"]["Row"] | null;
  if (error) throw error;
  if (!data) return null;

  return {
    wallet: walletAddress,
    displayName: data.display_name,
    country: data.country,
    createdAt: Date.parse(data.created_at),
  };
}

export async function fetchWalletPredictionMemory(walletAddress: string) {
  const client = getSupabaseClient();
  if (!client) return [];

  const wallet = walletAddress.toLowerCase();
  let query = client
    .from("predictions")
    .select("*")
    .eq("wallet_address", wallet)
    .eq("network", activeSupabaseNetwork());
  const contractAddress = activeSupabaseContractAddress();
  if (contractAddress) query = query.eq("contract_address", contractAddress);

  const { data: predictionsData, error: predictionsError } = await query.order("locked_at", { ascending: false });
  if (predictionsError) throw predictionsError;

  const predictions = (predictionsData ?? []) as SupabasePredictionRow[];
  return fetchPredictionMemoryForRows(predictions);
}

export async function fetchPredictionMemoryById(predictionId: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  let query = client
    .from("predictions")
    .select("*")
    .eq("id", predictionId)
    .eq("network", activeSupabaseNetwork());
  const contractAddress = activeSupabaseContractAddress();
  if (contractAddress) query = query.eq("contract_address", contractAddress);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [memory] = await fetchPredictionMemoryForRows([data as SupabasePredictionRow]);
  return memory ?? null;
}

export async function fetchLeaderboardFans(): Promise<SupabaseLeaderboardFan[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const network = activeSupabaseNetwork();
  const contractAddress = activeSupabaseContractAddress();
  let predictionsQuery = client
    .from("predictions")
    .select("wallet_address,claimed,correct_count,points_earned,claimed_at,created_at")
    .eq("claimed", true)
    .eq("network", network);
  if (contractAddress) predictionsQuery = predictionsQuery.eq("contract_address", contractAddress);

  const [
    { data: profilesData, error: profilesError },
    { data: predictionsData, error: predictionsError },
  ] = await Promise.all([
    client
      .from("profiles")
      .select("wallet_address,display_name,country,ball_iq_cached"),
    predictionsQuery,
  ]);
  if (profilesError) throw profilesError;
  if (predictionsError) throw predictionsError;

  type ProfileRow = Pick<KnewBallDatabase["public"]["Tables"]["profiles"]["Row"], "wallet_address" | "display_name" | "country" | "ball_iq_cached">;
  type ClaimedPredictionRow = Pick<KnewBallDatabase["public"]["Tables"]["predictions"]["Row"], "wallet_address" | "claimed" | "correct_count" | "points_earned" | "claimed_at" | "created_at">;

  const claimedByWallet = new Map<string, ClaimedPredictionRow[]>();
  for (const prediction of (predictionsData ?? []) as ClaimedPredictionRow[]) {
    const wallet = prediction.wallet_address.toLowerCase();
    const rows = claimedByWallet.get(wallet) ?? [];
    rows.push(prediction);
    claimedByWallet.set(wallet, rows);
  }

  return ((profilesData ?? []) as ProfileRow[])
    .map((profile) => {
      const wallet = profile.wallet_address.toLowerCase();
      const claimed = (claimedByWallet.get(wallet) ?? [])
        .sort((a, b) => {
          const aTime = Date.parse(a.claimed_at ?? a.created_at);
          const bTime = Date.parse(b.claimed_at ?? b.created_at);
          return bTime - aTime;
        });
      const recent = claimed.slice(0, 5);
      const formPercentage = recent.length >= 5
        ? Math.round((recent.reduce((sum, prediction) => sum + prediction.correct_count, 0) / 25) * 100)
        : null;
      const networkBallIq = claimed.reduce((sum, prediction) => sum + prediction.points_earned, 0);

      return {
        wallet,
        displayName: profile.display_name,
        country: profile.country,
        ballIq: networkBallIq,
        claimedCalls: claimed.length,
        formPercentage,
        formLabel: formPercentage === null ? `Building Form: ${recent.length}/5` : formLabelForPercentage(formPercentage),
      };
    })
    .filter((fan) => fan.ballIq > 0 || fan.claimedCalls > 0)
    .sort((a, b) => b.ballIq - a.ballIq);
}

function activeSupabaseNetwork(): "testnet" | "mainnet" {
  return String(import.meta.env.VITE_XLAYER_NETWORK ?? "testnet").trim().toLowerCase() === "mainnet"
    ? "mainnet"
    : "testnet";
}

function activeSupabaseContractAddress() {
  const address = String(import.meta.env.VITE_KNEWBALL_CONTRACT_ADDRESS ?? "").trim();
  return typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address) ? address.toLowerCase() : null;
}

async function fetchPredictionMemoryForRows(predictions: SupabasePredictionRow[]) {
  const client = getSupabaseClient();
  if (!client || predictions.length === 0) return [];

  const matchIds = [...new Set(predictions.map((prediction) => prediction.match_id))];
  const predictionIds = predictions.map((prediction) => prediction.id);
  const walletAddresses = [...new Set(predictions.map((prediction) => prediction.wallet_address))];

  const [
    { data: resultsData, error: resultsError },
    { data: predictionBadgesData, error: predictionBadgesError },
    { data: matchBadgesData, error: matchBadgesError },
  ] = await Promise.all([
    client
      .from("match_results")
      .select("*")
      .in("match_id", matchIds),
    client
      .from("user_badges")
      .select("*")
      .in("prediction_id", predictionIds),
    client
      .from("user_badges")
      .select("*")
      .in("wallet_address", walletAddresses)
      .in("match_id", matchIds),
  ]);
  if (resultsError) throw resultsError;
  if (predictionBadgesError) throw predictionBadgesError;
  if (matchBadgesError) throw matchBadgesError;

  const results = (resultsData ?? []) as SupabaseMatchResultRow[];
  const badges = [...(predictionBadgesData ?? []), ...(matchBadgesData ?? [])] as SupabaseUserBadgeRow[];
  const resultsByMatch = new Map(results.map((result) => [result.match_id, result]));

  return predictions.map((prediction) => ({
    prediction,
    result: resultsByMatch.get(prediction.match_id) ?? null,
    badges: badges.filter((badge) => (
      badge.prediction_id === prediction.id ||
      (badge.prediction_id === null && badge.match_id === prediction.match_id && badge.wallet_address === prediction.wallet_address)
    )),
  })) satisfies SupabasePredictionMemory[];
}

function formLabelForPercentage(percentage: number) {
  if (percentage >= 80) return "World Class";
  if (percentage >= 60) return "In Form";
  if (percentage >= 40) return "Mid Table";
  if (percentage >= 20) return "Relegation Zone";
  return "Fraud Watch";
}

async function functionError(error: unknown) {
  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const payload = await context.clone().json() as { error?: unknown; message?: unknown };
      const message = payload.error ?? payload.message;
      if (typeof message === "string" && message.trim()) return new Error(message);
    } catch {
      // Fall through to the SDK message when the function returned no JSON body.
    }
  }

  return error instanceof Error ? error : new Error("Edge Function request failed.");
}
