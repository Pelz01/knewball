const items = [
  "SEASON 1 IS LIVE",
  "X LAYER MAINNET",
  "24 FIXTURES SEEDED",
  "CALLS LOCK BEFORE KICKOFF",
  "BALL IQ CLAIMS AFTER RESULT",
  "PUBLIC PROOF RECEIPTS",
  "COUNTRY FORM IS BUILDING",
];

export function LiveTicker() {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border bg-surface/60">
      <div className="flex items-center gap-3 py-2.5">
        <span className="ml-6 flex shrink-0 items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-primary" />
          Live
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-track flex gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {loop.map((t, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="text-foreground/80">{t}</span>
                <span aria-hidden className="text-border">◆</span>
              </span>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, var(--background) 0, transparent 8%, transparent 92%, var(--background) 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
