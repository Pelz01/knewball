import { useEffect, useState } from "react";
import type { Match } from "@/lib/match-data";
import ballImg from "@/assets/ball-macro.jpg";

function useCountdown(iso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(iso).getTime() - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s };
}

const PREDICTIONS = [
  { key: "winner", label: "Match winner", value: "ARG" },
  { key: "score", label: "Correct score", value: "2 — 1" },
  { key: "ou", label: "Over/Under 2.5", value: "Over" },
  { key: "btts", label: "Both teams score", value: "Yes" },
  { key: "first", label: "First to score", value: "ARG" },
] as const;

export function FeaturedMatch({ match }: { match: Match }) {
  const c = useCountdown(match.kickoff);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-surface">
      <img
        src={ballImg}
        alt=""
        loading="lazy"
        width={1280}
        height={1280}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
      <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />

      <div className="relative grid gap-10 p-6 md:grid-cols-[1.2fr_1fr] md:gap-12 md:p-10">
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
              Headline match
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {match.group}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-6">
            <div>
              <div aria-hidden className="text-5xl leading-none">{match.home.flag}</div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {match.home.code}
              </div>
              <div className="font-display text-4xl leading-[0.95] tracking-tight md:text-5xl">
                {match.home.name}
              </div>
            </div>
            <div className="pb-1 text-center">
              <div className="font-display text-2xl text-muted-foreground">vs</div>
            </div>
            <div className="text-right">
              <div aria-hidden className="text-5xl leading-none">{match.away.flag}</div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {match.away.code}
              </div>
              <div className="font-display text-4xl leading-[0.95] tracking-tight md:text-5xl">
                {match.away.name}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-hairline bg-background/60 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Locks at kickoff
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-broadcast">
                X Layer · live
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 text-center">
              {[
                ["Days", pad(c.d)],
                ["Hrs", pad(c.h)],
                ["Min", pad(c.m)],
                ["Sec", pad(c.s)],
              ].map(([label, v]) => (
                <div key={label} className="rounded-xl border border-border bg-surface px-2 py-3">
                  <div className="font-display text-3xl tracking-tightr tabular-nums md:text-4xl">
                    {v}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono uppercase tracking-[0.18em]">{match.venue}</span>
              <span className="font-mono uppercase tracking-[0.18em]">
                <span className="text-foreground">{match.callsLocked.toLocaleString()}</span> calls locked
              </span>
            </div>
          </div>
        </div>

        <aside className="relative flex flex-col rounded-2xl border border-border bg-background/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <span className="font-display text-xl tracking-tight">Your call sheet</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              Draft · unlocked
            </span>
          </div>

          <ul className="my-4 flex flex-col divide-y divide-hairline">
            {PREDICTIONS.map((p) => (
              <li key={p.key} className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span className="font-mono text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                  {p.value}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-auto space-y-2 rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase tracking-[0.22em] text-muted-foreground">
                Estimated Ball IQ
              </span>
              <span className="font-display text-2xl text-gold text-glow-gold">+420</span>
            </div>
            <button
              type="button"
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Lock my call on X Layer
              <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </button>
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Proof minted in ~1.2s · gas sponsored
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}