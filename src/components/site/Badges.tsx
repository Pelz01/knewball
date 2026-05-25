import { BADGES } from "@/lib/match-data";
import { BadgeIcon } from "./BadgeIcon";

export function Badges() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            03 / Reputation
          </span>
          <h2 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
            Badges that prove it
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Every correct call leaves a mark. Unlock badges for upsets, correct scores, and
          first goal calls. All collectible on X Layer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => (
          <article
            key={b.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition hover:bg-surface-elevated"
          >
            <div className="flex items-start justify-between">
              <BadgeIcon id={b.id} className="h-12 w-12" />
            </div>
            <h3 className="mt-5 font-display text-2xl tracking-tight">{b.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}