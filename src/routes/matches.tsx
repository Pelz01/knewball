import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MatchCard } from "@/components/site/MatchCard";
import { LiveTicker } from "@/components/site/LiveTicker";
import { MATCHES } from "@/lib/match-data";

export const Route = createFileRoute("/matches")({
  component: MatchesPage,
});

function MatchesPage() {
  const live = MATCHES.filter((m) => m.status === "live");
  const upcoming = MATCHES.filter((m) => m.status === "upcoming");
  const finals = MATCHES.filter((m) => m.status === "final");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <LiveTicker />
      <main className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <header className="mb-12 max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Matchboard
          </span>
          <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-wide md:text-7xl">
            Every kickoff. Every call.
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Lock your prediction before the whistle. Calls close at kickoff and mint on X Layer.
          </p>
        </header>

        {live.length > 0 && (
          <Section title="Live now" caption={`${live.length} match${live.length > 1 ? "es" : ""}`}>
            <Grid>
              {live.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </Grid>
          </Section>
        )}

        <Section title="Upcoming" caption={`${upcoming.length} to call`}>
          <Grid>
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </Grid>
        </Section>

        {finals.length > 0 && (
          <Section title="Final whistle" caption="Results in">
            <Grid>
              {finals.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </Grid>
          </Section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-3">
        <h2 className="font-display text-3xl tracking-wide md:text-4xl">{title}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {caption}
        </span>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}