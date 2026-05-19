import type { Match } from "@/lib/match-data";
import { Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

function formatKickoff(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return { day, time };
}

// Deterministic pseudo-data derived from match id so cards feel rich without
// needing real data wiring. Stable across renders.
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function fanSplit(id: string) {
  const h = hash(id);
  const home = 25 + (h % 40);
  const draw = 10 + ((h >> 6) % 25);
  const away = Math.max(5, 100 - home - draw);
  return { home, draw, away };
}
function form(id: string, salt: number) {
  const h = hash(id + salt);
  const out: ("W" | "D" | "L")[] = [];
  for (let i = 0; i < 5; i++) {
    const v = (h >> (i * 3)) & 0b11;
    out.push(v === 0 ? "L" : v === 1 ? "D" : "W");
  }
  return out;
}

export function MatchCard({ match }: { match: Match }) {
  const { day, time } = formatKickoff(match.kickoff);
  const isLive = match.status === "live";
  const isFinal = match.status === "final";
  const split = fanSplit(match.id);
  const { getPrediction, getDraft, getResult } = useStore();
  const pred = getPrediction(match.id);
  const draft = getDraft(match.id);
  const result = getResult(match.id);
  const canClaim = !!pred && !!result && !pred.claimed;

  const ctaLabel = canClaim
    ? "Claim Ball IQ"
    : pred?.claimed
      ? "View proof"
      : pred
        ? isLive ? "View arena" : "View locked call"
        : draft
          ? "Continue call"
          : isFinal
            ? "View arena"
            : isLive ? "Late call" : "Make call";
  const ctaPrimary = canClaim || !pred;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-primary/40 hover:bg-surface-elevated">
      {/* Status strip */}
      <div className="flex items-center justify-between border-b border-hairline px-5 py-2.5">
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {match.group}
        </span>
        {isLive ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-card/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-red-card">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-card" />
            Live · {match.minute}'
          </span>
        ) : isFinal ? (
          <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Final
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            {day} · {time}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="px-5 pt-5 pb-4">
        <TeamRow team={match.home} score={match.score?.home} form={form(match.id, 1)} />
        <div className="my-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-hairline" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {isLive || isFinal ? match.minute ? `${match.minute}'` : "FT" : "vs"}
          </span>
          <span className="h-px flex-1 bg-hairline" />
        </div>
        <TeamRow team={match.away} score={match.score?.away} form={form(match.id, 2)} />
      </div>

      {/* Fan call split */}
      <div className="px-5 pb-4">
        <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>Fan call</span>
          <span className="text-foreground">{match.callsLocked.toLocaleString()} locked</span>
        </div>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-background">
          <span style={{ width: `${split.home}%` }} className="bg-primary" />
          <span style={{ width: `${split.draw}%` }} className="bg-muted-foreground/40" />
          <span style={{ width: `${split.away}%` }} className="bg-foreground/80" />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
          <span><span className="text-primary">{split.home}%</span> {match.home.code}</span>
          <span>{split.draw}% draw</span>
          <span>{match.away.code} <span className="text-foreground">{split.away}%</span></span>
        </div>
      </div>

      {/* Footer + CTA */}
      <div className="mt-auto flex items-center gap-2 border-t border-hairline p-3">
        <span className="truncate px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {match.venue.split(",")[0]}
        </span>
        <Link
          to="/matches/$matchId"
          params={{ matchId: match.id }}
          className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
            ctaPrimary
              ? "bg-primary text-primary-foreground hover:brightness-110"
              : "border border-border bg-background text-foreground hover:bg-surface-elevated"
          }`}
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </article>
  );
}

function TeamRow({
  team,
  score,
  form,
}: {
  team: Match["home"];
  score?: number;
  form: ("W" | "D" | "L")[];
}) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="text-2xl leading-none">
        {team.flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg leading-none tracking-tight">
          {team.name}
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          {form.map((r, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                r === "W"
                  ? "bg-primary"
                  : r === "D"
                    ? "bg-muted-foreground/50"
                    : "bg-red-card/70"
              }`}
              title={r}
            />
          ))}
          <span className="ml-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {team.code}
          </span>
        </div>
      </div>
      {typeof score === "number" && (
        <div className="font-display text-3xl tabular-nums leading-none">{score}</div>
      )}
    </div>
  );
}