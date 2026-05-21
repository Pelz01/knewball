const STEPS = [
  {
    n: "01",
    title: "Pick a match",
    body: "Browse upcoming World Cup matches. Each card shows kickoff, lock deadline, and the calls already locked.",
  },
  {
    n: "02",
    title: "Make your calls",
    body: "Predict the winner, correct score, over/under goals, BTTS, and first team to score.",
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
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-10">
        <div>
          <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl md:text-5xl">
            Four steps. Before every kickoff.
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          A streak game built on football culture, sharp calls, and verifiable history.
        </p>
      </div>

      <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="group relative bg-surface p-5 transition hover:bg-surface-elevated sm:p-6"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display text-4xl text-primary text-glow-green sm:text-5xl">{s.n}</span>
              <span aria-hidden className="text-muted-foreground/40 transition group-hover:text-primary">
                →
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl tracking-tight sm:mt-6 sm:text-2xl">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
