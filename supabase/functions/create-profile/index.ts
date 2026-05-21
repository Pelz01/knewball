import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyMessage, type Hex } from "npm:viem@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { isAddress } from "../_shared/xlayer.ts";

type CreateProfileRequest = {
  walletAddress?: string;
  displayName?: string;
  country?: string;
  nonce?: string;
  timestamp?: string;
  message?: string;
  signature?: string;
};

const PROFILE_WINDOW_MS = 10 * 60 * 1000;
const DISPLAY_NAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const COUNTRY_PATTERN = /^[A-Z0-9]{2,5}$/;
const NONCE_PATTERN = /^[a-f0-9-]{16,80}$/i;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "POST required." }, 405);

  try {
    const payload = await request.json() as CreateProfileRequest;
    if (!isAddress(payload.walletAddress)) return jsonResponse({ error: "Invalid walletAddress." }, 400);
    if (!isSignature(payload.signature)) return jsonResponse({ error: "Invalid profile signature." }, 400);

    const walletAddress = payload.walletAddress.toLowerCase();
    const displayName = cleanDisplayName(payload.displayName);
    const country = cleanCountry(payload.country);
    const timestamp = cleanTimestamp(payload.timestamp);
    const nonce = cleanNonce(payload.nonce);
    const expectedMessage = profileMessage({
      walletAddress,
      displayName,
      country,
      nonce,
      timestamp,
    });
    if (payload.message !== expectedMessage) {
      return jsonResponse({ error: "Profile signature message mismatch." }, 400);
    }

    const verified = await verifyMessage({
      address: walletAddress,
      message: expectedMessage,
      signature: payload.signature,
    });
    if (!verified) return jsonResponse({ error: "Wallet signature verification failed." }, 403);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) throw new Error("Missing Supabase service secrets.");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    const { error: nonceError } = await supabase.from("profile_signature_nonces").insert({
      nonce,
      wallet_address: walletAddress,
      action: "create_profile",
    });
    if (nonceError) {
      if (nonceError.code === "23505") return jsonResponse({ error: "Profile signature was already used." }, 409);
      throw nonceError;
    }

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("wallet_address", walletAddress)
      .maybeSingle();
    if (existingError) throw existingError;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        wallet_address: walletAddress,
        display_name: displayName,
        display_name_normalized: displayName.toLowerCase(),
        country,
      }, { onConflict: "wallet_address" })
      .select("wallet_address,display_name,country,ball_iq_cached,created_at,updated_at")
      .single();
    if (profileError) {
      if (profileError.code === "23505") return jsonResponse({ error: "Display name is already taken." }, 409);
      if (profileError.code === "23514") return jsonResponse({ error: "Display name is reserved or invalid." }, 400);
      throw profileError;
    }

    return jsonResponse({
      status: existing ? "updated" : "created",
      profile,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Profile creation failed." }, 500);
  }
});

function cleanDisplayName(value: string | undefined) {
  const displayName = value?.trim();
  if (!displayName || !DISPLAY_NAME_PATTERN.test(displayName)) {
    throw new Error("Display name must be 3 to 20 letters, numbers, or underscores.");
  }
  return displayName;
}

function isSignature(value: string | undefined): value is Hex {
  return Boolean(value && /^0x[a-fA-F0-9]{130}$/.test(value));
}

function cleanCountry(value: string | undefined) {
  const country = value?.trim().toUpperCase();
  if (!country || !COUNTRY_PATTERN.test(country)) throw new Error("Invalid country.");
  return country;
}

function cleanTimestamp(value: string | undefined) {
  if (!value) throw new Error("Missing profile timestamp.");
  const signedAt = Date.parse(value);
  if (!Number.isFinite(signedAt)) throw new Error("Invalid profile timestamp.");
  const drift = Math.abs(Date.now() - signedAt);
  if (drift > PROFILE_WINDOW_MS) throw new Error("Profile signature expired.");
  return new Date(signedAt).toISOString();
}

function cleanNonce(value: string | undefined) {
  const nonce = value?.trim();
  if (!nonce || !NONCE_PATTERN.test(nonce)) throw new Error("Invalid profile nonce.");
  return nonce;
}

function profileMessage(args: {
  walletAddress: string;
  displayName: string;
  country: string;
  nonce: string;
  timestamp: string;
}) {
  return [
    "Create KnewBall Fan Profile",
    "",
    `Wallet: ${args.walletAddress}`,
    `Display Name: ${args.displayName}`,
    `Country: ${args.country}`,
    `Nonce: ${args.nonce}`,
    `Timestamp: ${args.timestamp}`,
    "",
    "This signature proves ownership of this wallet for KnewBall profile creation.",
  ].join("\n");
}
