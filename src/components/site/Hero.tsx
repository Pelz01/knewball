import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-stadium.jpg";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
        style={{
          maskImage:
            "radial-gradient(120% 80% at 70% 30%, #000 35%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(120% 80% at 70% 30%, #000 35%, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
      <div className="pointer-events-none absolute inset-0 bg-scanline" />

      <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-20 md:pt-14 md:pb-28">
        <div className="flex flex-col items-start gap-6 md:gap-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              World Cup · Season 01
            </span>
            <span className="rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Onchain on X Layer
            </span>
          </div>

          <h1 className="font-display text-[clamp(2.4rem,7vw,6rem)] leading-[0.92] tracking-tight">
            <span className="block">Prove you</span>
            <span className="block">
              <span className="text-primary text-glow-green">knew</span>
              <span className="text-muted-foreground/40"> · </span>
              ball
            </span>
            <span className="block text-muted-foreground/70">before kickoff.</span>
          </h1>

          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Lock your World Cup calls onchain. Earn{" "}
            <span className="font-semibold text-gold">Ball IQ</span> when you're right. Build
            streaks. Climb your country. Become the fan who saw it coming.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/matches"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Start predicting
              <span aria-hidden className="text-base transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
            >
              View leaderboard
            </Link>
          </div>

          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            football takes, verified onchain.
          </p>

          <dl className="mt-6 grid w-full grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:max-w-3xl md:grid-cols-4">
            <Stat label="Calls locked" value="412,884" />
            <Stat label="Live fans" value="58,210" />
            <Stat label="Countries" value="48" />
            <Stat label="Avg. proof time" value="1.2s" accent="gold" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "gold" | "green";
}) {
  return (
    <div className="bg-surface/90 px-5 py-5 backdrop-blur-md">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 font-display text-3xl tracking-tight md:text-4xl ${
          accent === "gold" ? "text-gold" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}