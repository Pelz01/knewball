import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Leaderboard } from "@/components/site/Leaderboard";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:py-28">
        <header className="mb-12 max-w-3xl sm:mb-16">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Season 01 · Live
          </span>
          <h1 className="mt-3 font-display text-4xl leading-[0.95] tracking-tight sm:mt-4 sm:text-5xl md:text-7xl">
            The table doesn't lie.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:mt-6 md:text-lg">
            Ball IQ is earned for correct calls, scaled by difficulty. Current Form shows who is sharp right now.
            Countries climb when their fans deliver.
          </p>
        </header>
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}
