import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { BADGES, MATCHES, TEAMS, TOP_FANS, type Team } from "@/lib/match-data";
import { Flag } from "@/components/site/Flag";
import { useStore, shortAddress, matchById, describePrediction, type MatchResult, type Prediction } from "@/lib/store";
import { BadgeIcon } from "@/components/site/BadgeIcon";
import { fetchProfileByWallet, fetchWalletPredictionMemory, hasSupabaseConfig, type SupabasePredictionMemory } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/profile/$wallet")({
  component: ProfileByWallet,
});

function ProfileByWallet() {
  const { wallet: pageWallet } = Route.useParams();
  const { wallet, profile, predictions, results, totalBallIq, currentForm } = useStore();
  const [publicProfile, setPublicProfile] = useState<{ displayName: string; country: string } | null>(null);
  const [publicMemory, setPublicMemory] = useState<SupabasePredictionMemory[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const pageWalletLower = pageWallet?.toLowerCase() || "";
  const isMe = !!(wallet && pageWallet && wallet.toLowerCase() === pageWalletLower);

  useEffect(() => {
    if (isMe || !pageWallet || !hasSupabaseConfig()) return;
    let cancelled = false;
    setPublicLoading(true);
    Promise.all([
      fetchProfileByWallet(pageWallet),
      fetchWalletPredictionMemory(pageWallet),
    ])
      .then(([loadedProfile, loadedMemory]) => {
        if (cancelled) return;
        setPublicProfile(loadedProfile ? {
          displayName: loadedProfile.displayName,
          country: loadedProfile.country,
        } : null);
        setPublicMemory(loadedMemory);
      })
      .catch((error) => console.warn("Could not load public fan passport.", error))
      .finally(() => {
        if (!cancelled) setPublicLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isMe, pageWallet]);

  // Public-facing profile: own profile when connected, otherwise show a
  // real Supabase profile. Seeded fan persona only remains as a last-resort demo fallback.
  const persona = !isMe && !publicProfile ? (TOP_FANS.find((f) => pageWalletLower.length >= 6 && f.handle.toLowerCase().includes(pageWalletLower.slice(2, 6))) ?? TOP_FANS[0]) : null;

  const displayName = isMe ? profile?.displayName ?? "fan.knewball" : publicProfile?.displayName ?? persona!.handle;
  const country: Team = isMe
    ? (Object.values(TEAMS).find((t) => t.code === profile?.country) ?? TEAMS.ARG)
    : (Object.values(TEAMS).find((t) => t.code === publicProfile?.country) ?? persona!.country);

  const publicPreds = useMemo(() => publicMemory.map(mapPublicPredictionMemory), [publicMemory]);
  const publicResults = useMemo(() => Object.fromEntries(
    publicMemory
      .filter((memory) => memory.result)
      .map((memory) => [String(memory.prediction.match_id), mapPublicResult(memory)]),
  ), [publicMemory]);
  const myPreds = isMe
    ? predictions.filter((p) => p.wallet && p.wallet.toLowerCase() === pageWalletLower)
    : publicPreds;
  const visibleResults = isMe ? results : publicResults;
  const ballIq = isMe
    ? totalBallIq
    : publicProfile ? myPreds.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0) : persona!.ballIq;
  const correct = myPreds.filter((p) => p.claimed && (p.pointsEarned ?? 0) > 0).length;
  const total = myPreds.length;
  const publicFormCalls = myPreds
    .filter((p) => p.claimed && typeof p.correctCount === "number")
    .sort((a, b) => b.lockedAt - a.lockedAt)
    .slice(0, 5)
    .map((p) => p.correctCount ?? 0);
  const publicFormPct = publicFormCalls.length >= 5
    ? Math.round((publicFormCalls.reduce((sum, call) => sum + call, 0) / 25) * 100)
    : null;
  const formValue = isMe
    ? currentForm.percentage === null ? currentForm.label : `${currentForm.percentage}%`
    : publicProfile ? (publicFormPct === null ? "Building Form" : `${publicFormPct}%`) : `${persona!.form}%`;
  const formSub = isMe
    ? currentForm.calls.length ? `Building Form: ${currentForm.calls.length}/5 matches calibrated` : "Building Form: 0/5 matches calibrated"
    : publicProfile ? `Building Form: ${publicFormCalls.length}/5 matches calibrated` : "last 5 calls";
  const lastFiveValue = isMe
    ? currentForm.calls.length ? currentForm.calls.map((call) => `${call}/5`).join(" · ") : "—"
    : publicProfile ? (publicFormCalls.length ? publicFormCalls.map((call) => `${call}/5`).join(" · ") : "—") : "4/5 · 3/5 · 5/5";
  const earnedBadges = Array.from(new Set(myPreds.flatMap((p) => p.badges || (p.badge ? [p.badge] : [])).filter(Boolean))) as string[];

  const stats = [
    { label: "Ball IQ", value: ballIq.toLocaleString(), sub: "Season 01" },
    { label: "Current Form", value: formValue, sub: formSub },
    { label: "Last 5 Calls", value: lastFiveValue, sub: total ? `${correct} positive claims` : "no calls yet" },
    { label: "Country Rank", value: total ? "#--" : "Pending", sub: country.name },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:py-24">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10 md:p-14">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-background overflow-hidden p-2 shadow-sm">
                <Flag team={country} className="h-full w-full rounded" />
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  Fan profile {isMe && "· you"}
                </span>
                <h1 className="font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-6xl">{displayName}</h1>
                <p className="font-mono text-xs text-muted-foreground">
                  {country.name} · wallet {pageWallet ? shortAddress(pageWallet) : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/matches" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 shadow-lg shadow-primary/10">
                {isMe ? "Next call →" : "Make your own call →"}
              </Link>
              <Link to="/leaderboard" className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                View leaderboard
              </Link>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-hairline bg-background p-5 sm:p-6 space-y-3.5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.label}</div>
                  <div className="mt-1.5 font-display text-3xl tracking-tight sm:text-4xl">{s.value}</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground border-t border-border/30 pt-2.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-8 sm:mt-14 lg:grid-cols-[1.6fr_1fr] lg:gap-10">
          <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8 md:p-10">
            <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
              <h2 className="font-display text-2xl tracking-tight md:text-3xl">Call history</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {publicLoading ? "loading" : `${myPreds.length} locked`}
              </span>
            </div>

            {myPreds.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-10 sm:p-14 text-center">
                <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-20" />
                <div className="relative flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border text-primary mb-4">
                    <Gamepad2 className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl tracking-tight text-foreground mt-2">No calls locked yet</h3>
                  <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
                    No calls yet. Lock your first call before kickoff and start building your Fan Passport.
                  </p>
                  
                  <div className="mt-8 w-full max-w-md rounded-xl border border-hairline bg-surface p-5 sm:p-6 text-left space-y-3.5">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-primary border-b border-border/40 pb-2 block">How it works</span>
                    <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal list-inside">
                      <li>Pick any upcoming match fixture.</li>
                      <li>Predict the winner, correct score, goals, and more.</li>
                      <li>Lock your call on X Layer.</li>
                      <li>Claim Ball IQ when the result lands.</li>
                    </ol>
                  </div>
                  
                  <Link to="/matches" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 shadow-lg shadow-primary/10">
                    Make your first call
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {myPreds.slice().reverse().map((p) => {
                  const m = matchById(p.matchId);
                  const r = visibleResults[p.matchId];
                  if (!m) return null;
                  const status = !r ? "Waiting" : p.claimed ? verdictLabel(p, r) : "Claim";
                  const tone = p.claimed && (p.pointsEarned ?? 0) > 0 ? "bg-primary/15 text-primary font-semibold" : p.claimed ? "bg-red-card/15 text-red-card font-semibold" : "border border-border text-muted-foreground";
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-5 sm:py-6">
                      <div className="min-w-0">
                        <div className="font-display text-lg leading-none tracking-tight">{m.home.code} vs {m.away.code}</div>
                        <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {describePrediction(p, m)[0]} · {describePrediction(p, m)[1]}
                          {r ? ` · Result ${r.homeScore}-${r.awayScore}` : " · Waiting for result"}
                        </div>
                      </div>
                      <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] sm:inline-flex ${tone}`}>
                        {status}
                      </span>
                      <div className="w-20 text-right font-display text-xl tabular-nums tracking-tight">
                        {p.claimed ? `+${p.pointsEarned}` : <span className="text-muted-foreground">—</span>}
                      </div>
                      <Link to="/proof/$predictionId" params={{ predictionId: p.id }} className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary hover:underline font-bold">
                        Proof →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary border-b border-border/40 pb-3 mb-6">Earned badges</h3>
              <div className="grid grid-cols-2 gap-4">
                {BADGES.map((b) => {
                  const hasBadge = earnedBadges.some((eb) => eb.toLowerCase() === b.name.toLowerCase() || eb.toLowerCase() === b.id.toLowerCase());
                  return (
                    <div 
                      key={b.id} 
                      className={`relative overflow-hidden rounded-2xl border p-5 transition duration-300 ${
                        hasBadge 
                          ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(25,227,111,0.08)]" 
                          : "border-border bg-background/50 opacity-40 hover:opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center ${hasBadge ? "" : "opacity-40"}`}>
                          <BadgeIcon id={b.id} className="h-10 w-10" />
                        </div>
                        {!hasBadge && (
                          <span className="font-sans text-[8px] font-bold uppercase tracking-wider text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
                            Locked
                          </span>
                        )}
                      </div>
                      <div className={`mt-3 font-display text-sm leading-tight tracking-tight ${hasBadge ? "text-foreground" : "text-muted-foreground"}`}>
                        {b.name}
                      </div>
                      <div className="mt-0.5 text-[9px] leading-tight text-muted-foreground">
                        {b.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary border-b border-border/40 pb-3 mb-6">Open calls available</h3>
              <ul className="space-y-4">
                {MATCHES.filter((m) => m.status === "upcoming").slice(0, 3).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-background p-4">
                    <div className="flex items-center gap-2.5">
                      <Flag team={m.home} className="h-4 w-6 rounded-sm border border-border/20 shadow-sm" />
                      <span className="font-mono text-xs text-foreground font-semibold">{m.home.code} – {m.away.code}</span>
                      <Flag team={m.away} className="h-4 w-6 rounded-sm border border-border/20 shadow-sm" />
                    </div>
                    <Link to="/matches/$matchId" params={{ matchId: m.id }} className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary hover:underline font-bold">
                      Call →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function verdictLabel(prediction: Prediction, result: MatchResult) {
  const correctCount = [
    prediction.winner === result.winner,
    prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore,
    prediction.overUnder === result.overUnder,
    prediction.btts === result.btts,
    prediction.firstGoal === result.firstGoal,
  ].filter(Boolean).length;
  if (correctCount >= 5) return "Perfect Slate";
  if (correctCount === 4) return "Sharp Call";
  if (correctCount === 3) return "Strong Call";
  if (correctCount === 2) return "Saw The Shape";
  if (correctCount === 1) return "Casual Alert";
  return "Fraud Watch";
}

function mapPublicPredictionMemory(memory: SupabasePredictionMemory): Prediction {
  const badgeNames = [...new Set(memory.badges.map((badge) => badgeNameFromId(badge.badge_id)))];
  const prediction: Prediction = {
    id: memory.prediction.id,
    matchId: String(memory.prediction.match_id),
    wallet: memory.prediction.wallet_address,
    txHash: memory.prediction.lock_tx_hash,
    winner: memory.prediction.winner_pick,
    homeScore: memory.prediction.home_score_pick,
    awayScore: memory.prediction.away_score_pick,
    overUnder: memory.prediction.total_goals_pick,
    btts: memory.prediction.both_teams_scored_pick,
    firstGoal: memory.prediction.first_goal_pick,
    createdAt: Date.parse(memory.prediction.created_at),
    lockedAt: Date.parse(memory.prediction.locked_at ?? memory.prediction.created_at),
    claimed: memory.prediction.claimed,
    pointsEarned: memory.prediction.claimed ? memory.prediction.points_earned : undefined,
    correctCount: memory.prediction.claimed ? memory.prediction.correct_count : undefined,
    claimTxHash: memory.prediction.claim_tx_hash ?? undefined,
    badges: badgeNames,
  };
  prediction.badge = prediction.badges?.[0];
  return prediction;
}

function mapPublicResult(memory: SupabasePredictionMemory): MatchResult {
  if (!memory.result) throw new Error("Missing result.");
  return {
    matchId: String(memory.result.match_id),
    homeScore: memory.result.home_score,
    awayScore: memory.result.away_score,
    winner: memory.result.winner,
    firstGoal: memory.result.first_goal,
    btts: memory.result.both_teams_scored,
    overUnder: memory.result.total_goals,
    resolvedAt: Date.parse(memory.result.resolved_at),
  };
}

function badgeNameFromId(id: string) {
  const normalized = id.replaceAll("_", "-");
  return BADGES.find((badge) => badge.id === normalized)?.name ??
    normalized.split("-").map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}
