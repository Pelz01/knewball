import { TOP_FANS, COUNTRY_RANKS } from "@/lib/match-data";
import { Flag } from "./Flag";
import { Flame } from "lucide-react";

export function Leaderboard() {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      {/* Global fans table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-hairline px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <h3 className="font-display text-xl tracking-tight sm:text-2xl">Global Ball IQ — top fans</h3>
            <p className="mt-1 font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
              Season 01 · live ranking
            </p>
          </div>
          <span className="hidden rounded-full border border-border px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-muted-foreground sm:inline-flex">
            Updated 12s ago
          </span>
        </header>

        {/* Column headers — hide Streak + Acc on mobile */}
        <div className="grid grid-cols-[36px_1fr_auto_auto_auto] items-center gap-x-3 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:grid-cols-[40px_1fr_auto_auto_auto] sm:gap-x-4 sm:px-5 sm:py-3">
          <span>#</span>
          <span>Fan</span>
          <span className="hidden text-right sm:block">Streak</span>
          <span className="hidden text-right sm:block">Acc.</span>
          <span className="text-right">Ball IQ</span>
        </div>

        <ul className="divide-y divide-hairline">
          {TOP_FANS.map((f) => (
            <li
              key={f.rank}
              className="grid grid-cols-[36px_1fr_auto_auto_auto] items-center gap-x-3 px-4 py-3 transition hover:bg-surface-elevated sm:grid-cols-[40px_1fr_auto_auto_auto] sm:gap-x-4 sm:px-5 sm:py-3.5"
            >
              <span
                className={`font-display text-base sm:text-lg ${
                  f.rank <= 3 ? "text-gold" : "text-muted-foreground"
                }`}
              >
                {String(f.rank).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Flag team={f.country} className="h-4 w-5 shrink-0 rounded-sm border border-border/20 sm:w-6" />
                <span className="truncate text-sm font-medium sm:text-base">{f.handle}</span>
              </span>
              <span className="hidden items-center justify-end gap-1 font-mono text-sm tabular-nums sm:inline-flex">
                {f.streak} <Flame className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="hidden text-right font-mono text-sm tabular-nums text-muted-foreground sm:block">
                {f.accuracy}%
              </span>
              <span className="text-right font-display text-lg tracking-tight tabular-nums sm:text-xl">
                {f.ballIq.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Country form table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="border-b border-hairline px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="font-display text-xl tracking-tight sm:text-2xl">Country Form</h3>
          <p className="mt-1 font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
            Ball IQ per active fan · fair across nation size
          </p>
        </header>
        <ul className="divide-y divide-hairline">
          {COUNTRY_RANKS.map((c) => {
            const pct = Math.round((c.avgIq / 6500) * 100);
            return (
              <li key={c.rank} className="px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-6 font-display text-base text-muted-foreground tabular-nums sm:w-7 sm:text-lg">
                    {String(c.rank).padStart(2, "0")}
                  </span>
                  <Flag team={c.country} className="h-4 w-6 rounded-sm border border-border/20 sm:h-5 sm:w-7" />
                  <span className="font-display text-lg tracking-tight sm:text-xl">{c.country.name}</span>
                  <span className="ml-auto font-display text-lg text-gold tabular-nums sm:text-xl">
                    {c.avgIq.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-background sm:mt-3">
                  <div
                    className="h-full rounded-full bg-primary"
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