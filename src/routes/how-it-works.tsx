import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Badges } from "@/components/site/Badges";
import { ProofCard } from "@/components/site/ProofCard";

export const Route = createFileRoute("/how-it-works")({
  component: HowPage,
});

function HowPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl space-y-20 px-6 py-16 md:py-20">
        <header className="max-w-3xl">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            The Game
          </span>
          <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Football reputation, onchain.
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            KnewBall is a streak game, not a betting market. You make calls before kickoff.
            Correct calls earn Ball IQ. Wrong ones break your streak. Everything is verifiable on
            X Layer.
          </p>
        </header>

        <HowItWorks />
        <Badges />
        <ProofCard />

        <section className="rounded-3xl border border-border bg-surface p-10 text-center md:p-14">
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[0.95] tracking-tight md:text-6xl">
            Ready to <span className="text-primary text-glow-green">lock your first call?</span>
          </h2>
          <Link
            to="/matches"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Open the matchboard →
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}