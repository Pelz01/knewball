import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { OnboardingModal } from "@/components/site/OnboardingModal";
import { MATCHES, type Match } from "@/lib/match-data";
import { Flag } from "@/components/site/Flag";
import {
  useStore, describePrediction, shortAddress,
  type DraftPrediction, type Prediction, type MatchResult,
} from "@/lib/store";
import { explorerTxUrl } from "@/lib/xlayer";

export const Route = createFileRoute("/matches/$matchId")({
  loader: ({ params }) => {
    const match = MATCHES.find((m) => m.id === params.matchId);
    if (!match) throw notFound();
    return { match };
  },
  component: MatchDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">404</span>
        <h1 className="mt-3 font-display text-5xl tracking-tight">No match on this fixture.</h1>
        <Link to="/matches" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Back to matchboard
        </Link>
      </div>
    </div>
  ),
});

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function MatchDetail() {
  const { match } = Route.useLoaderData();
  const router = useRouter();
  const { wallet, profile, getDraft, saveDraft, clearDraft, getPrediction, lockPrediction, getResult, claimPrediction } = useStore();

  const pred = getPrediction(match.id);
  const draft = getDraft(match.id);
  const result = getResult(match.id);
  const isLive = match.status === "live";
  const isFinal = match.status === "final" || !!result;
  const kickoffPassed = new Date(match.kickoff).getTime() < Date.now() || isLive || isFinal;

  // Form state (seeded from draft if present)
  const [winner, setWinner] = useState<"home" | "draw" | "away">(draft?.winner ?? "home");
  const [scoreH, setScoreH] = useState(draft?.homeScore ?? 1);
  const [scoreA, setScoreA] = useState(draft?.awayScore ?? 1);
  const [overUnder, setOverUnder] = useState<"over" | "under">(draft?.overUnder ?? "over");
  const [btts, setBtts] = useState<"yes" | "no">(draft?.btts ?? "yes");
  const [firstGoal, setFirstGoal] = useState<"home" | "away" | "none">(draft?.firstGoal ?? "home");

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [txState, setTxState] = useState<"idle" | "locking" | "claiming" | "claimed" | "locked">("idle");
  const [showClaimToast, setShowClaimToast] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const draftReady: DraftPrediction = {
    matchId: match.id, winner, homeScore: scoreH, awayScore: scoreA,
    overUnder, btts, firstGoal, createdAt: Date.now(),
  };

  // Once user finishes onboarding (wallet + profile), and a saved draft exists,
  // surface a "your call is ready" CTA below. We don't auto-lock.
  useEffect(() => {
    if (pred && txState === "idle") setTxState("locked");
  }, [pred, txState]);

  const h = hash(match.id);
  const homePct = 25 + (h % 40);
  const drawPct = 10 + ((h >> 6) % 25);
  const awayPct = Math.max(5, 100 - homePct - drawPct);

  const kickoff = new Date(match.kickoff);
  const day = kickoff.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = kickoff.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  async function handleLock() {
    if (kickoffPassed) return;
    saveDraft(draftReady);
    setTxError(null);
    if (!wallet || !profile) {
      setShowOnboarding(true);
      return;
    }
    setTxState("locking");
    try {
      await lockPrediction(match.id);
      setTxState("locked");
    } catch (err) {
      setTxState("idle");
      setTxError(err instanceof Error ? err.message : "Transaction failed. Your draft is still saved.");
    }
  }

  async function handleClaim() {
    if (!pred) return;
    setTxState("claiming");
    await new Promise((r) => setTimeout(r, 900));
    claimPrediction(pred.id);
    setTxState("claimed");
    setShowClaimToast(true);
  }

  // After onboarding completes, if a draft exists, lock automatically (with
  // confirmation visible — user clicked the original "Sign & lock call" CTA).
  function onboardingComplete() {
    setShowOnboarding(false);
  }

  const showForm = !pred;
  const statusPill = pred
    ? result ? "Result available" : isLive ? "Match in progress" : "Predictions locked"
    : kickoffPassed ? "Predictions closed" : "Open for calls";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/matches" className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
            ← Matchboard
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{match.group}</span>
        </div>

        {/* Scoreboard */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-scanline opacity-40" />
          <div className="relative grid items-center gap-6 px-8 py-12 md:grid-cols-[1fr_auto_1fr] md:px-14 md:py-16">
            <TeamBig team={match.home} align="right" score={result?.homeScore ?? match.score?.home} />
            <div className="flex flex-col items-center gap-3">
              {result ? (
                <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  Full time
                </span>
              ) : isLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-card/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-red-card">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-card" />
                  Live · {match.minute}'
                </span>
              ) : (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  Kickoff · {time}
                </span>
              )}
              <div className="font-display text-5xl tracking-tight text-muted-foreground md:text-6xl">vs</div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{day}</span>
            </div>
            <TeamBig team={match.away} align="left" score={result?.awayScore ?? match.score?.away} />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-8 py-4 md:px-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{match.venue}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {statusPill} · <span className="text-primary">{match.callsLocked.toLocaleString()}</span> calls on X Layer
            </span>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-border bg-surface p-7 md:p-9">
            {showForm ? (
              <FormPanel
                match={match}
                winner={winner} setWinner={setWinner}
                scoreH={scoreH} setScoreH={setScoreH}
                scoreA={scoreA} setScoreA={setScoreA}
                overUnder={overUnder} setOverUnder={setOverUnder}
                btts={btts} setBtts={setBtts}
                firstGoal={firstGoal} setFirstGoal={setFirstGoal}
                disabled={kickoffPassed}
                kickoffPassed={kickoffPassed}
                wallet={wallet}
                onLock={handleLock}
                txState={txState}
                txError={txError}
                hasDraft={!!draft}
                onClearDraft={() => clearDraft(match.id)}
              />
            ) : pred && result ? (
              <ResolvedPanel
                match={match}
                prediction={pred}
                result={result}
                onClaim={handleClaim}
                claiming={txState === "claiming"}
              />
            ) : pred ? (
              <LockedPanel match={match} prediction={pred} isLive={isLive} />
            ) : null}
          </section>

          {/* Side panels */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Fan call split</h3>
              <div className="mt-4 space-y-3">
                <SplitBar label={match.home.name} code={match.home.code} pct={homePct} tone="primary" />
                <SplitBar label="Draw" code="X" pct={drawPct} tone="muted" />
                <SplitBar label={match.away.name} code={match.away.code} pct={awayPct} tone="foreground" />
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {match.callsLocked.toLocaleString()} locked · contrarian = bigger reward
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Head-to-head</h3>
              <ul className="mt-4 space-y-2 font-mono text-xs text-muted-foreground">
                <li className="flex justify-between"><span>Last meeting</span><span className="text-foreground">2 – 1 {match.home.code}</span></li>
                <li className="flex justify-between"><span>All-time</span><span className="text-foreground">W4 · D2 · L3</span></li>
                <li className="flex justify-between"><span>Avg goals</span><span className="text-foreground">2.7</span></li>
                <li className="flex justify-between"><span>Clean sheets</span><span className="text-foreground">1 in 5</span></li>
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Onchain proof</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Every call is hashed and signed on X Layer at kickoff. No edits, no excuses.
              </p>
              <div className="mt-4 rounded-xl bg-background p-3 font-mono text-[10px] text-muted-foreground">
                {pred ? `${pred.txHash.slice(0, 12)}…${pred.txHash.slice(-6)}` : `0xkb…${match.id.replace("-", "").slice(-6)}c4`}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <OnboardingModal
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={onboardingComplete}
      />

      {showClaimToast && pred?.claimed && (
        <ClaimCelebration prediction={pred} match={match} onClose={() => setShowClaimToast(false)} onShare={() => router.navigate({ to: "/proof/$predictionId", params: { predictionId: pred.id } })} />
      )}

      <Footer />
    </div>
  );
}

function TeamBig({ team, align, score }: { team: Match["home"]; align: "left" | "right"; score?: number }) {
  return (
    <div className={`flex items-center gap-5 ${align === "right" ? "md:justify-end" : "md:justify-start"}`}>
      {align === "left" && typeof score === "number" && (
        <div className="font-display text-6xl tabular-nums leading-none md:text-7xl">{score}</div>
      )}
      <div className={`flex items-center gap-4 ${align === "right" ? "md:flex-row" : "md:flex-row-reverse"}`}>
        <div className={align === "right" ? "text-right" : "text-left"}>
          <div className="font-display text-3xl leading-none tracking-tight md:text-4xl">{team.name}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{team.code}</div>
        </div>
        <Flag team={team} className="h-12 w-[72px] rounded-md shadow-sm border border-border/20" />
      </div>
      {align === "right" && typeof score === "number" && (
        <div className="font-display text-6xl tabular-nums leading-none md:text-7xl">{score}</div>
      )}
    </div>
  );
}

function CallButton({
  label, sub, active, onClick, disabled,
}: { label: string; sub: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-surface-elevated"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-base font-bold tracking-tight">{label}</span>
        {active && <span className="shrink-0 rounded bg-primary-foreground/20 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-primary-foreground font-bold">picked</span>}
      </div>
      <div className={`mt-0.5 text-[10px] leading-tight font-normal ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{sub}</div>
    </button>
  );
}

function ScoreStepper({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" disabled={disabled || value === 0} onClick={() => onChange(Math.max(0, value - 1))} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition hover:border-primary/30 disabled:opacity-20 hover:bg-surface-elevated">−</button>
        <span className="w-5 text-center font-display text-lg font-bold tabular-nums">{value}</span>
        <button type="button" disabled={disabled || value === 9} onClick={() => onChange(Math.min(9, value + 1))} className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-foreground transition hover:border-primary/30 disabled:opacity-20 hover:bg-surface-elevated">+</button>
      </div>
    </div>
  );
}

function SplitBar({ label, code, pct, tone }: { label: string; code: string; pct: number; tone: "primary" | "muted" | "foreground" }) {
  const bar = tone === "primary" ? "bg-primary" : tone === "foreground" ? "bg-foreground/80" : "bg-muted-foreground/40";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums">{pct}% · {code}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        <span style={{ width: `${pct}%` }} className={`block h-full ${bar}`} />
      </div>
    </div>
  );
}

/* ============ panels ============ */

function FormPanel({
  match, winner, setWinner, scoreH, setScoreH, scoreA, setScoreA,
  overUnder, setOverUnder, btts, setBtts, firstGoal, setFirstGoal,
  disabled, kickoffPassed, wallet, onLock, txState, txError, hasDraft, onClearDraft,
}: {
  match: Match;
  winner: "home" | "draw" | "away"; setWinner: (v: "home" | "draw" | "away") => void;
  scoreH: number; setScoreH: (v: number) => void;
  scoreA: number; setScoreA: (v: number) => void;
  overUnder: "over" | "under"; setOverUnder: (v: "over" | "under") => void;
  btts: "yes" | "no"; setBtts: (v: "yes" | "no") => void;
  firstGoal: "home" | "away" | "none"; setFirstGoal: (v: "home" | "away" | "none") => void;
  disabled: boolean; kickoffPassed: boolean; wallet: string | null;
  onLock: () => void; txState: string; txError: string | null; hasDraft: boolean; onClearDraft: () => void;
}) {
  if (kickoffPassed) {
    return (
      <div className="text-center py-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-card">Predictions closed</span>
        <h2 className="mt-2 font-display text-3xl tracking-tight">You needed to lock before kickoff.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Catch the next match — calls open as soon as kickoff is set.</p>
        <Link to="/matches" className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Back to matchboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-tight md:text-3xl">Make your call</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lock before kickoff. Once it's on X Layer, it cannot be edited.</p>
        </div>
        {hasDraft && (
          <button type="button" onClick={onClearDraft} className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            Clear draft
          </button>
        )}
      </div>

      <PickGroup label="Winner" cols={3}>
        <CallButton label={match.home.code} sub={`${match.home.name} win`} active={winner === "home"} onClick={() => setWinner("home")} disabled={disabled} />
        <CallButton label="X" sub="Draw" active={winner === "draw"} onClick={() => setWinner("draw")} disabled={disabled} />
        <CallButton label={match.away.code} sub={`${match.away.name} win`} active={winner === "away"} onClick={() => setWinner("away")} disabled={disabled} />
      </PickGroup>

      <PickGroup label="Correct score · +200 IQ" cols={2}>
        {/* cols container */}
          <ScoreStepper label={match.home.code} value={scoreH} onChange={setScoreH} disabled={disabled} />
          <ScoreStepper label={match.away.code} value={scoreA} onChange={setScoreA} disabled={disabled} />
        {/* end cols container */}
      </PickGroup>

      <PickGroup label="Total goals" cols={2}>
        <CallButton label="Over" sub="2.5+ goals" active={overUnder === "over"} onClick={() => setOverUnder("over")} disabled={disabled} />
        <CallButton label="Under" sub="Up to 2 goals" active={overUnder === "under"} onClick={() => setOverUnder("under")} disabled={disabled} />
        {/* spacer deleted */}
      </PickGroup>

      <PickGroup label="Both teams to score" cols={2}>
        <CallButton label="Yes" sub="Both find net" active={btts === "yes"} onClick={() => setBtts("yes")} disabled={disabled} />
        <CallButton label="No" sub="At least one clean sheet" active={btts === "no"} onClick={() => setBtts("no")} disabled={disabled} />
        {/* spacer deleted */}
      </PickGroup>

      <PickGroup label="First team to score" cols={3}>
        <CallButton label={match.home.code} sub="Home scores first" active={firstGoal === "home"} onClick={() => setFirstGoal("home")} disabled={disabled} />
        <CallButton label={match.away.code} sub="Away scores first" active={firstGoal === "away"} onClick={() => setFirstGoal("away")} disabled={disabled} />
        <CallButton label="0-0" sub="No goal" active={firstGoal === "none"} onClick={() => setFirstGoal("none")} disabled={disabled} />
      </PickGroup>

      <div className="mt-8 rounded-2xl border border-hairline bg-background p-5">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">Your call</span>
        <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
          {describePrediction({ matchId: match.id, winner, homeScore: scoreH, awayScore: scoreA, overUnder, btts, firstGoal, createdAt: 0 }, match)
            .map((l) => <li key={l}>{l}</li>)}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {wallet ? "X Layer transaction · cannot be edited after lock" : "wallet connects on lock · draft is saved"}
        </div>
        <button
          type="button"
          disabled={disabled || txState === "locking"}
          onClick={onLock}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-muted-foreground"
        >
          {txState === "locking" ? "Locking on X Layer…" : "Lock my call →"}
        </button>
      </div>
      {txError && (
        <p className="mt-4 rounded-xl border border-red-card/30 bg-red-card/10 p-3 text-sm text-red-card">
          {txError}
        </p>
      )}
    </>
  );
}

function PickGroup({ label, cols = 3, children }: { label: string; cols?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 font-sans text-sm font-semibold text-muted-foreground">{label}</div>
      <div className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : "grid-cols-3"}`}>{children}</div>
    </div>
  );
}

function LockedPanel({ match, prediction, isLive }: { match: Match; prediction: Prediction; isLive: boolean }) {
  const lines = describePrediction(prediction, match);
  return (
    <>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Locked on X Layer</span>
      <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">Your call is locked.</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {isLive ? "Match in progress. Results will be scored after full time." : "Waiting for kickoff. Nothing can change now."}
      </p>
      <div className="mt-6 rounded-2xl border border-hairline bg-background p-5">
        <ul className="grid gap-1 text-sm md:grid-cols-2">
          {lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <div className="rounded-xl border border-hairline bg-background p-3">
          <dt>Wallet</dt>
          <dd className="mt-1 text-foreground normal-case tracking-normal">{shortAddress(prediction.wallet)}</dd>
        </div>
        <div className="rounded-xl border border-hairline bg-background p-3">
          <dt>Tx hash</dt>
          <dd className="mt-1 text-foreground normal-case tracking-normal">{prediction.txHash.slice(0, 10)}…{prediction.txHash.slice(-6)}</dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/proof/$predictionId" params={{ predictionId: prediction.id }} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110">
          View proof →
        </Link>
        <Link to="/matches" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-elevated">
          Back to matchboard
        </Link>
        <a href={explorerTxUrl(prediction.txHash)} target="_blank" rel="noreferrer" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-elevated">
          View on explorer
        </a>
      </div>
    </>
  );
}

function ResolvedPanel({
  match, prediction, result, onClaim, claiming,
}: { match: Match; prediction: Prediction; result: MatchResult; onClaim: () => void; claiming: boolean }) {
  const lines = describePrediction(prediction, match);
  const claimed = prediction.claimed;

  return (
    <>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Result available</span>
      <h2 className="mt-2 font-display text-3xl tracking-tight md:text-4xl">
        {claimed ? "Ball IQ claimed." : "Your reward is waiting."}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Final score · {result.homeScore} – {result.awayScore} {match.home.code} / {match.away.code}.
      </p>

      {prediction.breakdown && (
        <div className="mt-6 rounded-2xl border border-hairline bg-background p-5">
          <ul className="divide-y divide-hairline">
            {prediction.breakdown.map((b) => (
              <li key={b.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${b.ok ? "bg-primary" : "bg-red-card/60"}`} />
                  {b.label}
                </span>
                <span className={`font-display text-xl tabular-nums ${b.ok ? "text-foreground" : "text-muted-foreground"}`}>
                  {b.points > 0 ? `+${b.points}` : "0"}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between pt-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Total</span>
              <span className="font-display text-3xl tracking-tight text-primary">
                +{prediction.pointsEarned} Ball IQ
              </span>
            </li>
          </ul>
        </div>
      )}

      {!claimed && (
        <div className="mt-6 rounded-2xl border border-hairline bg-background p-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Your call</span>
          <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            {lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {!claimed ? (
          <button
            type="button"
            disabled={claiming}
            onClick={onClaim}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:bg-surface-elevated disabled:text-muted-foreground"
          >
            {claiming ? "Claiming Ball IQ…" : "Claim Ball IQ →"}
          </button>
        ) : (
          <Link to="/proof/$predictionId" params={{ predictionId: prediction.id }} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
            Share proof →
          </Link>
        )}
        <Link to="/leaderboard" className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated">
          View leaderboard
        </Link>
      </div>
    </>
  );
}

function ClaimCelebration({
  prediction, match, onClose, onShare,
}: { prediction: Prediction; match: Match; onClose: () => void; onShare: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-primary/40 bg-surface ring-pitch">
        <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
        <div className="relative p-10 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">You knew ball</span>
          <h2 className="mt-3 font-display text-5xl tracking-tight text-glow-green">
            +{prediction.pointsEarned}
          </h2>
          <p className="mt-1 font-display text-2xl tracking-tight text-muted-foreground">Ball IQ claimed</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {match.home.name} vs {match.away.name}
            {prediction.badge && <> · <span className="text-primary">{prediction.badge}</span> badge unlocked</>}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={onShare} className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
              Share proof →
            </button>
            <button onClick={onClose} className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated">
              Keep playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
