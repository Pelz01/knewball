import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MatchCard } from "@/components/site/MatchCard";
import { LiveTicker } from "@/components/site/LiveTicker";
import { MATCHES, TEAMS } from "@/lib/match-data";
import { useStore, matchById, shortAddress } from "@/lib/store";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const [tab, setTab] = useState<"live" | "past">("live");
  const { wallet, profile, totalBallIq, unclaimed, predictions, claimPrediction, createProfile } = useStore();
  const matchRoute = useMatchRoute();
  const childMatch = matchRoute({ to: "/matches/$matchId", fuzzy: true });

  if (childMatch) return <Outlet />;

  const live = MATCHES.filter((m) => m.status === "live");
  const upcoming = MATCHES.filter((m) => m.status === "upcoming");
  const finals = MATCHES.filter((m) => m.status === "final");

  const callsLocked = MATCHES.reduce((s, m) => s + m.callsLocked, 0);
  const ballIqClaimed = predictions.reduce((s, p) => s + (p.pointsEarned ?? 0), 0) + 42_900;

  if (wallet && !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <LiveTicker />
        <main className="mx-auto max-w-5xl px-6 py-10 md:py-14">
          <ProfileSetupPanel wallet={wallet} onCreate={createProfile} />
        </main>
        <Footer />
      </div>
    );
  }

  const isDashboard = !!profile;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <LiveTicker />
      <main className={`mx-auto max-w-7xl px-6 ${isDashboard ? "py-8 md:py-10" : "py-12 md:py-16"}`}>
        <header className={isDashboard ? "max-w-4xl" : "max-w-3xl"}>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            {isDashboard ? `Welcome back, ${profile.displayName}` : "Matchboard"}
          </span>
          <h1 className={`mt-2 font-display leading-[0.95] tracking-tight ${isDashboard ? "text-4xl md:text-5xl" : "text-5xl md:text-7xl"}`}>
            {isDashboard ? "Matchboard" : "Make your call before kickoff."}
          </h1>
          <p className={`mt-4 text-muted-foreground ${isDashboard ? "text-base" : "md:text-lg"}`}>
            {isDashboard
              ? "Make your calls, claim Ball IQ, and climb the table."
              : "Lock World Cup predictions on X Layer and prove you knew ball when the result lands."}
          </p>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
          {isDashboard ? (
            <>
              <Stat label="Ball IQ" value={totalBallIq.toLocaleString()} />
              <Stat label="Global rank" value={totalBallIq > 0 ? "#42" : "Unranked"} />
              <Stat label="Country rank" value={totalBallIq > 0 ? "#7" : "Pending"} />
              <Stat label="Current streak" value={currentStreak(predictions).toString()} accent />
            </>
          ) : (
            <>
              <Stat label="Calls locked" value={callsLocked.toLocaleString()} />
              <Stat label="Ball IQ claimed" value={ballIqClaimed.toLocaleString()} />
              <Stat label="Active fans" value="58,210" />
              <Stat label="Countries ranked" value="48" accent />
            </>
          )}
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
        <div className={`${isDashboard ? "mt-8" : "mt-14"} mb-6 flex items-center gap-2 border-b border-hairline`}>
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

function ProfileSetupPanel({
  wallet,
  onCreate,
}: {
  wallet: string;
  onCreate: (p: { displayName: string; country: string; favoriteTeam: string }) => void;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("ARG");
  const [team, setTeam] = useState("BRA");
  const teamOptions = Object.values(TEAMS);

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
      <div className="pt-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
          Wallet connected · {shortAddress(wallet)}
        </span>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">
          Create your fan profile
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground md:text-lg">
          Choose your name, country, and team so your Ball IQ, badges, and call history can be tracked.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate({ displayName: name.trim(), country, favoriteTeam: team });
        }}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
        <div className="relative space-y-4">
          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="@pelz0x"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </Field>
          <Field label="Country">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {teamOptions.map((t) => (
                <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Favorite team">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {teamOptions.map((t) => (
                <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:bg-surface-elevated disabled:text-muted-foreground"
          >
            Create profile
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function currentStreak(predictions: { claimed: boolean; pointsEarned?: number }[]) {
  return predictions.filter((p) => p.claimed && (p.pointsEarned ?? 0) > 0).length;
}
