import type { Match } from "@/lib/match-data";

function formatKickoff(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return { day, time };
}

export function MatchCard({ match }: { match: Match }) {
  const { day, time } = formatKickoff(match.kickoff);
  const isLive = match.status === "live";
  const isFinal = match.status === "final";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-primary/40 hover:bg-surface-elevated">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {match.group}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-card/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-red-card">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-red-card" />
            Live · {match.minute}'
          </span>
        ) : isFinal ? (
          <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Final
          </span>
        ) : (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Locks {day} · {time}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-7">
        <TeamSide team={match.home} score={match.score?.home} align="left" />
        <div className="flex flex-col items-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {isLive || isFinal ? <span className="text-foreground">vs</span> : <span>vs</span>}
        </div>
        <TeamSide team={match.away} score={match.score?.away} align="right" />
      </div>

      <div className="flex items-center justify-between border-t border-hairline px-5 py-3 text-xs text-muted-foreground">
        <span className="truncate font-mono uppercase tracking-[0.16em]">
          {match.venue}
        </span>
        <span className="shrink-0 font-mono uppercase tracking-[0.16em]">
          <span className="text-foreground">{match.callsLocked.toLocaleString()}</span> calls
        </span>
      </div>

      <div className="border-t border-hairline p-3">
        <button
          type="button"
          disabled={isFinal}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-muted-foreground"
        >
          {isFinal ? "Match closed" : isLive ? "Lock late call" : "Make your call"}
          {!isFinal && <span aria-hidden>→</span>}
        </button>
      </div>
    </article>
  );
}

function TeamSide({
  team,
  score,
  align,
}: {
  team: Match["home"];
  score?: number;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span aria-hidden className="text-3xl leading-none">
        {team.flag}
      </span>
      <div className={align === "right" ? "items-end" : ""}>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {team.code}
        </div>
        <div className="font-display text-2xl leading-none tracking-wide">{team.name}</div>
      </div>
      {typeof score === "number" && (
        <div
          className={`font-display text-4xl text-gold ${
            align === "right" ? "mr-auto" : "ml-auto"
          }`}
        >
          {score}
        </div>
      )}
    </div>
  );
}