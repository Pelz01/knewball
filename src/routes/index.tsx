import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Leaderboard } from "@/components/site/Leaderboard";
import { HowItWorks } from "@/components/site/HowItWorks";
import { Badges } from "@/components/site/Badges";
import { ProofCard } from "@/components/site/ProofCard";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />

      <main className="mx-auto max-w-7xl space-y-24 px-6 py-20 md:py-28">
        <section>
          <HowItWorks />
        </section>

        <section>
          <Pillars />
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
              <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
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
            <h2 className="mx-auto mt-3 max-w-4xl font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.9] tracking-tight">
              You either know ball,
              <br />
              <span className="text-primary text-glow-green">or you do not.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground md:text-base">
              KnewBall gives fans a way to prove it. Launch the app and lock your first call
              before the next kickoff.
            </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/matches"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Start predicting →
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                View leaderboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

const PILLARS = [
  {
    n: "01",
    title: "Reputation, not betting",
    body: "No odds, no pools, no risk of capital. Your record is your reputation. Wrong calls cost streak, not money.",
  },
  {
    n: "02",
    title: "Proof at kickoff",
    body: "Every call is signed and written to X Layer the moment the whistle blows. No silent edits. No revisionist history.",
  },
  {
    n: "03",
    title: "Country vs country",
    body: "Your Ball IQ feeds your nation's score. Argentina vs Brazil isn't just on the pitch — it's on the leaderboard.",
  },
  {
    n: "04",
    title: "Collect the moments",
    body: "Call the upset, mint the badge. Soulbound collectibles for the calls only real fans would make.",
  },
];

function Pillars() {
  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            03 / What you get
          </span>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Built for fans, not bettors.
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          KnewBall takes football's loudest opinions and gives them an onchain record.
        </p>
      </div>
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.n} className="bg-surface p-8 transition hover:bg-surface-elevated">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                {p.n}
              </span>
              <span aria-hidden className="text-muted-foreground/40">+</span>
            </div>
            <h3 className="mt-5 font-display text-2xl tracking-tight md:text-3xl">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
