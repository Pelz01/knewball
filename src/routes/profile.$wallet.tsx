import { createFileRoute, Link } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { BADGES, MATCHES, TEAMS, TOP_FANS, type Team } from "@/lib/match-data";
import { Flag } from "@/components/site/Flag";
import { useStore, shortAddress, matchById, describePrediction } from "@/lib/store";
import { BadgeIcon } from "@/components/site/BadgeIcon";

export const Route = createFileRoute("/profile/$wallet")({
  component: ProfileByWallet,
});

function ProfileByWallet() {
  const { wallet: pageWallet } = Route.useParams();
  const { wallet, profile, predictions, results, totalBallIq, currentStreak } = useStore();
  const pageWalletLower = pageWallet?.toLowerCase() || "";
  const isMe = !!(wallet && pageWallet && wallet.toLowerCase() === pageWalletLower);

  // Public-facing profile: own profile when connected, otherwise show a
  // seeded fan persona so shared profile links never look empty.
  const persona = !isMe ? (TOP_FANS.find((f) => pageWalletLower.length >= 6 && f.handle.toLowerCase().includes(pageWalletLower.slice(2, 6))) ?? TOP_FANS[0]) : null;

  const displayName = isMe ? profile?.displayName ?? "fan.knewball" : persona!.handle;
  const country: Team = isMe
    ? (Object.values(TEAMS).find((t) => t.code === profile?.country) ?? TEAMS.ARG)
    : persona!.country;

  const myPreds = predictions.filter((p) => p.wallet && p.wallet.toLowerCase() === pageWalletLower);
  const ballIq = isMe
    ? totalBallIq
    : persona!.ballIq;
  const correct = myPreds.filter((p) => p.claimed && (p.pointsEarned ?? 0) > 0).length;
  const total = myPreds.length;
  const accuracy = total ? Math.round((correct / total) * 100) : isMe ? 0 : persona!.accuracy;
  const streak = isMe ? currentStreak : persona!.streak;
  const earnedBadges = Array.from(new Set(myPreds.flatMap((p) => p.badges || (p.badge ? [p.badge] : [])).filter(Boolean))) as string[];

  const stats = [
    { label: "Ball IQ", value: ballIq.toLocaleString(), sub: "Season 01" },
    { label: "Streak", value: streak, sub: "current" },
    { label: "Accuracy", value: `${accuracy}%`, sub: total ? `${correct} of ${total}` : "no calls yet" },
    { label: "Country", value: country.code, sub: country.name },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-14 lg:py-16">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-5 sm:p-8 md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background overflow-hidden p-2">
                <Flag team={country} className="h-full w-full rounded" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  Fan profile {isMe && "· you"}
                </span>
                <h1 className="mt-1 font-display text-3xl leading-[1] tracking-tight sm:text-4xl md:text-6xl">{displayName}</h1>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {country.name} · wallet {pageWallet ? shortAddress(pageWallet) : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/matches" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                {isMe ? "Next call →" : "Make your own call →"}
              </Link>
              <Link to="/leaderboard" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                View leaderboard
              </Link>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-hairline bg-background p-4 sm:p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.label}</div>
                <div className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{s.value}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-5 sm:mt-10 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
            <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-3">
              <h2 className="font-display text-2xl tracking-tight md:text-3xl">Call history</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {myPreds.length} locked
              </span>
            </div>

            {myPreds.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-8 text-center">
                <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-20" />
                <div className="relative flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border text-primary mb-4">
                    <Gamepad2 className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-2xl tracking-tight text-foreground">No calls locked yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Kick off your prediction record, earn Ball IQ points, and build your profile by predicting upcoming matches.
                  </p>
                  
                  <div className="mt-6 w-full max-w-md rounded-xl border border-hairline bg-surface p-4 text-left">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-primary">How it works</span>
                    <ol className="mt-2 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
                      <li>Pick any upcoming match fixture.</li>
                      <li>Predict the winner, correct score, goals, and more.</li>
                      <li>Lock your call on X Layer (gasless transaction).</li>
                      <li>Climb the leaderboard when results settle!</li>
                    </ol>
                  </div>
                  
                  <Link to="/matches" className="mt-6 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                    Make your first call
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {myPreds.slice().reverse().map((p) => {
                  const m = matchById(p.matchId);
                  const r = results[p.matchId];
                  if (!m) return null;
                  const status = !r ? "Locked" : p.claimed ? ((p.pointsEarned ?? 0) > 0 ? "Correct" : "Missed") : "Claim";
                  const tone = status === "Correct" ? "bg-primary/15 text-primary" : status === "Missed" ? "bg-red-card/15 text-red-card" : "border border-border text-muted-foreground";
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <div className="font-display text-lg leading-none tracking-tight">{m.home.code} vs {m.away.code}</div>
                        <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {describePrediction(p, m)[0]} · {describePrediction(p, m)[1]}
                        </div>
                      </div>
                      <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] sm:inline-flex ${tone}`}>
                        {status}
                      </span>
                      <div className="w-20 text-right font-display text-xl tabular-nums tracking-tight">
                        {p.claimed ? `+${p.pointsEarned}` : <span className="text-muted-foreground">—</span>}
                      </div>
                      <Link to="/proof/$predictionId" params={{ predictionId: p.id }} className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary hover:underline">
                        Proof →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Earned badges</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {BADGES.map((b) => {
                  const hasBadge = earnedBadges.some((eb) => eb.toLowerCase() === b.name.toLowerCase() || eb.toLowerCase() === b.id.toLowerCase());
                  return (
                    <div 
                      key={b.id} 
                      className={`relative overflow-hidden rounded-2xl border p-4 transition duration-300 ${
                        hasBadge 
                          ? "border-primary bg-primary/5 shadow-[0_0_12px_rgba(25,227,111,0.08)]" 
                          : "border-border bg-background/50 opacity-40 hover:opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center ${hasBadge ? "" : "opacity-50"}`}>
                          <BadgeIcon id={b.id} className="h-5 w-5" />
                        </div>
                        {!hasBadge && (
                          <span className="font-sans text-[8px] font-bold uppercase tracking-wider text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
                            Locked
                          </span>
                        )}
                      </div>
                      <div className={`mt-2 font-display text-sm leading-tight tracking-tight ${hasBadge ? "text-foreground" : "text-muted-foreground"}`}>
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

            <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Open calls available</h3>
              <ul className="mt-4 space-y-3">
                {MATCHES.filter((m) => m.status === "upcoming").slice(0, 3).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-background p-3">
                    <div className="flex items-center gap-2">
                      <Flag team={m.home} className="h-4 w-6 rounded-sm border border-border/20" />
                      <span className="font-mono text-xs text-foreground">{m.home.code} – {m.away.code}</span>
                      <Flag team={m.away} className="h-4 w-6 rounded-sm border border-border/20" />
                    </div>
                    <Link to="/matches/$matchId" params={{ matchId: m.id }} className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary hover:underline">
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