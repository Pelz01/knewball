import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MATCHES, type Match } from "@/lib/match-data";

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

type Call = "home" | "draw" | "away";

function MatchDetail() {
  const { match } = Route.useLoaderData();
  const [call, setCall] = useState<Call | null>(null);
  const [scoreH, setScoreH] = useState(1);
  const [scoreA, setScoreA] = useState(1);
  const [locked, setLocked] = useState(false);

  const h = hash(match.id);
  const homePct = 25 + (h % 40);
  const drawPct = 10 + ((h >> 6) % 25);
  const awayPct = Math.max(5, 100 - homePct - drawPct);
  const isLive = match.status === "live";
  const isFinal = match.status === "final";

  const kickoff = new Date(match.kickoff);
  const day = kickoff.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const time = kickoff.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  const callMultiplier: Record<Call, number> = {
    home: +(100 / homePct).toFixed(2),
    draw: +(100 / drawPct).toFixed(2),
    away: +(100 / awayPct).toFixed(2),
  };

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
            <TeamBig team={match.home} align="right" score={match.score?.home} />
            <div className="flex flex-col items-center gap-3">
              {isLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-red-card/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-red-card">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-card" />
                  Live · {match.minute}'
                </span>
              ) : isFinal ? (
                <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Full time
                </span>
              ) : (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                  Kickoff · {time}
                </span>
              )}
              <div className="font-display text-5xl tracking-tight text-muted-foreground md:text-6xl">vs</div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{day}</span>
            </div>
            <TeamBig team={match.away} align="left" score={match.score?.away} />
          </div>
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-8 py-4 md:px-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{match.venue}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="text-primary">{match.callsLocked.toLocaleString()}</span> calls locked · X Layer
            </span>
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Prediction panel */}
          <section className="rounded-3xl border border-border bg-surface p-7 md:p-9">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-display text-2xl tracking-tight md:text-3xl">Lock your call</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {isFinal ? "Calls closed" : "Closes at kickoff"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <CallButton label={match.home.code} sub="Home win" pct={homePct} mult={callMultiplier.home} active={call === "home"} onClick={() => setCall("home")} disabled={isFinal || locked} />
              <CallButton label="X" sub="Draw" pct={drawPct} mult={callMultiplier.draw} active={call === "draw"} onClick={() => setCall("draw")} disabled={isFinal || locked} />
              <CallButton label={match.away.code} sub="Away win" pct={awayPct} mult={callMultiplier.away} active={call === "away"} onClick={() => setCall("away")} disabled={isFinal || locked} />
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Score call · bonus +250 IQ
                </span>
                <span className="font-display text-2xl tabular-nums tracking-tight">
                  {scoreH} – {scoreA}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ScoreStepper label={match.home.code} value={scoreH} onChange={setScoreH} disabled={isFinal || locked} />
                <ScoreStepper label={match.away.code} value={scoreA} onChange={setScoreA} disabled={isFinal || locked} />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {locked
                  ? "Call signed · awaiting kickoff"
                  : call
                    ? `Multiplier ${callMultiplier[call]}× · gas-free on X Layer`
                    : "Pick a side to continue"}
              </div>
              <button
                type="button"
                disabled={!call || isFinal || locked}
                onClick={() => setLocked(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-muted-foreground"
              >
                {locked ? "Call locked ✓" : isFinal ? "Closed" : "Sign & lock call"}
              </button>
            </div>
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
                {match.callsLocked.toLocaleString()} locked · contrarian = bigger payout
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
                0xkb…{match.id.replace("-", "").slice(-6)}c4
              </div>
            </div>
          </aside>
        </div>
      </main>
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
        <span aria-hidden className="text-5xl leading-none md:text-6xl">{team.flag}</span>
      </div>
      {align === "right" && typeof score === "number" && (
        <div className="font-display text-6xl tabular-nums leading-none md:text-7xl">{score}</div>
      )}
    </div>
  );
}

function CallButton({
  label, sub, pct, mult, active, onClick, disabled,
}: { label: string; sub: string; pct: number; mult: number; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-primary bg-primary/10 ring-pitch"
          : "border-border bg-background hover:border-primary/40 hover:bg-surface-elevated"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-display text-2xl tracking-tight">{label}</span>
        <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${active ? "text-primary" : "text-muted-foreground"}`}>
          {mult}×
        </span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-hairline">
        <span style={{ width: `${pct}%` }} className={`block h-full ${active ? "bg-primary" : "bg-muted-foreground/40"}`} />
      </div>
      <div className="mt-1 font-mono text-[10px] text-muted-foreground">{pct}% fans</div>
    </button>
  );
}

function ScoreStepper({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-3">
      <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={disabled || value === 0} onClick={() => onChange(Math.max(0, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition hover:border-primary/40 disabled:opacity-30">−</button>
        <span className="w-6 text-center font-display text-xl tabular-nums">{value}</span>
        <button type="button" disabled={disabled || value === 9} onClick={() => onChange(Math.min(9, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition hover:border-primary/40 disabled:opacity-30">+</button>
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