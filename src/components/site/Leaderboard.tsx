import { TOP_FANS, COUNTRY_RANKS } from "@/lib/match-data";

export function Leaderboard() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <h3 className="font-display text-2xl tracking-tight">Global Ball IQ — top fans</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Season 01 · live ranking
            </p>
          </div>
          <span className="hidden rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:inline-flex">
            Updated 12s ago
          </span>
        </header>

        <div className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-x-4 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>#</span>
          <span>Fan</span>
          <span className="text-right">Streak</span>
          <span className="text-right">Acc.</span>
          <span className="text-right">Ball IQ</span>
        </div>

        <ul className="divide-y divide-hairline">
          {TOP_FANS.map((f) => (
            <li
              key={f.rank}
              className="grid grid-cols-[40px_1fr_auto_auto_auto] items-center gap-x-4 px-5 py-3.5 transition hover:bg-surface-elevated"
            >
              <span
                className={`font-display text-lg ${
                  f.rank <= 3 ? "text-gold" : "text-muted-foreground"
                }`}
              >
                {String(f.rank).padStart(2, "0")}
              </span>
              <span className="flex items-center gap-3 min-w-0">
                <span aria-hidden className="text-xl leading-none">
                  {f.country.flag}
                </span>
                <span className="truncate font-medium">{f.handle}</span>
              </span>
              <span className="text-right font-mono text-sm tabular-nums">{f.streak}🔥</span>
              <span className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                {f.accuracy}%
              </span>
              <span className="text-right font-display text-xl tracking-tight tabular-nums">
                {f.ballIq.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="border-b border-hairline px-5 py-4">
          <h3 className="font-display text-2xl tracking-tight">Country rankings</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Average Ball IQ per country
          </p>
        </header>
        <ul className="divide-y divide-hairline">
          {COUNTRY_RANKS.map((c) => {
            const pct = Math.round((c.avgIq / 6500) * 100);
            return (
              <li key={c.rank} className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-muted-foreground tabular-nums w-7">
                    {String(c.rank).padStart(2, "0")}
                  </span>
                  <span aria-hidden className="text-xl">{c.country.flag}</span>
                  <span className="font-display text-xl tracking-tight">{c.country.name}</span>
                  <span className="ml-auto font-display text-xl text-gold tabular-nums">
                    {c.avgIq.toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {c.fans.toLocaleString()} fans
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}