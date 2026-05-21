import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MATCHES, type Match } from "./match-data";
import {
  connectXLayerWallet,
  getLockedPrediction,
  getInjectedProvider,
  sendPredictionProofTransaction,
  signWalletMessage,
  waitForTransactionReceipt,
} from "./xlayer";
import { hasSupabaseConfig, invokeKnewBallFunction } from "./supabase";

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
  drafts: Record<string, DraftPrediction>;
  predictions: Prediction[];
  results: Record<string, MatchResult>;
}

const KEY = "knewball.v2";

function load(): State {
  if (typeof window === "undefined") return { wallet: null, chainId: null, profile: null, drafts: {}, predictions: [], results: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    return { ...seed(), ...JSON.parse(raw) };
  } catch {
    return seed();
  }
}

function seed(): State {
  return {
    wallet: null,
    chainId: null,
    profile: null,
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
  getPrediction: (matchId: string, wallet?: string) => Prediction | undefined;
  getPredictionById: (id: string) => Prediction | undefined;
  claimPrediction: (id: string) => Prediction | undefined;
  // admin
  resolveMatch: (r: MatchResult) => void;
  getResult: (matchId: string) => MatchResult | undefined;
  // derived
  totalBallIq: number;
  unclaimed: Prediction[];
  currentStreak: number;
  bestStreak: number;
}

export function calculateStreakStats(
  predictions: Prediction[],
  results: Record<string, MatchResult>
) {
  const myResolved = predictions
    .map(p => ({ pred: p, res: results[p.matchId] }))
    .filter(x => x.res !== undefined)
    .sort((a, b) => (a.res.resolvedAt ?? 0) - (b.res.resolvedAt ?? 0));

  let current = 0;
  let best = 0;
  for (const { pred, res } of myResolved) {
    const isCorrect = pred.winner === res.winner;
    if (isCorrect) {
      current += 1;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return { current, best };
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
    .filter(x => x.wallet === p.wallet)
    .map(x => ({ pred: x, res: allResults[x.matchId] }))
    .filter(x => x.res !== undefined)
    .sort((a, b) => (a.res.resolvedAt ?? 0) - (b.res.resolvedAt ?? 0));

  // 1. First Call: locks first prediction
  const myAllPreds = allPredictions
    .filter(x => x.wallet === p.wallet)
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

  // 6. Hot Foot: 3 correct winner calls in a row (calculated by resolvedAt order)
  const thisIndex = myResolved.findIndex(x => x.pred.id === p.id);
  if (thisIndex >= 2) {
    const p1 = myResolved[thisIndex - 2];
    const p2 = myResolved[thisIndex - 1];
    const p3 = myResolved[thisIndex];
    if (
      p1.pred.winner === p1.res.winner &&
      p2.pred.winner === p2.res.winner &&
      p3.pred.winner === p3.res.winner
    ) {
      unlocked.push("Hot Foot");
    }
  }

  // 7. Upset Hunter: correctly predicts underdog win
  const underdogTeam = r.underdogTeam ?? m.underdogTeam;
  if (underdogTeam && okWinner) {
    const underdog = underdogTeam;
    const underdogWinnerSide = underdog === m.home.code ? "home" : (underdog === m.away.code ? "away" : null);
    if (underdogWinnerSide && r.winner === underdogWinnerSide && p.winner === underdogWinnerSide) {
      unlocked.push("Upset Hunter");
    }
  }

  // 8. Chaos Merchant: predicts outcome correctly on match marked isUpsetResult or chaosOutcome by admin
  if ((r.isUpsetResult || r.chaosOutcome || m.isUpsetResult || m.chaosOutcome) && okWinner) {
    unlocked.push("Chaos Merchant");
  }

  // 9. Country Captain: User enters top 10 for their country.
  // Calculated based on if total IQ (after this match) is >= 500
  const currentTotal = allPredictions
    .filter(x => x.wallet === p.wallet && x.claimed)
    .reduce((sum, x) => sum + (x.pointsEarned ?? 0), 0) + pointsEarned;
  if (currentTotal >= 500) {
    const alreadyHad = allPredictions.some(x => x.wallet === p.wallet && x.claimed && x.badges?.includes("Country Captain"));
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
  useEffect(() => { save(state); }, [state]);
  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider?.on || !provider.removeListener) return;
    const onAccountsChanged = (accounts: unknown) => {
      const next = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      setState((s) => ({ ...s, wallet: next, profile: next === s.profile?.wallet ? s.profile : null }));
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
  }, []);

  const connectWallet = useCallback(async () => {
    let wallet = state.wallet;
    if (!wallet) {
      const connected = await connectXLayerWallet();
      wallet = connected.wallet;
      setState((s) => ({ ...s, wallet: wallet!, chainId: connected.chainId }));
    }
    return wallet;
  }, [state.wallet]);

  const disconnect = useCallback(() => {
    setState((s) => ({ ...s, wallet: null, chainId: null, profile: null }));
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
      await invokeKnewBallFunction("create-profile", {
        walletAddress: wallet,
        displayName: p.displayName,
        country: p.country,
        nonce,
        timestamp,
        message,
        signature,
      });
    }

    setState((s) => ({
      ...s,
      profile: { ...p, wallet, createdAt: Date.now() },
    }));
  }, [state.wallet]);

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
    return out;
  }, [state.drafts, state.profile, state.wallet]);

  const recoverPrediction = useCallback(async (matchId: string): Promise<Prediction | undefined> => {
    const wallet = state.wallet;
    const existing = state.predictions.find((prediction) => prediction.matchId === matchId && prediction.wallet === wallet);
    if (!wallet || existing?.txHash) return undefined;

    const locked = await getLockedPrediction(matchId, wallet);
    if (!locked) return undefined;

    const recovered: Prediction = {
      ...existing,
      id: existing?.id ?? `chain_${matchId}_${wallet.slice(2, 8)}_${Math.floor(locked.lockedAt / 1000).toString(36)}`,
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
      predictions: s.predictions.some((prediction) => prediction.matchId === matchId && prediction.wallet === wallet)
        ? s.predictions.map((prediction) => (
          prediction.matchId === matchId && prediction.wallet === wallet ? recovered : prediction
        ))
        : [...s.predictions, recovered],
    }));
    return recovered;
  }, [state.predictions, state.wallet]);

  const getPrediction = useCallback((matchId: string, w?: string) => {
    const wallet = w ?? state.wallet;
    if (!wallet) return undefined;
    return state.predictions.find((p) => p.matchId === matchId && p.wallet === wallet);
  }, [state.predictions, state.wallet]);

  const getPredictionById = useCallback(
    (id: string) => state.predictions.find((p) => p.id === id),
    [state.predictions],
  );

  const resolveMatch = useCallback((r: MatchResult) => {
    setState((s) => ({ ...s, results: { ...s.results, [r.matchId]: r } }));
  }, []);

  const getResult = useCallback((id: string) => state.results[id], [state.results]);

  const claimPrediction = useCallback((id: string): Prediction | undefined => {
    let out: Prediction | undefined;
    setState((s) => {
      const idx = s.predictions.findIndex((p) => p.id === id);
      if (idx < 0) return s;
      const p = s.predictions[idx];
      if (p.claimed) { out = p; return s; }
      const r = s.results[p.matchId];
      if (!r) return s;

      const m = MATCHES.find((x) => x.id === p.matchId);
      if (!m) return s;

      const score = scorePrediction(p, r);
      const unlockedBadges = calculateBadgesForPrediction(p, r, m, s.predictions, s.results, score.total);

      const txTail = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
      const updated: Prediction = {
        ...p,
        claimed: true,
        pointsEarned: score.total,
        badge: unlockedBadges[0] || undefined,
        badges: unlockedBadges,
        breakdown: score.breakdown,
        claimTxHash: "0x" + txTail.padEnd(64, "0"),
      };
      const next = [...s.predictions];
      next[idx] = updated;
      out = updated;
      return { ...s, predictions: next };
    });
    return out;
  }, []);

  const value = useMemo<Api>(() => {
    const totalBallIq = state.predictions
      .filter((p) => p.claimed && p.wallet === state.wallet)
      .reduce((s, p) => s + (p.pointsEarned ?? 0), 0);
    const unclaimed = state.predictions.filter(
      (p) => p.wallet === state.wallet && !p.claimed && !!state.results[p.matchId],
    );
    const myClaims = state.predictions.filter((p) => p.wallet === state.wallet && p.claimed);
    const streakStats = calculateStreakStats(myClaims, state.results);

    return {
      ...state,
      connectWallet, disconnect, createProfile,
      saveDraft, clearDraft,
      getDraft: (m) => state.drafts[m],
      lockPrediction, recoverPrediction, getPrediction, getPredictionById, claimPrediction,
      resolveMatch, getResult,
      totalBallIq, unclaimed,
      currentStreak: streakStats.current,
      bestStreak: streakStats.best,
    };
  }, [state, connectWallet, disconnect, createProfile, saveDraft, clearDraft, lockPrediction, recoverPrediction, getPrediction, getPredictionById, claimPrediction, resolveMatch, getResult]);

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

export function describePrediction(p: DraftPrediction, m: Match) {
  const winner =
    p.winner === "draw" ? "Draw" :
    p.winner === "home" ? `${m.home.name} win` : `${m.away.name} win`;
  const first =
    p.firstGoal === "home" ? `${m.home.code} scores first` :
    p.firstGoal === "away" ? `${m.away.code} scores first` : "No goal";
  return [
    `${winner} ${p.homeScore}-${p.awayScore}`,
    p.overUnder === "over" ? "Over 2.5 goals" : "Under 2.5 goals",
    p.btts === "yes" ? "Both teams score" : "Clean sheet",
    first,
  ];
}

type PredictionSyncResponse = {
  status: "synced" | "already_synced";
  prediction: {
    id: string;
    lockedAt: string | null;
  };
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
