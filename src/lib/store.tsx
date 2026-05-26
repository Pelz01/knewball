import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BADGES, MATCHES, type Match } from "./match-data";
import {
  connectXLayerWallet,
  getResolvedMatchFromContract,
  getLockedPrediction,
  getInjectedProvider,
  sendClaimBallIQTransaction,
  sendResolveMatchTransaction,
  sendPredictionProofTransaction,
  signWalletMessage,
  waitForTransactionReceipt,
} from "./xlayer";
import {
  fetchPredictionMemoryById,
  fetchProfileByWallet,
  fetchWalletPredictionMemory,
  hasSupabaseConfig,
  invokeKnewBallFunction,
  type SupabasePredictionMemory,
} from "./supabase";

/* =========================================================================
 * KnewBall mock onchain store
 * All state is held in React + persisted to localStorage. No real wallet,
 * no real transactions — just a believable demo of the full loop.
 * ========================================================================= */

export type Winner = "home" | "draw" | "away";

export interface DraftPrediction {
  matchId: string;
  winner: Winner;
  homeScore: number;
  awayScore: number;
  overUnder: "over" | "under";
  btts: "yes" | "no";
  firstGoal: "home" | "away" | "none";
  createdAt: number;
}

export interface Prediction extends DraftPrediction {
  id: string;
  wallet: string;
  txHash: string;
  lockedAt: number;
  claimed: boolean;
  pointsEarned?: number;
  correctCount?: number;
  badge?: string;
  badges?: string[];
  claimTxHash?: string;
  breakdown?: { label: string; points: number; ok: boolean }[];
}

export interface MatchResult {
  matchId: string;
  homeScore: number;
  awayScore: number;
  winner: Winner;
  firstGoal: "home" | "away" | "none";
  btts: "yes" | "no";
  overUnder: "over" | "under";
  underdogTeam?: string;
  isUpsetResult?: boolean;
  chaosOutcome?: string;
  resolvedAt: number;
}

export interface FanProfile {
  wallet: string;
  displayName: string;
  country: string; // team code
  createdAt: number;
}

interface State {
  wallet: string | null;
  chainId: number | null;
  profile: FanProfile | null;
  profileHydrating: boolean;
  drafts: Record<string, DraftPrediction>;
  predictions: Prediction[];
  results: Record<string, MatchResult>;
}

const STORAGE_NETWORK = String(import.meta.env.VITE_XLAYER_NETWORK ?? "testnet")
  .trim()
  .toLowerCase();
const STORAGE_CONTRACT = String(import.meta.env.VITE_KNEWBALL_CONTRACT_ADDRESS ?? "local")
  .trim()
  .toLowerCase();

const KEY = [
  "knewball.v3",
  STORAGE_NETWORK || "testnet",
  STORAGE_CONTRACT || "local",
].join(".");

function load(): State {
  if (typeof window === "undefined") return { wallet: null, chainId: null, profile: null, profileHydrating: false, drafts: {}, predictions: [], results: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = { ...seed(), ...JSON.parse(raw) } as State;
    return {
      ...parsed,
      profileHydrating: Boolean(parsed.wallet && !parsed.profile && hasSupabaseConfig()),
    };
  } catch {
    return seed();
  }
}

function seed(): State {
  return {
    wallet: null,
    chainId: null,
    profile: null,
    profileHydrating: false,
    drafts: {},
    predictions: [],
    results: {},
  };
}

function save(s: State) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
}

/* ============ scoring ============ */

const POINTS = {
  winner: 50,
  score: 200,
  overUnder: 40,
  btts: 40,
  firstGoal: 60,
  strongCall: 50,
  sharpCall: 100,
  perfectSlate: 200,
};

export function scorePrediction(p: DraftPrediction, r: MatchResult) {
  const okWinner = p.winner === r.winner;
  const okScore = p.homeScore === r.homeScore && p.awayScore === r.awayScore;
  const okOU = p.overUnder === r.overUnder;
  const okBTTS = p.btts === r.btts;
  const okFG = p.firstGoal === r.firstGoal;
  const breakdown = [
    { label: "Winner", points: okWinner ? POINTS.winner : 0, ok: okWinner },
    { label: "Score", points: okScore ? POINTS.score : 0, ok: okScore },
    { label: "Over / under 2.5", points: okOU ? POINTS.overUnder : 0, ok: okOU },
    { label: "Both teams to score", points: okBTTS ? POINTS.btts : 0, ok: okBTTS },
    { label: "First team to score", points: okFG ? POINTS.firstGoal : 0, ok: okFG },
  ];
  const correctCount = [okWinner, okScore, okOU, okBTTS, okFG].filter(Boolean).length;
  const tier =
    correctCount === 5 ? "perfect-slate" :
    correctCount === 4 ? "sharp-call" :
    correctCount === 3 ? "strong-call" :
    null;
  const tierBonus =
    tier === "perfect-slate" ? POINTS.perfectSlate :
    tier === "sharp-call" ? POINTS.sharpCall :
    tier === "strong-call" ? POINTS.strongCall :
    0;
  if (tier) {
    breakdown.push({
      label:
        tier === "perfect-slate" ? "Perfect Slate bonus" :
        tier === "sharp-call" ? "Sharp Call bonus" :
        "Strong Call bonus",
      points: tierBonus,
      ok: true,
    });
  }
  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { total, breakdown, correctCount, tier };
}

/* ============ context ============ */

interface Api extends State {
  // wallet/profile
  connectWallet: () => Promise<string>;
  disconnect: () => void;
  createProfile: (p: Omit<FanProfile, "wallet" | "createdAt">) => Promise<void>;
  // drafts
  saveDraft: (d: DraftPrediction) => void;
  clearDraft: (matchId: string) => void;
  getDraft: (matchId: string) => DraftPrediction | undefined;
  // predictions
  lockPrediction: (matchId: string) => Promise<Prediction | undefined>;
  recoverPrediction: (matchId: string) => Promise<Prediction | undefined>;
  hydratePredictionById: (predictionId: string) => Promise<Prediction | undefined>;
  getPrediction: (matchId: string, wallet?: string) => Prediction | undefined;
  getPredictionById: (id: string) => Prediction | undefined;
  claimPrediction: (id: string) => Promise<Prediction | undefined>;
  // admin
  resolveMatch: (r: MatchResult) => void;
  resolveMatchOnchain: (r: Omit<MatchResult, "resolvedAt">) => Promise<MatchResult>;
  getResult: (matchId: string) => MatchResult | undefined;
  // derived
  totalBallIq: number;
  unclaimed: Prediction[];
  currentForm: CurrentForm;
}

export type FormLabel =
  | "Building Form"
  | "World Class"
  | "In Form"
  | "Mid Table"
  | "Relegation Zone"
  | "Fraud Watch";

export interface CurrentForm {
  label: FormLabel;
  percentage: number | null;
  calls: number[];
  totalCorrect: number;
  maxCorrect: number;
}

export function calculateCurrentForm(
  predictions: Prediction[],
  results: Record<string, MatchResult>
) {
  const recent = predictions
    .map(p => ({ pred: p, res: results[p.matchId] }))
    .filter((x): x is { pred: Prediction; res: MatchResult } => x.pred.claimed && x.res !== undefined)
    .sort((a, b) => (b.res.resolvedAt ?? b.pred.lockedAt) - (a.res.resolvedAt ?? a.pred.lockedAt))
    .slice(0, 5)
    .map(({ pred, res }) => scorePrediction(pred, res).correctCount);

  const totalCorrect = recent.reduce((sum, correct) => sum + correct, 0);
  const maxCorrect = recent.length * 5;
  if (recent.length < 5) {
    return {
      label: "Building Form",
      percentage: null,
      calls: recent,
      totalCorrect,
      maxCorrect,
    } satisfies CurrentForm;
  }

  const percentage = Math.round((totalCorrect / 25) * 100);
  const label: FormLabel =
    percentage >= 80 ? "World Class" :
    percentage >= 60 ? "In Form" :
    percentage >= 40 ? "Mid Table" :
    percentage >= 20 ? "Relegation Zone" :
    "Fraud Watch";

  return { label, percentage, calls: recent, totalCorrect, maxCorrect } satisfies CurrentForm;
}

export function calculateBadgesForPrediction(
  p: Prediction,
  r: MatchResult,
  m: Match,
  allPredictions: Prediction[],
  allResults: Record<string, MatchResult>,
  pointsEarned: number
): string[] {
  const unlocked: string[] = [];

  const okWinner = p.winner === r.winner;
  const okScore = p.homeScore === r.homeScore && p.awayScore === r.awayScore;
  const okOU = p.overUnder === r.overUnder;
  const okBTTS = p.btts === r.btts;
  const okFG = p.firstGoal === r.firstGoal;
  const correctCount = [okWinner, okScore, okOU, okBTTS, okFG].filter(Boolean).length;

  // Resolved user predictions in chronological resolution order
  const myResolved = allPredictions
    .filter(x => sameWallet(x.wallet, p.wallet))
    .map(x => ({ pred: x, res: allResults[x.matchId] }))
    .filter(x => x.res !== undefined)
    .sort((a, b) => (a.res.resolvedAt ?? 0) - (b.res.resolvedAt ?? 0));

  // 1. First Call: locks first prediction
  const myAllPreds = allPredictions
    .filter(x => sameWallet(x.wallet, p.wallet))
    .sort((a, b) => a.lockedAt - b.lockedAt);
  if (myAllPreds.length > 0 && myAllPreds[0].id === p.id) {
    unlocked.push("First Call");
  }

  // 2. Knew Ball: gets first correct prediction (winner correct)
  const firstCorrectWinner = myResolved.find(x => x.pred.winner === x.res.winner);
  if (okWinner && firstCorrectWinner && firstCorrectWinner.pred.id === p.id) {
    unlocked.push("Knew Ball");
  }

  // 3. Tier badges: only award the highest match read tier.
  if (correctCount === 5) {
    unlocked.push("Perfect Slate");
  } else if (correctCount === 4) {
    unlocked.push("Sharp Call");
  } else if (correctCount === 3) {
    unlocked.push("Strong Call");
  }

  // 4. Score Prophet: user predicts exact score
  if (okScore) {
    unlocked.push("Score Prophet");
  }

  // 5. First Blood: user predicts first team to score (and it's not 'none')
  if (okFG && r.firstGoal !== "none") {
    unlocked.push("First Blood");
  }

  // 6. Upset Hunter: correctly predicts underdog win
  const underdogTeam = r.underdogTeam ?? m.underdogTeam;
  if (underdogTeam && okWinner) {
    const underdog = underdogTeam;
    const underdogWinnerSide = underdog === m.home.code ? "home" : (underdog === m.away.code ? "away" : null);
    if (underdogWinnerSide && r.winner === underdogWinnerSide && p.winner === underdogWinnerSide) {
      unlocked.push("Upset Hunter");
    }
  }

  // 7. Chaos Merchant: predicts outcome correctly on match marked isUpsetResult or chaosOutcome by admin
  if ((r.isUpsetResult || r.chaosOutcome || m.isUpsetResult || m.chaosOutcome) && okWinner) {
    unlocked.push("Chaos Merchant");
  }

  // 8. Country Captain: User enters top 10 for their country.
  // Calculated based on if total IQ (after this match) is >= 500
  const currentTotal = allPredictions
    .filter(x => sameWallet(x.wallet, p.wallet) && x.claimed)
    .reduce((sum, x) => sum + (x.pointsEarned ?? 0), 0) + pointsEarned;
  if (currentTotal >= 500) {
    const alreadyHad = allPredictions.some(x => sameWallet(x.wallet, p.wallet) && x.claimed && x.badges?.includes("Country Captain"));
    if (!alreadyHad) {
      unlocked.push("Country Captain");
    }
  }

  // Special Demo Case Override for Brazil vs Japan:
  if (m.home.code === "BRA" && m.away.code === "JPN" && correctCount === 5) {
    return ["First Call", "Knew Ball", "First Blood", "Score Prophet", "Perfect Slate"];
  }

  return unlocked;
}

const Ctx = createContext<Api | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => load());
  const profileHydrationRef = useRef<Set<string>>(new Set());
  const historyHydrationRef = useRef<Set<string>>(new Set());
  useEffect(() => { save(state); }, [state]);

  const hydrateProfile = useCallback(async (walletAddress: string) => {
    const key = walletAddress.toLowerCase();
    if (!hasSupabaseConfig() || profileHydrationRef.current.has(key)) return null;
    profileHydrationRef.current.add(key);

    setState((s) => (
      s.wallet?.toLowerCase() === key ? { ...s, profileHydrating: true } : s
    ));

    try {
      const existingProfile = await fetchProfileByWallet(walletAddress);
      setState((s) => (
        s.wallet?.toLowerCase() === key
          ? { ...s, profile: existingProfile ?? s.profile, profileHydrating: false }
          : s
      ));
      return existingProfile;
    } catch (error) {
      setState((s) => (
        s.wallet?.toLowerCase() === key ? { ...s, profileHydrating: false } : s
      ));
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!state.wallet || !hasSupabaseConfig()) return;
    void hydrateProfile(state.wallet).catch((error) => {
      console.warn("Could not hydrate KnewBall profile.", error);
    });
  }, [hydrateProfile, state.wallet]);

  const hydratePredictionHistory = useCallback(async (walletAddress: string) => {
    const key = walletAddress.toLowerCase();
    if (!hasSupabaseConfig() || historyHydrationRef.current.has(key)) return [];
    historyHydrationRef.current.add(key);

    const memory = await fetchWalletPredictionMemory(walletAddress);
    setState((s) => mergePredictionMemory(s, memory));
    return memory;
  }, []);

  useEffect(() => {
    if (!state.wallet || !state.profile) return;
    void hydratePredictionHistory(state.wallet).catch((error) => {
      console.warn("Could not hydrate KnewBall prediction history.", error);
    });
  }, [hydratePredictionHistory, state.profile, state.wallet]);

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider?.on || !provider.removeListener) return;
    const onAccountsChanged = (accounts: unknown) => {
      const next = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      setState((s) => ({
        ...s,
        wallet: next,
        profileHydrating: false,
        profile: next?.toLowerCase() === s.profile?.wallet.toLowerCase() ? s.profile : null,
      }));
      if (next) {
        profileHydrationRef.current.delete(next.toLowerCase());
        historyHydrationRef.current.delete(next.toLowerCase());
        void hydrateProfile(next).catch((error) => {
          console.warn("Could not hydrate KnewBall profile after account switch.", error);
        });
      }
    };
    const onChainChanged = (chainId: unknown) => {
      if (typeof chainId === "string") setState((s) => ({ ...s, chainId: Number.parseInt(chainId, 16) }));
    };
    provider.on("accountsChanged", onAccountsChanged);
    provider.on("chainChanged", onChainChanged);
    return () => {
      provider.removeListener?.("accountsChanged", onAccountsChanged);
      provider.removeListener?.("chainChanged", onChainChanged);
    };
  }, [hydrateProfile]);

  const connectWallet = useCallback(async () => {
    let wallet = state.wallet;
    if (!wallet) {
      const connected = await connectXLayerWallet();
      wallet = connected.wallet;
      setState((s) => ({ ...s, wallet: wallet!, chainId: connected.chainId }));
      profileHydrationRef.current.delete(wallet.toLowerCase());
      historyHydrationRef.current.delete(wallet.toLowerCase());
      await hydrateProfile(wallet).catch((error) => {
        console.warn("Could not hydrate KnewBall profile after wallet connect.", error);
      });
    }
    return wallet;
  }, [hydrateProfile, state.wallet]);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, wallet: null, chainId: null, profile: null, profileHydrating: false }));
  }, []);

  const createProfile = useCallback(async (p: Omit<FanProfile, "wallet" | "createdAt">) => {
    const wallet = state.wallet;
    if (!wallet) return;

    if (hasSupabaseConfig()) {
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      const message = createProfileSignatureMessage({
        wallet,
        displayName: p.displayName,
        country: p.country,
        nonce,
        timestamp,
      });
      const signature = await signWalletMessage(message);
      const created = await invokeKnewBallFunction<{
        profile?: {
          wallet_address: string;
          display_name: string;
          country: string;
          created_at: string;
        };
      }>("create-profile", {
        walletAddress: wallet,
        displayName: p.displayName,
        country: p.country,
        nonce,
        timestamp,
        message,
        signature,
      });
      if (created?.profile) {
        setState((s) => ({
          ...s,
          profile: {
            wallet,
            displayName: created.profile!.display_name,
            country: created.profile!.country,
            createdAt: Date.parse(created.profile!.created_at),
          },
          profileHydrating: false,
        }));
        historyHydrationRef.current.delete(wallet.toLowerCase());
        void hydratePredictionHistory(wallet).catch((error) => {
          console.warn("Could not hydrate KnewBall prediction history after profile creation.", error);
        });
        return;
      }
    }

    setState((s) => ({
      ...s,
      profile: { ...p, wallet, createdAt: Date.now() },
      profileHydrating: false,
    }));
    historyHydrationRef.current.delete(wallet.toLowerCase());
    void hydratePredictionHistory(wallet).catch((error) => {
      console.warn("Could not hydrate KnewBall prediction history after profile creation.", error);
    });
  }, [hydratePredictionHistory, state.wallet]);

  const saveDraft = useCallback((d: DraftPrediction) => {
    setState((s) => ({ ...s, drafts: { ...s.drafts, [d.matchId]: d } }));
  }, []);

  const clearDraft = useCallback((matchId: string) => {
    setState((s) => {
      const { [matchId]: _, ...rest } = s.drafts;
      void _;
      return { ...s, drafts: rest };
    });
  }, []);

  const lockPrediction = useCallback(async (matchId: string): Promise<Prediction | undefined> => {
    const current = state.drafts[matchId];
    const wallet = state.wallet;
    if (!current || !wallet) return undefined;
    const txHash = await sendPredictionProofTransaction({ from: wallet, profile: state.profile, draft: current });
    await waitForTransactionReceipt(txHash);
    const synced = await invokeKnewBallFunction<PredictionSyncResponse>("sync-prediction", {
      walletAddress: wallet,
      matchId,
      txHash,
    });
    let out: Prediction | undefined;
    setState((s) => {
      const d = s.drafts[matchId];
      if (!d || !s.wallet) return s;
      const pred: Prediction = {
        ...d,
        id: synced?.prediction.id ?? `pred_${matchId}_${s.wallet.slice(2, 8)}_${Date.now().toString(36)}`,
        wallet: s.wallet,
        txHash,
        lockedAt: synced?.prediction.lockedAt ? Date.parse(synced.prediction.lockedAt) : Date.now(),
        claimed: false,
      };
      out = pred;
      const { [matchId]: _, ...rest } = s.drafts;
      void _;
      return { ...s, drafts: rest, predictions: [...s.predictions, pred] };
    });
    historyHydrationRef.current.delete(wallet.toLowerCase());
    void hydratePredictionHistory(wallet).catch((error) => {
      console.warn("Could not refresh KnewBall prediction history after lock.", error);
    });
    return out;
  }, [hydratePredictionHistory, state.drafts, state.profile, state.wallet]);

  const recoverPrediction = useCallback(async (matchId: string): Promise<Prediction | undefined> => {
    const wallet = state.wallet;
    const existing = state.predictions.find((prediction) => prediction.matchId === matchId && sameWallet(prediction.wallet, wallet));
    if (!wallet) return undefined;

    const locked = await getLockedPrediction(matchId, wallet);
    if (!locked) return undefined;

    const synced = locked.txHash
      ? await invokeKnewBallFunction<PredictionSyncResponse>("sync-prediction", {
          walletAddress: wallet,
          matchId,
          txHash: locked.txHash,
        }).catch((error) => {
          console.warn("Could not sync recovered KnewBall prediction.", error);
          return null;
        })
      : null;
    if (synced?.prediction.id) {
      const memory = await fetchPredictionMemoryById(synced.prediction.id).catch((error) => {
        console.warn("Could not hydrate recovered KnewBall prediction memory.", error);
        return null;
      });
      if (memory) {
        let out: Prediction | undefined;
        setState((s) => {
          const next = mergePredictionMemory(s, [memory]);
          out = next.predictions.find((prediction) => prediction.id === synced.prediction.id);
          return next;
        });
        if (out) return out;
      }
    }

    const recovered: Prediction = {
      ...existing,
      id: synced?.prediction.id ?? existing?.id ?? `chain_${matchId}_${wallet.slice(2, 8)}_${Math.floor(locked.lockedAt / 1000).toString(36)}`,
      matchId,
      wallet,
      txHash: locked.txHash,
      winner: locked.winner,
      homeScore: locked.homeScore,
      awayScore: locked.awayScore,
      overUnder: locked.overUnder,
      btts: locked.btts,
      firstGoal: locked.firstGoal,
      createdAt: locked.lockedAt,
      lockedAt: locked.lockedAt,
      claimed: locked.claimed,
    };

    setState((s) => ({
      ...s,
      predictions: s.predictions.some((prediction) => prediction.matchId === matchId && sameWallet(prediction.wallet, wallet))
        ? s.predictions.map((prediction) => (
          prediction.matchId === matchId && sameWallet(prediction.wallet, wallet) ? recovered : prediction
        ))
        : [...s.predictions, recovered],
    }));
    return recovered;
  }, [state.predictions, state.wallet]);

  const getPrediction = useCallback((matchId: string, w?: string) => {
    const wallet = w ?? state.wallet;
    if (!wallet) return undefined;
    return state.predictions.find((p) => p.matchId === matchId && sameWallet(p.wallet, wallet));
  }, [state.predictions, state.wallet]);

  const getPredictionById = useCallback(
    (id: string) => state.predictions.find((p) => p.id === id),
    [state.predictions],
  );

  const hydratePredictionById = useCallback(async (predictionId: string): Promise<Prediction | undefined> => {
    if (!hasSupabaseConfig()) return undefined;
    const memory = await fetchPredictionMemoryById(predictionId);
    if (!memory) return undefined;

    let out: Prediction | undefined;
    setState((s) => {
      const next = mergePredictionMemory(s, [memory]);
      out = next.predictions.find((prediction) => prediction.id === predictionId);
      return next;
    });
    return out;
  }, []);

  const resolveMatch = useCallback((r: MatchResult) => {
    setState((s) => ({ ...s, results: { ...s.results, [r.matchId]: r } }));
  }, []);

  const resolveMatchOnchain = useCallback(async (r: Omit<MatchResult, "resolvedAt">) => {
    if (!state.wallet) throw new Error("Connect the owner wallet before resolving a match.");

    const txHash = await sendResolveMatchTransaction({
      from: state.wallet,
      matchId: r.matchId,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      firstGoal: r.firstGoal,
    }).catch(async (error) => {
      const recovered = await getResolvedMatchFromContract(r.matchId);
      if (recovered?.txHash) return recovered.txHash;
      throw error;
    });
    await waitForTransactionReceipt(txHash).catch(async (error) => {
      const recovered = await getResolvedMatchFromContract(r.matchId);
      if (!recovered?.txHash) throw error;
    });

    let resolved: MatchResult = {
      ...r,
      resolvedAt: Date.now(),
    };

    if (hasSupabaseConfig()) {
      const synced = await invokeKnewBallFunction<{
        result: {
          homeScore: number;
          awayScore: number;
          winner: Winner;
          firstGoal: MatchResult["firstGoal"];
          btts: MatchResult["btts"];
          overUnder: MatchResult["overUnder"];
        };
        resolvedAt: string;
      }>("sync-result", {
        walletAddress: state.wallet,
        matchId: r.matchId,
        txHash,
        isUpsetResult: Boolean(r.isUpsetResult),
        chaosOutcome: r.chaosOutcome ?? null,
      });

      if (synced?.result) {
        resolved = {
          matchId: r.matchId,
          homeScore: synced.result.homeScore,
          awayScore: synced.result.awayScore,
          winner: synced.result.winner,
          firstGoal: synced.result.firstGoal,
          btts: synced.result.btts,
          overUnder: synced.result.overUnder,
          isUpsetResult: r.isUpsetResult,
          chaosOutcome: r.chaosOutcome,
          resolvedAt: Date.parse(synced.resolvedAt),
        };
      }
    }

    setState((s) => ({ ...s, results: { ...s.results, [resolved.matchId]: resolved } }));
    return resolved;
  }, [state.wallet]);

  const getResult = useCallback((id: string) => state.results[id], [state.results]);

  const claimPrediction = useCallback(async (id: string): Promise<Prediction | undefined> => {
    const prediction = state.predictions.find((p) => p.id === id);
    const wallet = state.wallet;
    if (!prediction || !wallet) return undefined;
    if (prediction.claimed) return prediction;
    if (!state.results[prediction.matchId]) return undefined;

    const txHash = await sendClaimBallIQTransaction({
      from: wallet,
      matchId: prediction.matchId,
    });
    await waitForTransactionReceipt(txHash);

    const synced = await invokeKnewBallFunction<ClaimSyncResponse>("sync-claim", {
      walletAddress: wallet,
      matchId: prediction.matchId,
      txHash,
    });

    let out: Prediction | undefined;
    setState((s) => {
      const idx = s.predictions.findIndex((p) => p.id === id);
      if (idx < 0) return s;
      const p = s.predictions[idx];
      const r = s.results[p.matchId];
      if (!r) return s;

      const score = scorePrediction(p, r);
      const badges = synced?.badgesUnlocked?.map(badgeNameFromId) ?? p.badges ?? [];
      const updated: Prediction = {
        ...p,
        claimed: true,
        pointsEarned: synced?.pointsEarned ?? score.total,
        badge: badges[0] || undefined,
        badges,
        breakdown: score.breakdown,
        claimTxHash: txHash,
      };
      const next = [...s.predictions];
      next[idx] = updated;
      out = updated;
      return { ...s, predictions: next };
    });

    historyHydrationRef.current.delete(wallet.toLowerCase());
    void hydratePredictionHistory(wallet).catch((error) => {
      console.warn("Could not refresh KnewBall prediction history after claim.", error);
    });

    return out;
  }, [hydratePredictionHistory, state.predictions, state.results, state.wallet]);

  const value = useMemo<Api>(() => {
    const totalBallIq = state.predictions
      .filter((p) => p.claimed && p.wallet.toLowerCase() === state.wallet?.toLowerCase())
      .reduce((s, p) => s + (p.pointsEarned ?? 0), 0);
    const unclaimed = state.predictions.filter(
      (p) => p.wallet.toLowerCase() === state.wallet?.toLowerCase() && !p.claimed && !!state.results[p.matchId],
    );
    const myClaims = state.predictions.filter((p) => p.wallet.toLowerCase() === state.wallet?.toLowerCase() && p.claimed);
    const currentForm = calculateCurrentForm(myClaims, state.results);

    return {
      ...state,
      connectWallet, disconnect, createProfile,
      saveDraft, clearDraft,
      getDraft: (m) => state.drafts[m],
      lockPrediction, recoverPrediction, hydratePredictionById, getPrediction, getPredictionById, claimPrediction,
      resolveMatch, resolveMatchOnchain, getResult,
      totalBallIq, unclaimed,
      currentForm,
    };
  }, [state, connectWallet, disconnect, createProfile, saveDraft, clearDraft, lockPrediction, recoverPrediction, hydratePredictionById, getPrediction, getPredictionById, claimPrediction, resolveMatch, resolveMatchOnchain, getResult]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}

/* ============ helpers ============ */

export function matchById(id: string): Match | undefined {
  return MATCHES.find((m) => m.id === id);
}

export function shortAddress(w: string) {
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function sameWallet(a: string | null | undefined, b: string | null | undefined) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function describePrediction(p: DraftPrediction, m: Match) {
  const winner =
    p.winner === "draw" ? "Draw" :
    p.winner === "home" ? `${m.home.name} win` : `${m.away.name} win`;
  const first =
    p.firstGoal === "home" ? `${m.home.code} scores first` :
    p.firstGoal === "away" ? `${m.away.code} scores first` : "No goal";
  return [
    winner,
    `Score ${p.homeScore}-${p.awayScore}`,
    p.overUnder === "over" ? "Over 2.5 goals" : "Under 2.5 goals",
    p.btts === "yes" ? "Both teams score" : "Clean sheet",
    first,
  ];
}

function mergePredictionMemory(state: State, memory: SupabasePredictionMemory[]): State {
  if (memory.length === 0) return state;

  const nextResults = { ...state.results };
  const memoryPredictions = memory.map(({ prediction, result, badges }) => {
    const mappedResult = result ? mapSupabaseResult(result) : undefined;
    if (mappedResult) nextResults[mappedResult.matchId] = mappedResult;

    const mapped: Prediction = {
      id: prediction.id,
      matchId: String(prediction.match_id),
      wallet: prediction.wallet_address,
      txHash: prediction.lock_tx_hash,
      winner: prediction.winner_pick,
      homeScore: prediction.home_score_pick,
      awayScore: prediction.away_score_pick,
      overUnder: prediction.total_goals_pick,
      btts: prediction.both_teams_scored_pick,
      firstGoal: prediction.first_goal_pick,
      createdAt: Date.parse(prediction.created_at),
      lockedAt: Date.parse(prediction.locked_at ?? prediction.created_at),
      claimed: prediction.claimed,
      pointsEarned: prediction.claimed ? prediction.points_earned : undefined,
      correctCount: prediction.claimed ? prediction.correct_count : undefined,
      claimTxHash: prediction.claim_tx_hash ?? undefined,
      badges: [...new Set(badges.map((badge) => badgeNameFromId(badge.badge_id)))],
    };

    if (mapped.claimed && mappedResult) {
      const score = scorePrediction(mapped, mappedResult);
      mapped.breakdown = score.breakdown;
      if (!mapped.badges?.length && prediction.tier !== "none") {
        mapped.badges = [badgeNameFromId(prediction.tier)];
      }
    }

    mapped.badge = mapped.badges?.[0];
    return mapped;
  });

  const byId = new Map(state.predictions.map((prediction) => [prediction.id, prediction]));
  for (const prediction of memoryPredictions) {
    for (const [existingId, existingPrediction] of byId.entries()) {
      if (
        existingId !== prediction.id &&
        existingPrediction.matchId === prediction.matchId &&
        sameWallet(existingPrediction.wallet, prediction.wallet)
      ) {
        byId.delete(existingId);
      }
    }
    const existing = byId.get(prediction.id);
    byId.set(prediction.id, { ...existing, ...prediction });
  }

  return {
    ...state,
    predictions: Array.from(byId.values()).sort((a, b) => b.lockedAt - a.lockedAt),
    results: nextResults,
  };
}

function mapSupabaseResult(result: SupabasePredictionMemory["result"]): MatchResult {
  if (!result) throw new Error("Missing result.");

  return {
    matchId: String(result.match_id),
    homeScore: result.home_score,
    awayScore: result.away_score,
    winner: result.winner,
    firstGoal: result.first_goal,
    btts: result.both_teams_scored,
    overUnder: result.total_goals,
    resolvedAt: Date.parse(result.resolved_at),
  };
}

function badgeNameFromId(id: string) {
  const normalized = id.replaceAll("_", "-");
  return BADGES.find((badge) => badge.id === normalized)?.name ??
    normalized.split("-").map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}

type PredictionSyncResponse = {
  status: "synced" | "already_synced";
  prediction: {
    id: string;
    lockedAt: string | null;
  };
};

type ClaimSyncResponse = {
  status: "synced" | "already_synced";
  pointsEarned: number;
  correctCount: number;
  tier: "none" | "partial" | "strong_call" | "sharp_call" | "perfect_slate";
  badgesUnlocked: string[];
  predictionId: string;
  proofUrl: string;
};

function createProfileSignatureMessage(args: {
  wallet: string;
  displayName: string;
  country: string;
  nonce: string;
  timestamp: string;
}) {
  return [
    "Create KnewBall Fan Profile",
    "",
    `Wallet: ${args.wallet.toLowerCase()}`,
    `Display Name: ${args.displayName.trim()}`,
    `Country: ${args.country.trim()}`,
    `Nonce: ${args.nonce}`,
    `Timestamp: ${args.timestamp}`,
    "",
    "This signature proves ownership of this wallet for KnewBall profile creation.",
  ].join("\n");
}
