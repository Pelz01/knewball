import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { type Match } from "@/lib/match-data";
import {
  useStore,
  matchById,
  describePrediction,
  scorePrediction,
  shortAddress,
  type MatchResult,
  type Prediction,
} from "@/lib/store";
import { fetchProfileByWallet, hasSupabaseConfig } from "@/lib/supabase";
import { explorerTxUrl, knewBallCupContractAddress, xLayerNetworkLabel } from "@/lib/xlayer";
import { Flag } from "@/components/site/Flag";

export const Route = createFileRoute("/proof/$predictionId")({
  component: ProofPage,
});

function ProofPage() {
  const { predictionId } = Route.useParams();
  const { wallet, profile, getPredictionById, getResult, hydratePredictionById } = useStore();
  const p = getPredictionById(predictionId);
  const [proofDisplayName, setProofDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(!p);
  const [attemptedLoad, setAttemptedLoad] = useState(false);

  useEffect(() => {
    if (p || attemptedLoad) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void hydratePredictionById(predictionId)
      .catch((error) => {
        console.warn("Could not hydrate proof from Supabase.", error);
      })
      .finally(() => {
        if (!cancelled) {
          setAttemptedLoad(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attemptedLoad, hydratePredictionById, p, predictionId]);

  useEffect(() => {
    if (!p) return;
    if (profile && profile.wallet.toLowerCase() === p.wallet.toLowerCase()) {
      setProofDisplayName(profile.displayName);
      return;
    }
    if (!hasSupabaseConfig()) return;

    let cancelled = false;
    void fetchProfileByWallet(p.wallet)
      .then((loadedProfile) => {
        if (!cancelled && loadedProfile) setProofDisplayName(loadedProfile.displayName);
      })
      .catch((error) => console.warn("Could not load proof profile.", error));

    return () => {
      cancelled = true;
    };
  }, [p, profile]);

  if (!p && loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Proof</span>
          <h1 className="mt-3 font-display text-5xl tracking-tight">Loading proof receipt</h1>
          <p className="mt-3 text-muted-foreground">Verifying the locked call and match receipt.</p>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">404</span>
          <h1 className="mt-3 font-display text-5xl tracking-tight">No proof at this link.</h1>
          <p className="mt-3 text-muted-foreground">The receipt is not available yet, or this proof link is invalid.</p>
          <Link to="/matches" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Make your own call
          </Link>
        </div>
      </div>
    );
  }

  const match = matchById(p.matchId)!;
  const r = getResult(p.matchId);
  const lines = describePrediction(p, match);
  const kickoffTime = new Date(match.kickoff).getTime();
  const verifiedBeforeKickoff = p.lockedAt < kickoffTime;
  const contractAddress = knewBallCupContractAddress();
  const networkLabel = xLayerNetworkLabel();
  const isOwner = Boolean(wallet && wallet.toLowerCase() === p.wallet.toLowerCase());
  const score = r ? scorePrediction(p, r) : null;
  const verdict = score ? verdictForCorrectCount(score.correctCount) : null;
  const fanName = proofDisplayName ?? shortAddress(p.wallet);
  const badgeNames = [...new Set([...(p.badges ?? []), ...(p.badge ? [p.badge] : [])])];
  const headline = p.claimed && (p.pointsEarned ?? 0) > 0
    ? `${fanName} knew ball before kickoff.`
    : `${fanName} locked this call before kickoff.`;
  const hasTxHash = Boolean(p.txHash);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareText = buildShareText({
    fanName,
    match,
    result: r,
    prediction: p,
    score,
    networkLabel,
    url,
  });
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link to="/matches" className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
          ← Matchboard
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
          <div className="pointer-events-none absolute inset-0 bg-scanline opacity-40" />
          <div className="relative p-8 md:p-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              Onchain proof · {networkLabel}
            </span>
            <h1 className="mt-3 font-display text-[clamp(2rem,5.5vw,4rem)] leading-[0.95] tracking-tight">
              {headline}
            </h1>

            <div className="mt-8 flex items-center justify-between gap-6 rounded-2xl border border-hairline bg-background p-6">
              <div className="flex items-center gap-3">
                <Flag team={match.home} className="h-8 w-12 rounded shadow-sm border border-border/20" />
                <div>
                  <div className="font-display text-2xl tracking-tight">{match.home.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{match.home.code}</div>
                </div>
              </div>
              <div className="text-center">
                {r ? (
                  <div className="font-display text-4xl tabular-nums">{r.homeScore} – {r.awayScore}</div>
                ) : (
                  <div className="font-display text-2xl tracking-tight text-muted-foreground">vs</div>
                )}
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {r ? "Final" : "Locked before kickoff"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-2xl tracking-tight">{match.away.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{match.away.code}</div>
                </div>
                <Flag team={match.away} className="h-8 w-12 rounded shadow-sm border border-border/20" />
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-hairline bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <TimelinePoint label="Call locked" value={formatUtc(p.lockedAt)} />
                <div className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] ${
                  verifiedBeforeKickoff ? "bg-primary/15 text-primary" : "bg-red-card/15 text-red-card"
                }`}>
                  {verifiedBeforeKickoff ? `Verified against KnewBallCup on ${networkLabel}` : "Invalid proof timing"}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">The call</h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {lines.map((l) => <li key={l} className="text-foreground">{l}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Receipt</h3>
                <dl className="mt-3 space-y-1.5 font-mono text-xs">
                  <Row k="Fan" v={fanName} />
                  <Row k="Network" v={networkLabel} />
                  <Row k="Locked at" v={formatUtc(p.lockedAt)} />
                  <Row k="Tx hash" v={hasTxHash ? `${p.txHash.slice(0, 10)}…${p.txHash.slice(-6)}` : "Recovered from contract"} />
                  <Row k="Status" v={p.claimed ? "Claimed" : r ? "Ready to claim" : "Awaiting kickoff"} />
                  {badgeNames.length > 0 && <Row k={badgeNames.length === 1 ? "Badge" : "Badges"} v={badgeNames.join(", ")} />}
                </dl>
              </div>
            </div>

            {!r && (
              <div className="mt-8 rounded-2xl border border-hairline bg-background p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Time capsule</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  This prediction is public, timestamped, and waiting for the match to resolve. Rewards and correctness stay hidden until the final result lands.
                </p>
              </div>
            )}

            {r && score && (
              <div className="mt-8 rounded-2xl border border-hairline bg-background p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
                  <div>
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Resolved verdict</h3>
                    <div className="mt-1 font-display text-3xl tracking-tight">{verdict?.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl tracking-tight">+{p.pointsEarned ?? score.total}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      {score.correctCount} of 5 calls
                    </div>
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-hairline">
                  {score.breakdown.map((b) => (
                    <li key={b.label} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${b.ok ? "bg-primary" : "bg-red-card/60"}`} />
                        {b.label}
                      </span>
                      <span className={`font-display text-lg tabular-nums ${b.ok ? "text-foreground" : "text-muted-foreground"}`}>
                        {b.points > 0 ? `+${b.points}` : "0"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-border bg-surface-elevated/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">What is this proof?</span> {fanName} called it before the match moved. No edits, no deleted takes, no after-the-whistle wisdom. The receipt stays public.
            </div>

            <div className="mt-8 rounded-2xl border border-hairline bg-background p-5">
              <h3 className="font-display text-2xl tracking-tight">
                {isOwner ? "Share this proof" : `Think you know ball better than ${fanName}?`}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isOwner
                  ? "Your call is verified and ready to send."
                  : "Lock your own calls before kickoff and let the receipt speak after full time."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/matches" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                Make your own call →
              </Link>
              <a
                href={xShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                Share on X
              </a>
              {hasTxHash && (
                <a
                  href={explorerTxUrl(p.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
                >
                  View on explorer
                </a>
              )}
              <Link to="/profile/$wallet" params={{ wallet: p.wallet }} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                View profile
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function TimelinePoint({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] items-baseline gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 text-right text-foreground">{v}</dd>
    </div>
  );
}

function formatUtc(value: number) {
  return new Date(value).toUTCString().replace("GMT", "UTC");
}

function buildShareText({
  fanName,
  match,
  result,
  prediction,
  score,
  networkLabel,
  url,
}: {
  fanName: string;
  match: Match;
  result: MatchResult | undefined;
  prediction: Prediction;
  score: ReturnType<typeof scorePrediction> | null;
  networkLabel: string;
  url: string;
}) {
  const proofUrl = url || `/proof/${prediction.id}`;

  if (result && score) {
    const resultLine = `${match.home.name} ${result.homeScore}-${result.awayScore} ${match.away.name}`;
    const pointsLine = prediction.claimed ? `+${prediction.pointsEarned ?? score.total} Ball IQ` : `${score.correctCount}/5 calls landed`;
    return [
      `${fanName} knew ball before kickoff.`,
      "",
      resultLine,
      pointsLine,
      `${score.correctCount}/5 calls landed`,
      `verified on ${networkLabel}`,
      "",
      `proof: ${proofUrl}`,
    ].join("\n");
  }

  return [
    `${fanName} locked this call before kickoff.`,
    "",
    `${match.home.name} vs ${match.away.name}`,
    `verified on ${networkLabel}`,
    "",
    `proof: ${proofUrl}`,
  ].join("\n");
}

function verdictForCorrectCount(correctCount: number) {
  if (correctCount >= 5) return { title: "Perfect Slate" };
  if (correctCount === 4) return { title: "Sharp Call" };
  if (correctCount === 3) return { title: "Strong Call" };
  if (correctCount === 2) return { title: "Saw The Shape" };
  if (correctCount === 1) return { title: "Casual Alert" };
  return { title: "Fraud Watch" };
}
