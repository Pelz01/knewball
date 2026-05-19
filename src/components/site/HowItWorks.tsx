const STEPS = [
  {
    n: "01",
    title: "Pick a match",
    body: "Browse upcoming World Cup matches. Each card shows kickoff, lock deadline, and the calls already locked.",
  },
  {
    n: "02",
    title: "Make your calls",
    body: "Winner, correct score, over/under, BTTS, first to score. No odds. No betting. Just football reads.",
  },
  {
    n: "03",
    title: "Lock on X Layer",
    body: "Your call is written onchain before kickoff. Gas sponsored. Proof minted in ~1.2 seconds.",
  },
  {
    n: "04",
    title: "Earn Ball IQ",
    body: "When you're right, claim points scaled by difficulty. Climb the table. Save the proof card.",
  },
];

export function HowItWorks() {
  return (
    <div>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            02 / Daily loop
          </span>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Four steps. Before every kickoff.
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          KnewBall isn't a market. It's a streak game built on football culture and verifiable
          history.
        </p>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="group relative bg-surface p-6 transition hover:bg-surface-elevated"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display text-5xl text-primary text-glow-green">{s.n}</span>
              <span aria-hidden className="text-muted-foreground/40 transition group-hover:text-primary">
                →
              </span>
            </div>
            <h3 className="mt-6 font-display text-2xl tracking-tight">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}