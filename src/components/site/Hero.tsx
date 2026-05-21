import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-stadium.jpg";

export function Hero() {
  const heroStats = [
    { label: "Season 1", value: "Live", accent: "green" as const },
    { label: "Calls locked", value: "412,884" },
    { label: "Live fans", value: "58,210" },
    { label: "Countries", value: "48" },
    { label: "Avg. proof time", value: "1.2s", accent: "gold" as const },
  ];
  const statLoop = [...heroStats, ...heroStats];

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

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 md:pb-24 md:pt-12">
        <div className="flex flex-col items-start gap-5 md:gap-8">
          <h1 className="font-display text-[clamp(2.8rem,9vw,6rem)] leading-[0.92] tracking-tight">
            <span className="block">Prove you</span>
            <span className="block">
              <span className="text-primary text-glow-green">knew</span>
              <span className="text-muted-foreground/40"> · </span>
              ball
            </span>
            <span className="block text-white">before kickoff.</span>
          </h1>

          <p className="max-w-xl text-sm text-muted-foreground sm:text-base md:text-lg">
            Lock your World Cup calls onchain. Earn{" "}
            <span className="font-semibold text-gold">Ball IQ</span> when you're right. Build
            streaks. Climb your country. Become the fan who saw it coming.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/matches"
              className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 sm:px-6 sm:py-3.5"
            >
              Start predicting
              <span aria-hidden className="text-base transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated sm:px-6 sm:py-3.5"
            >
              View leaderboard
            </Link>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            football takes, verified onchain.
          </p>

          <div className="relative mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface/75 backdrop-blur-md">
            <dl className="ticker-track flex min-w-max whitespace-nowrap">
              {statLoop.map((stat, index) => (
                <Stat
                  key={`${stat.label}-${index}`}
                  label={stat.label}
                  value={stat.value}
                  accent={stat.accent}
                />
              ))}
            </dl>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, var(--background) 0, transparent 7%, transparent 93%, var(--background) 100%)",
              }}
            />
          </div>
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
    <div className="min-w-[170px] shrink-0 border-r border-hairline bg-surface/90 px-4 py-4 sm:min-w-[210px] sm:px-5 sm:py-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1.5 font-display text-2xl tracking-tight sm:mt-2 sm:text-3xl md:text-4xl ${
          accent === "gold" ? "text-gold" : accent === "green" ? "text-primary text-glow-green" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
