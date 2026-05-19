import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { useStore, matchById, describePrediction, shortAddress } from "@/lib/store";

export const Route = createFileRoute("/proof/$predictionId")({
  component: ProofPage,
});

function ProofPage() {
  const { predictionId } = Route.useParams();
  const { getPredictionById, getResult } = useStore();
  const p = getPredictionById(predictionId);
  const [copied, setCopied] = useState(false);

  if (!p) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Nav />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">404</span>
          <h1 className="mt-3 font-display text-5xl tracking-tight">No proof at this link.</h1>
          <p className="mt-3 text-muted-foreground">This proof may have been pruned in the local demo cache.</p>
          <Link to="/matches" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
            Make your own call
          </Link>
        </div>
      </div>
    );
  }

  const match = matchById(p.matchId)!;
  const r = getResult(p.matchId);
  const lines = describePrediction(p, match);
  const headline = p.claimed && (p.pointsEarned ?? 0) > 0
    ? `${shortAddress(p.wallet)} knew ball before kickoff.`
    : `${shortAddress(p.wallet)} locked this call before kickoff.`;

  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link to="/matches" className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
          ← Matchboard
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-surface">
          <div className="pointer-events-none absolute inset-0 bg-pitch-grid opacity-50" />
          <div className="pointer-events-none absolute inset-0 bg-scanline opacity-40" />
          <div className="relative p-8 md:p-12">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              Onchain proof · X Layer
            </span>
            <h1 className="mt-3 font-display text-[clamp(2rem,5.5vw,4rem)] leading-[0.95] tracking-tight">
              {headline}
            </h1>

            <div className="mt-8 flex items-center justify-between gap-6 rounded-2xl border border-hairline bg-background p-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{match.home.flag}</span>
                <div>
                  <div className="font-display text-2xl tracking-tight">{match.home.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{match.home.code}</div>
                </div>
              </div>
              <div className="text-center">
                {r ? (
                  <div className="font-display text-4xl tabular-nums">{r.homeScore} – {r.awayScore}</div>
                ) : (
                  <div className="font-display text-2xl tracking-tight text-muted-foreground">vs</div>
                )}
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {r ? "Final" : "Locked before kickoff"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-2xl tracking-tight">{match.away.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{match.away.code}</div>
                </div>
                <span className="text-3xl">{match.away.flag}</span>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">The call</h3>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {lines.map((l) => <li key={l} className="text-foreground">{l}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Receipt</h3>
                <dl className="mt-3 space-y-1.5 font-mono text-xs">
                  <Row k="Wallet" v={shortAddress(p.wallet)} />
                  <Row k="Locked at" v={new Date(p.lockedAt).toUTCString().replace("GMT", "UTC")} />
                  <Row k="Tx hash" v={`${p.txHash.slice(0, 10)}…${p.txHash.slice(-6)}`} />
                  <Row k="Status" v={p.claimed ? "Claimed" : r ? "Ready to claim" : "Awaiting kickoff"} />
                  {p.claimed && <Row k="Ball IQ earned" v={`+${p.pointsEarned}`} />}
                  {p.badge && <Row k="Badge" v={p.badge} />}
                </dl>
              </div>
            </div>

            {p.breakdown && (
              <div className="mt-8 rounded-2xl border border-hairline bg-background p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">Result breakdown</h3>
                <ul className="mt-3 divide-y divide-hairline">
                  {p.breakdown.map((b) => (
                    <li key={b.label} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${b.ok ? "bg-primary" : "bg-red-card/60"}`} />
                        {b.label}
                      </span>
                      <span className={`font-display text-lg tabular-nums ${b.ok ? "text-foreground" : "text-muted-foreground"}`}>
                        {b.points > 0 ? `+${b.points}` : "0"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/matches" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
                Make your own call →
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (url) navigator.clipboard?.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
              >
                {copied ? "Link copied" : "Copy share link"}
              </button>
              <Link to="/profile/$wallet" params={{ wallet: p.wallet }} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                View profile
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}