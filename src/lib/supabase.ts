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
