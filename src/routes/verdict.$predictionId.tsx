import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BadgeIcon } from "@/components/site/BadgeIcon";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { BADGES, BADGE_GROUPS } from "@/lib/match-data";
import {
  matchById,
  scorePrediction,
  useStore,
  type CurrentForm,
  type MatchResult,
  type Prediction,
} from "@/lib/store";

export const Route = createFileRoute("/verdict/$predictionId")({
  component: VerdictPage,
});

function VerdictPage() {
  const { predictionId } = Route.useParams();
  const { getPredictionById, getResult, hydratePredictionById, totalBallIq, currentForm } = useStore();
  const prediction = getPredictionById(predictionId);
  const result = prediction ? getResult(prediction.matchId) : undefined;
  const [loading, setLoading] = useState(!prediction);

  useEffect(() => {
    if (prediction) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void hydratePredictionById(predictionId)
      .catch((error) => console.warn("Could not hydrate verdict.", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hydratePredictionById, prediction, predictionId]);

  if (loading) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Verdict</span>
          <h1 className="mt-3 font-display text-5xl tracking-tight">Loading matchday verdict</h1>
        </div>
      </Shell>
    );
  }

  if (!prediction || !result) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Verdict</span>
          <h1 className="mt-3 font-display text-5xl tracking-tight">Verdict not ready.</h1>
          <p className="mt-3 text-muted-foreground">The call exists, but the result or claim memory has not synced yet.</p>
          <Link to="/matches" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Back to matchboard
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <VerdictContent
        prediction={prediction}
        result={result}
        totalBallIq={totalBallIq}
        currentForm={currentForm}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      {children}
      <Footer />
    </div>
  );
}

function VerdictContent({
  prediction,
  result,
  totalBallIq,
  currentForm,
}: {
  prediction: Prediction;
  result: MatchResult;
  totalBallIq: number;
  currentForm: CurrentForm;
}) {
  const match = matchById(prediction.matchId)!;
  const score = scorePrediction(prediction, result);
  const verdict = verdictForCorrectCount(score.correctCount);
  const unlockedBadges = BADGES.filter((badge) => (prediction.badges ?? []).includes(badge.name));
  const categories = Object.entries(BADGE_GROUPS).map(([catName, badgeIds]) => ({
    name: catName,
    badges: unlockedBadges.filter((badge) => badgeIds.includes(badge.id)),
  })).filter((category) => category.badges.length > 0);
  const formText = currentForm.percentage === null
    ? `Building Form: ${currentForm.calls.length}/5 matches calibrated`
    : `${currentForm.percentage}% · ${currentForm.label}`;
  const shareText = `${verdict.title.toLowerCase()}.\n\n${match.home.name} ${result.homeScore}-${result.awayScore} ${match.away.name}\n+${prediction.pointsEarned ?? 0} Ball IQ\nlocked before kickoff on X Layer\n\nproof: ${window.location.origin}/proof/${prediction.id}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-16">
      <Link to="/matches/$matchId" params={{ matchId: prediction.matchId }} className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
        Back to match
      </Link>

      <section className="relative mt-6 overflow-hidden rounded-3xl border border-primary/30 bg-surface p-6 sm:p-10 md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-30" />
        <div className="relative">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">matchday verdict</span>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl text-glow-green">
                {verdict.title}
              </h1>
              <p className="mt-4 max-w-xl text-muted-foreground">{verdict.copy}</p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/5 px-8 py-5 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Ball IQ claimed</div>
              <div className="mt-1 font-display text-5xl tracking-tight text-primary">+{prediction.pointsEarned ?? score.total}</div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-border/40 bg-background/70 p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-display text-2xl tracking-tight">{match.home.name} vs {match.away.name}</span>
              <span className="font-display text-3xl tabular-nums">{result.homeScore}-{result.awayScore}</span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {score.correctCount} of 5 calls landed
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Metric label="New Ball IQ total" value={totalBallIq.toLocaleString()} />
            <Metric label="Current Form" value={formText} />
          </div>

          <div className="mt-5 rounded-2xl border border-border/40 bg-background/55 p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground border-b border-border/40 pb-3">
              field breakdown
            </h2>
            <ul className="mt-2 divide-y divide-border/30">
              {score.breakdown.map((item) => (
                <li key={item.label} className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.ok ? "bg-primary" : "bg-red-card/70"}`} />
                    {item.label}
                  </span>
                  <span className={item.ok ? "text-primary" : "text-muted-foreground"}>
                    {item.points > 0 ? `+${item.points}` : "missed"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {categories.length > 0 ? (
            <div className="mt-8 space-y-6">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground border-b border-border/40 pb-3">
                badges unlocked
              </h2>
              {categories.map((category) => (
                <div key={category.name} className="space-y-3">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary">{category.name}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {category.badges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface-elevated/40 p-3">
                        <BadgeIcon id={badge.id} className="h-8 w-8" />
                        <div>
                          <div className="font-display text-sm font-semibold">{badge.name}</div>
                          <div className="text-[10px] text-muted-foreground">{badge.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-2xl border border-border/40 bg-background/55 p-5 text-sm text-muted-foreground">
              No new badges unlocked. No edits. No hiding. The call stays public.
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3 border-t border-border/40 pt-6">
            <a href={xShareUrl} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
              Share to X
            </a>
            <Link to="/proof/$predictionId" params={{ predictionId: prediction.id }} className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated">
              View proof
            </Link>
            <Link to="/profile/$wallet" params={{ wallet: prediction.wallet }} className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated">
              View profile
            </Link>
            <Link to="/leaderboard" className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated">
              View leaderboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/55 p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl tracking-tight">{value}</div>
    </div>
  );
}

function verdictForCorrectCount(correctCount: number) {
  if (correctCount >= 5) return { title: "PERFECT SLATE", copy: "Every call landed. No edits. No hiding. You knew ball." };
  if (correctCount === 4) return { title: "SHARP CALL", copy: "Four out of five. That is not luck anymore." };
  if (correctCount === 3) return { title: "STRONG CALL", copy: "Three calls landed. The agenda has evidence." };
  if (correctCount === 2) return { title: "SAW THE SHAPE", copy: "You had the idea. The match had other plans." };
  if (correctCount === 1) return { title: "CASUAL ALERT", copy: "One call survived. The rest was pure vibes." };
  return { title: "FRAUD WATCH", copy: "Nothing landed. The group chat has the floor." };
}
