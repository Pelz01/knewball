import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MATCHES, type Match } from "./match-data";
import { connectXLayerWallet, getInjectedProvider, sendPredictionProofTransaction } from "./xlayer";

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

const KEY = "knewball.v1";

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
  perfect: 150,
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
  const perfect = okWinner && okScore && okOU && okBTTS && okFG;
  if (perfect) breakdown.push({ label: "Perfect Call bonus", points: POINTS.perfect, ok: true });
  const total = breakdown.reduce((s, b) => s + b.points, 0);
  const badge = perfect ? "Perfect Call" : okScore ? "Knew Ball" : okFG ? "First Goal Caller" : undefined;
  return { total, breakdown, perfect, badge };
}

/* ============ context ============ */

interface Api extends State {
  // wallet/profile
  connectWallet: () => Promise<string>;
  disconnect: () => void;
  createProfile: (p: Omit<FanProfile, "wallet" | "createdAt">) => void;
  // drafts
  saveDraft: (d: DraftPrediction) => void;
  clearDraft: (matchId: string) => void;
  getDraft: (matchId: string) => DraftPrediction | undefined;
  // predictions
  lockPrediction: (matchId: string) => Promise<Prediction | undefined>;
  getPrediction: (matchId: string, wallet?: string) => Prediction | undefined;
  getPredictionById: (id: string) => Prediction | undefined;
  claimPrediction: (id: string) => Prediction | undefined;
  // admin
  resolveMatch: (r: MatchResult) => void;
  getResult: (matchId: string) => MatchResult | undefined;
  // derived
  totalBallIq: number;
  unclaimed: Prediction[];
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

  const createProfile = useCallback((p: Omit<FanProfile, "wallet" | "createdAt">) => {
    setState((s) => {
      if (!s.wallet) return s;
      return { ...s, profile: { ...p, wallet: s.wallet, createdAt: Date.now() } };
    });
  }, []);

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
    let out: Prediction | undefined;
    setState((s) => {
      const d = s.drafts[matchId];
      if (!d || !s.wallet) return s;
      const pred: Prediction = {
        ...d,
        id: `pred_${matchId}_${s.wallet.slice(2, 8)}_${Date.now().toString(36)}`,
        wallet: s.wallet,
        txHash,
        lockedAt: Date.now(),
        claimed: false,
      };
      out = pred;
      const { [matchId]: _, ...rest } = s.drafts;
      void _;
      return { ...s, drafts: rest, predictions: [...s.predictions, pred] };
    });
    return out;
  }, [state.drafts, state.profile, state.wallet]);

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
      const score = scorePrediction(p, r);
      const txTail = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
      const updated: Prediction = {
        ...p,
        claimed: true,
        pointsEarned: score.total,
        badge: score.badge,
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
    return {
      ...state,
      connectWallet, disconnect, createProfile,
      saveDraft, clearDraft,
      getDraft: (m) => state.drafts[m],
      lockPrediction, getPrediction, getPredictionById, claimPrediction,
      resolveMatch, getResult,
      totalBallIq, unclaimed,
    };
  }, [state, connectWallet, disconnect, createProfile, saveDraft, clearDraft, lockPrediction, getPrediction, getPredictionById, claimPrediction, resolveMatch, getResult]);

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
