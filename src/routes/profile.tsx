import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { BADGES, MATCHES, TEAMS } from "@/lib/match-data";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const STATS = [
  { label: "Ball IQ", value: "6,402", sub: "Season 01" },
  { label: "Streak", value: "9", sub: "longest 14" },
  { label: "Accuracy", value: "71%", sub: "42 of 59 calls" },
  { label: "Country rank", value: "#214", sub: "Argentina · top 1.2%" },
];

const HISTORY = [
  { match: "ARG vs NED", call: "ARG win 2-1", result: "ARG 2-1 NED", correct: true, iq: 320 },
  { match: "FRA vs MAR", call: "Draw 1-1", result: "1-1 67'", correct: null, iq: null },
  { match: "ITA vs CRO", call: "ITA win 2-1", result: "ITA 2-1 CRO", correct: true, iq: 280 },
  { match: "ENG vs USA", call: "ENG win 3-0", result: "ENG 1-1 USA", correct: false, iq: 0 },
  { match: "BRA vs POR", call: "POR win 2-1", result: "POR 2-1 BRA", correct: true, iq: 480 },
];

export default ProfilePage;

function ProfilePage() {
  const earned = BADGES.slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Header card */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background text-4xl">
                {TEAMS.ARG.flag}
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Fan profile</span>
                <h1 className="mt-1 font-display text-4xl leading-[1] tracking-tight md:text-6xl">@elcapitan.eth</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Argentina · joined matchday 1 · wallet 0xkb…c4
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/matches" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                Next call →
              </Link>
              <Link to="/vault" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                Open vault
              </Link>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-hairline bg-background p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.label}</div>
                <div className="mt-2 font-display text-4xl tracking-tight">{s.value}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl border border-border bg-surface p-7">
            <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-3">
              <h2 className="font-display text-2xl tracking-tight md:text-3xl">Call history</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">last 5</span>
            </div>
            <ul className="divide-y divide-hairline">
              {HISTORY.map((h, i) => (
                <li key={i} className="grid grid-cols-[1fr_auto] gap-4 py-4 md:grid-cols-[1.2fr_1.4fr_auto_auto] md:items-center">
                  <div>
                    <div className="font-display text-lg leading-none tracking-tight">{h.match}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Your call · {h.call}</div>
                  </div>
                  <div className="hidden font-mono text-xs text-muted-foreground md:block">{h.result}</div>
                  <span className={`hidden rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] md:inline-flex ${
                    h.correct === true ? "bg-primary/15 text-primary" :
                    h.correct === false ? "bg-red-card/15 text-red-card" :
                    "border border-border text-muted-foreground"
                  }`}>
                    {h.correct === true ? "Correct" : h.correct === false ? "Missed" : "Live"}
                  </span>
                  <div className="text-right font-display text-xl tabular-nums tracking-tight">
                    {h.iq === null ? <span className="text-muted-foreground">—</span> : `+${h.iq}`}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Earned badges</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {earned.map((b) => (
                  <div key={b.id} className="rounded-2xl border border-hairline bg-background p-4">
                    <div className="text-2xl">{b.icon}</div>
                    <div className="mt-2 font-display text-sm leading-tight tracking-tight">{b.name}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{b.rarity}</div>
                  </div>
                ))}
              </div>
              <Link to="/vault" className="mt-4 inline-block font-mono text-[10px] uppercase tracking-[0.22em] text-primary hover:underline">
                View full vault →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Upcoming calls</h3>
              <ul className="mt-4 space-y-3">
                {MATCHES.filter((m) => m.status === "upcoming").slice(0, 3).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-background p-3">
                    <div className="flex items-center gap-2">
                      <span>{m.home.flag}</span>
                      <span className="font-mono text-xs text-foreground">{m.home.code} – {m.away.code}</span>
                      <span>{m.away.flag}</span>
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