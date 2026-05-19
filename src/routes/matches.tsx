import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MatchCard } from "@/components/site/MatchCard";
import { LiveTicker } from "@/components/site/LiveTicker";
import { MATCHES } from "@/lib/match-data";
import { useStore, matchById } from "@/lib/store";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const [tab, setTab] = useState<"live" | "past">("live");
  const { unclaimed, predictions, claimPrediction } = useStore();

  const live = MATCHES.filter((m) => m.status === "live");
  const upcoming = MATCHES.filter((m) => m.status === "upcoming");
  const finals = MATCHES.filter((m) => m.status === "final");

  const callsLocked = MATCHES.reduce((s, m) => s + m.callsLocked, 0);
  const ballIqClaimed = predictions.reduce((s, p) => s + (p.pointsEarned ?? 0), 0) + 42_900;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <LiveTicker />
      <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <header className="max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Matchboard</span>
          <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Make your call before kickoff.
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Lock World Cup predictions on X Layer and prove you knew ball when the result lands.
          </p>
        </header>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          <Stat label="Calls locked" value={callsLocked.toLocaleString()} />
          <Stat label="Ball IQ claimed" value={ballIqClaimed.toLocaleString()} />
          <Stat label="Active fans" value="58,210" />
          <Stat label="Countries ranked" value="48" accent />
        </dl>

        {/* Claim available */}
        {unclaimed.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-baseline justify-between border-b border-hairline pb-3">
              <h2 className="font-display text-3xl tracking-tight md:text-4xl">Claim available</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                {unclaimed.length} ready
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {unclaimed.map((p) => {
                const m = matchById(p.matchId)!;
                return (
                  <article key={p.id} className="ring-pitch relative overflow-hidden rounded-2xl border border-primary/40 bg-surface p-6">
                    <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
                    <div className="relative">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Result in</span>
                      <h3 className="mt-1 font-display text-3xl tracking-tight">{m.home.name} vs {m.away.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Your call is waiting. Claim Ball IQ to lock it into your profile.
                      </p>
                      <button
                        type="button"
                        onClick={() => claimPrediction(p.id)}
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
                      >
                        Claim Ball IQ →
                      </button>
                      <Link to="/matches/$matchId" params={{ matchId: m.id }} className="ml-2 inline-flex font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
                        Open match →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="mt-14 mb-6 flex items-center gap-2 border-b border-hairline">
          <Tab active={tab === "live"} onClick={() => setTab("live")}>
            Live &amp; Upcoming
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">{live.length + upcoming.length}</span>
          </Tab>
          <Tab active={tab === "past"} onClick={() => setTab("past")}>
            Past Arenas
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">{finals.length}</span>
          </Tab>
          <Link
            to="/admin"
            className="ml-auto rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
          >
            Admin
          </Link>
        </div>

        {tab === "live" ? (
          <>
            {live.length === 0 && upcoming.length === 0 ? (
              <EmptyLive />
            ) : (
              <>
                {live.length > 0 && (
                  <Section title="Live now" caption={`${live.length} in progress`}>
                    <Grid>{live.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
                  </Section>
                )}
                <Section title="Open for calls" caption={`${upcoming.length} to call`}>
                  <Grid>{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
                </Section>
              </>
            )}
          </>
        ) : (
          <Section title="Past arenas" caption={`${finals.length} resolved`}>
            <Grid>{finals.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface/90 px-5 py-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl tracking-tight md:text-4xl ${accent ? "text-gold" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-3 font-display text-sm tracking-tight transition md:text-base ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyLive() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-10 text-center">
      <p className="font-display text-3xl tracking-tight">No open matches right now</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Check Past Arenas to review resolved calls, or see who's leading the country table.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/leaderboard" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-elevated">
          View leaderboard
        </Link>
      </div>
    </div>
  );
}

function Section({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-2xl tracking-tight md:text-3xl">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{caption}</span>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}