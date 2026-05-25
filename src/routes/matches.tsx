import { createFileRoute, Link, Outlet, useMatchRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MatchCard } from "@/components/site/MatchCard";
import { LiveTicker } from "@/components/site/LiveTicker";
import { MATCHES, WORLD_CUP_TEAMS } from "@/lib/match-data";
import { useStore, matchById, shortAddress } from "@/lib/store";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const [tab, setTab] = useState<"live" | "past">("live");
  const [showHelp, setShowHelp] = useState(false);
  const { wallet, profile, profileHydrating, totalBallIq, unclaimed, predictions, claimPrediction, createProfile, currentForm } = useStore();
  const matchRoute = useMatchRoute();
  const router = useRouter();
  const childMatch = matchRoute({ to: "/matches/$matchId", fuzzy: true });

  if (childMatch) return <Outlet />;

  const live = MATCHES.filter((m) => m.status === "live");
  const upcoming = MATCHES.filter((m) => m.status === "upcoming");
  const finals = MATCHES.filter((m) => m.status === "final");

  const callsLocked = MATCHES.reduce((s, m) => s + m.callsLocked, 0);
  const ballIqClaimed = predictions.reduce((s, p) => s + (p.pointsEarned ?? 0), 0) + 42_900;

  if (wallet && !profile && profileHydrating) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <LiveTicker />
        <main className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Wallet connected · {shortAddress(wallet)}
          </span>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Loading your fan profile</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Checking Supabase for your saved KnewBall identity.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (wallet && !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <LiveTicker />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 md:py-14">
          <ProfileSetupPanel wallet={wallet} onCreate={createProfile} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <LiveTicker />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
          <section className="grid gap-6 lg:grid-cols-[1fr_520px] lg:items-start">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Matchboard</span>
              <h1 className="mt-2 max-w-4xl font-display text-3xl leading-[0.95] tracking-tight sm:text-4xl md:text-5xl">
                Browse open World Cup calls.
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Connect only when you are ready to lock one.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("knewball:connect"))}
                  className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  Connect wallet
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
                >
                  How to play
                </button>
                <Link to="/leaderboard" className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                  View leaderboard
                </Link>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              <Stat label="Calls locked" value={callsLocked.toLocaleString()} />
              <Stat label="Ball IQ claimed" value={ballIqClaimed.toLocaleString()} compact />
              <Stat label="Countries ranked" value="48" accent />
              <Stat label="Open matches" value={(live.length + upcoming.length).toString()} compact />
            </dl>
          </section>

          <section id="preview-matches" className="mt-20 sm:mt-24">
            <div className="mb-5">
              <h2 className="font-display text-3xl tracking-tight">Browse the matchboard</h2>
            </div>
            <div className="mb-6 flex items-center gap-2 border-b border-hairline">
              <Tab active={tab === "live"} onClick={() => setTab("live")}>
                Live &amp; Upcoming
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">{live.length + upcoming.length}</span>
              </Tab>
              <Tab active={tab === "past"} onClick={() => setTab("past")}>
                Past Arenas
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">{finals.length}</span>
              </Tab>
            </div>
            {tab === "live" ? (
              <>
                {live.length > 0 && (
                  <Section>
                    <Grid>{live.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
                  </Section>
                )}
                <Section>
                  <Grid>{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
                </Section>
              </>
            ) : (
              <Section>
                <Grid>{finals.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
              </Section>
            )}
          </section>
        </main>
        <Footer />

        {/* How to play modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-30" />
              <div className="relative">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <h2 className="font-display text-2xl tracking-tight">How to play KnewBall</h2>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                  <div className="flex gap-4">
                    <span className="font-display text-lg text-primary">1.</span>
                    <div>
                      <h3 className="font-semibold text-foreground">Pick a match</h3>
                      <p className="mt-1">Choose any upcoming World Cup match before kickoff.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="font-display text-lg text-primary">2.</span>
                    <div>
                      <h3 className="font-semibold text-foreground">Make your call</h3>
                      <p className="mt-1">Predict the winner, score, total goals, both teams to score, and first team to score.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="font-display text-lg text-primary">3.</span>
                    <div>
                      <h3 className="font-semibold text-foreground">Lock on X Layer</h3>
                      <p className="mt-1">Once locked, your call is written onchain and cannot be edited or faked.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className="font-display text-lg text-primary">4.</span>
                    <div>
                      <h3 className="font-semibold text-foreground">Claim Ball IQ</h3>
                      <p className="mt-1">When resolved, claim points for correct parts of your call and unlock rare badges.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowHelp(false);
                    window.dispatchEvent(new CustomEvent("knewball:connect"));
                  }}
                  className="mt-6 w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition hover:brightness-110"
                >
                  Connect wallet to start
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isDashboard = !!profile;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <LiveTicker />
      <main className={`mx-auto max-w-7xl px-4 sm:px-6 ${isDashboard ? "py-10 sm:py-14 md:py-16" : "py-16 sm:py-20 md:py-24 lg:py-28"}`}>
        <header className={`${isDashboard ? "max-w-4xl" : "max-w-3xl"} space-y-3 sm:space-y-4`}>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              {isDashboard ? `Welcome back, ${profile.displayName}` : "Matchboard"}
            </span>
            <h1 className={`mt-2 font-display leading-[0.95] tracking-tight ${isDashboard ? "text-3xl sm:text-4xl md:text-5xl" : "text-4xl sm:text-5xl md:text-7xl"}`}>
              {isDashboard ? "Matchboard" : "Make your call before kickoff."}
            </h1>
          </div>
          <p className={`text-muted-foreground leading-relaxed ${isDashboard ? "text-base" : "md:text-lg"}`}>
            {isDashboard
              ? "Make your calls, claim Ball IQ, and climb the table."
              : "Lock World Cup predictions on X Layer and prove you knew ball when the result lands."}
          </p>
        </header>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:mt-10 md:mt-12 md:grid-cols-4">
          {isDashboard ? (
            <>
              <Stat label="Ball IQ" value={totalBallIq.toLocaleString()} />
              <Stat label="Global rank" value={totalBallIq > 0 ? "#42" : "Unranked"} compact />
              <Stat label="Country rank" value={totalBallIq > 0 ? "#7" : "Pending"} compact />
              <Stat label="Current Form" value={formatFormValue(currentForm)} sub={formatLastFive(currentForm.calls)} accent />
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
          <section className="mt-16 sm:mt-20">
            <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-4">
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Claim available</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                {unclaimed.length} ready
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {unclaimed.map((p) => {
                const m = matchById(p.matchId)!;
                return (
                  <article key={p.id} className="ring-pitch relative overflow-hidden rounded-2xl border border-primary/40 bg-surface p-6 sm:p-8">
                    <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
                    <div className="relative">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Result in</span>
                      <h3 className="mt-1.5 font-display text-3xl tracking-tight">{m.home.name} vs {m.away.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Your call is waiting. Claim Ball IQ to lock it into your profile.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          void claimPrediction(p.id)
                            .then((claimedPrediction) => router.navigate({
                              to: "/verdict/$predictionId",
                              params: { predictionId: claimedPrediction?.id ?? p.id },
                            }))
                            .catch((error) => {
                              console.warn("Could not claim Ball IQ from matchboard.", error);
                            });
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 cursor-pointer"
                      >
                        Claim Ball IQ →
                      </button>
                      <Link to="/matches/$matchId" params={{ matchId: m.id }} className="ml-4 inline-flex font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
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
        <div className={`${isDashboard ? "mt-14" : "mt-20 md:mt-24"} mb-10 flex items-center gap-4 border-b border-hairline`}>
          <Tab active={tab === "live"} onClick={() => setTab("live")}>
            Live &amp; Upcoming
            <span className="ml-2.5 font-mono text-[10px] text-muted-foreground">{live.length + upcoming.length}</span>
          </Tab>
          <Tab active={tab === "past"} onClick={() => setTab("past")}>
            Past Arenas
            <span className="ml-2.5 font-mono text-[10px] text-muted-foreground">{finals.length}</span>
          </Tab>
          {import.meta.env.DEV && (
            <Link
              to="/admin/results"
              className="ml-auto rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          )}
        </div>

        {tab === "live" ? (
          <>
            {live.length === 0 && upcoming.length === 0 ? (
              <EmptyLive />
            ) : (
              <>
                {live.length > 0 && (
                  <Section>
                    <Grid>{live.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
                  </Section>
                )}
                <Section>
                  <Grid>{upcoming.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
                </Section>
              </>
            )}
          </>
        ) : (
          <Section>
            <Grid>{finals.map((m) => <MatchCard key={m.id} match={m} />)}</Grid>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value, accent, compact, sub }: { label: string; value: string; accent?: boolean; compact?: boolean; sub?: string }) {
  return (
    <div className="bg-surface/90 px-4 py-4 sm:px-5 sm:py-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className={`mt-1.5 font-display tracking-tight sm:mt-2 ${compact ? "text-xl sm:text-2xl md:text-3xl" : "text-2xl sm:text-3xl md:text-4xl"} ${accent ? "text-gold" : "text-foreground"}`}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}

function formatFormValue(form: { label: string; percentage: number | null }) {
  return form.percentage === null ? form.label : `${form.percentage}%`;
}

function formatLastFive(calls: number[]) {
  return calls.length ? calls.map((call) => `${call}/5`).join(", ") : "No claims yet";
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

function Section({ title, caption, children }: { title?: string; caption?: string; children: React.ReactNode }) {
  return (
    <section className="mb-16 sm:mb-20">
      {(title || caption) && (
        <div className="mb-8 flex items-baseline justify-between">
          {title && <h2 className="font-display text-2xl tracking-tight md:text-3xl">{title}</h2>}
          {caption && <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{caption}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function ProfileSetupPanel({
  wallet,
  onCreate,
}: {
  wallet: string;
  onCreate: (p: { displayName: string; country: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("ARG");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-start lg:gap-16">
      <div className="pt-2 space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Wallet connected · {shortAddress(wallet)}
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-6xl">
            Create your fan profile
          </h1>
        </div>
        <p className="max-w-xl text-muted-foreground leading-relaxed md:text-lg">
          Choose your display name and the country you support so your Ball IQ, badges, and call history can be tracked.
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setPending(true);
          setError(null);
          try {
            await onCreate({ displayName: name.trim(), country });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Profile creation failed.");
          } finally {
            setPending(false);
          }
        }}
        className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 md:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
        <div className="relative space-y-6 sm:space-y-8">
          <Field label="Display name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="pelz0x"
              className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary transition"
            />
          </Field>
          <Field label="Country">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground outline-none focus:border-primary transition"
            >
              {WORLD_CUP_TEAMS.map((t) => (
                <option key={t.code} value={t.code}>{t.flag} {t.name}</option>
              ))}
            </select>
          </Field>
          <button
            type="submit"
            disabled={!name.trim() || pending}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:bg-surface-elevated disabled:text-muted-foreground"
          >
            {pending ? "Creating..." : "Create profile"}
          </button>
          {error && (
            <p className="rounded-xl border border-red-card/30 bg-red-card/10 p-3 text-xs text-red-card">
              {error}
            </p>
          )}
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
