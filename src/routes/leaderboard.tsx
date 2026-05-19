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
      <main className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <header className="mb-12 max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Season 01 · Live
          </span>
          <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            The table doesn't lie.
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Ball IQ is earned for correct calls, scaled by difficulty. Streaks multiply rewards.
            Countries climb when their fans deliver.
          </p>
        </header>
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}