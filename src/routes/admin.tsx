import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { MATCHES } from "@/lib/match-data";
import { useStore } from "@/lib/store";
import { Flag } from "@/components/site/Flag";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const { results, resolveMatch, predictions } = useStore();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Admin · demo</span>
          <h1 className="mt-2 font-display text-5xl tracking-tight md:text-6xl">Resolve matches</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Seed a result for any fixture. As soon as you resolve, fans who locked a call before kickoff
            can claim their Ball IQ.
          </p>
        </header>

        <ul className="space-y-4">
          {MATCHES.map((m) => {
            const r = results[m.id];
            const claimsAvailable = predictions.filter((p) => p.matchId === m.id && !p.claimed).length;
            return (
              <li key={m.id} className="rounded-2xl border border-border bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Flag team={m.home} className="h-6 w-9 rounded border border-border/20" />
                    <div>
                      <div className="font-display text-2xl tracking-tight">
                        {m.home.name} vs {m.away.name}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                        {m.group} · {new Date(m.kickoff).toLocaleString()}
                      </div>
                    </div>
                    <Flag team={m.away} className="h-6 w-9 rounded border border-border/20" />
                  </div>
                  {r ? (
                    <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                      Resolved · {r.homeScore}-{r.awayScore}
                    </span>
                  ) : (
                    <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Awaiting result
                    </span>
                  )}
                </div>
                {claimsAvailable > 0 && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
                    {claimsAvailable} call{claimsAvailable === 1 ? "" : "s"} waiting to be claimed
                  </p>
                )}
                <ResolveForm
                  matchId={m.id}
                  onResolve={(payload) => resolveMatch({ ...payload, matchId: m.id, resolvedAt: Date.now() })}
                />
              </li>
            );
          })}
        </ul>

        <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Link to="/matches" className="text-primary hover:underline">← back to matchboard</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}

function ResolveForm({
  matchId, onResolve,
}: { matchId: string; onResolve: (r: { homeScore: number; awayScore: number; winner: "home" | "draw" | "away"; firstGoal: "home" | "away" | "none"; btts: "yes" | "no"; overUnder: "over" | "under"; isUpsetResult?: boolean; chaosOutcome?: string }) => void }) {
  const [h, setH] = useState(2);
  const [a, setA] = useState(1);
  const [fg, setFg] = useState<"home" | "away" | "none">("home");
  const [isUpset, setIsUpset] = useState(false);
  const [chaos, setChaos] = useState("");
  const winner: "home" | "draw" | "away" = h > a ? "home" : h < a ? "away" : "draw";
  const btts: "yes" | "no" = h > 0 && a > 0 ? "yes" : "no";
  const overUnder: "over" | "under" = h + a > 2 ? "over" : "under";

  return (
    <div className="mt-5 border-t border-border/30 pt-5 flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-end">
        <div className="flex items-center gap-3">
          <Stepper label="Home" value={h} onChange={setH} />
          <span className="font-display text-2xl text-muted-foreground">–</span>
          <Stepper label="Away" value={a} onChange={setA} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Pill>Winner · {winner}</Pill>
          <Pill>BTTS · {btts}</Pill>
          <Pill>Goals · {overUnder} 2.5</Pill>
        </div>
        <div className="flex items-center gap-2">
          <select value={fg} onChange={(e) => setFg(e.target.value as "home" | "away" | "none")} className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-full">
            <option value="home">1st goal: home</option>
            <option value="away">1st goal: away</option>
            <option value="none">No goal</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-surface-elevated/40 p-4">
        <label className="flex items-center gap-2 cursor-pointer font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={isUpset}
            onChange={(e) => setIsUpset(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
          />
          Is Upset Result
        </label>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground whitespace-nowrap">Chaos Outcome:</span>
          <input
            type="text"
            value={chaos}
            onChange={(e) => setChaos(e.target.value)}
            placeholder="e.g. shock draw, penalty collapse"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={() => onResolve({ homeScore: h, awayScore: a, winner, firstGoal: fg, btts, overUnder, isUpsetResult: isUpset, chaosOutcome: chaos || undefined })}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 transition-all ml-auto"
        >
          Resolve
        </button>
      </div>
      <input type="hidden" value={matchId} readOnly />
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
      <span className="px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="h-7 w-7 rounded-full border border-border text-foreground">−</button>
      <span className="w-6 text-center font-display text-xl tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(9, value + 1))} className="h-7 w-7 rounded-full border border-border text-foreground">+</button>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-3 py-1.5 tabular-nums">
      {children}
    </span>
  );
}