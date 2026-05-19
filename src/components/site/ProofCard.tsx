export function ProofCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface to-background p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-40" />
      <div className="relative grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            04 / Share
          </span>
          <h2 className="mt-2 font-display text-4xl leading-[0.95] tracking-wide md:text-6xl">
            One screenshot.
            <br />
            <span className="text-gold">Whole timeline silent.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm text-muted-foreground md:text-base">
            Every correct call mints a proof card with the match, the prediction, the kickoff
            timestamp and a verifiable X Layer hash. Drop it in the group chat. End the debate.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/10 blur-3xl" />
          <article className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Proof · X Layer
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                0x4a…b91c
              </span>
            </div>

            <div className="px-6 py-7">
              <span className="rounded-full bg-gold/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                Called it · pre-kickoff
              </span>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right">
                  <div aria-hidden className="text-3xl">🇲🇦</div>
                  <div className="font-display text-2xl tracking-wide">Morocco</div>
                </div>
                <div className="font-display text-3xl text-gold">2 — 1</div>
                <div>
                  <div aria-hidden className="text-3xl">🇵🇹</div>
                  <div className="font-display text-2xl tracking-wide">Portugal</div>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-foreground">
                <span className="text-muted-foreground">My call:</span>{" "}
                <span className="font-semibold">Morocco wins · 2-1 · BTTS · Yes</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-px border-t border-hairline bg-border text-center">
              {[
                ["Ball IQ", "+820", "gold"],
                ["Streak", "9 🔥", "white"],
                ["Locked", "T-02:14:08", "white"],
              ].map(([k, v, c]) => (
                <div key={k} className="bg-surface px-3 py-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                    {k}
                  </div>
                  <div
                    className={`mt-1 font-display text-xl tracking-wide ${
                      c === "gold" ? "text-gold" : "text-foreground"
                    }`}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-hairline px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>knewball.xyz/u/atlas.mar</span>
              <span className="text-broadcast">view proof →</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}