import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { LiveTicker } from "@/components/site/LiveTicker";
import { Hero } from "@/components/site/Hero";
import { MatchCard } from "@/components/site/MatchCard";
import { FeaturedMatch } from "@/components/site/FeaturedMatch";
import { Leaderboard } from "@/components/site/Leaderboard";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Badges } from "@/components/site/Badges";
import { ProofCard } from "@/components/site/ProofCard";
import { Footer } from "@/components/site/Footer";
import { MATCHES } from "@/lib/match-data";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const featured = MATCHES.find((m) => m.id === "m-001")!;
  const matchGrid = MATCHES.filter((m) => m.id !== "m-001");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LiveTicker />

      <main className="mx-auto max-w-7xl space-y-24 px-6 py-20 md:py-28">
        <section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                01 / Today's call
              </span>
              <h2 className="mt-2 font-display text-4xl tracking-wide md:text-5xl">
                The headline match
              </h2>
            </div>
            <Link
              to="/matches"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
            >
              All matches →
            </Link>
          </div>
          <FeaturedMatch match={featured} />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matchGrid.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>

        <section>
          <HowItWorks />
        </section>

        <section>
          <Badges />
        </section>

        <section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                05 / Reputation
              </span>
              <h2 className="mt-2 font-display text-4xl tracking-wide md:text-5xl">
                Who actually knows ball
              </h2>
            </div>
            <Link
              to="/leaderboard"
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
            >
              Full leaderboard →
            </Link>
          </div>
          <Leaderboard />
        </section>

        <section>
          <ProofCard />
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
          <div className="pointer-events-none absolute -top-1/2 left-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              The final word
            </span>
            <h2 className="mx-auto mt-3 max-w-4xl font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.9] tracking-wide">
              You either know ball,
              <br />
              <span className="text-primary text-glow-green">or you do not.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground md:text-base">
              KnewBall gives fans a way to prove it. Lock your first call before the next
              kickoff.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/matches"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Make today's call →
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                See the table
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
