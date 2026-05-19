import { BADGES } from "@/lib/match-data";

const rarityRing: Record<string, string> = {
  common: "border-border",
  rare: "border-broadcast/60",
  legendary: "border-gold/70",
};
const rarityGlow: Record<string, string> = {
  common: "",
  rare: "shadow-[0_0_40px_-12px_rgba(37,99,235,0.5)]",
  legendary: "shadow-[0_0_50px_-10px_rgba(245,184,59,0.55)]",
};
const rarityText: Record<string, string> = {
  common: "text-muted-foreground",
  rare: "text-broadcast",
  legendary: "text-gold",
};

export function Badges() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            03 / Reputation
          </span>
          <h2 className="mt-2 font-display text-4xl tracking-wide md:text-5xl">
            Badges that prove it
          </h2>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Every correct call leaves a mark. Unlock badges for upsets, clean sheets, hat-tricks
          and oracle-level streaks. All collectible on X Layer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((b) => (
          <article
            key={b.id}
            className={`group relative overflow-hidden rounded-2xl border ${rarityRing[b.rarity]} bg-surface p-6 transition hover:bg-surface-elevated ${rarityGlow[b.rarity]}`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl border ${rarityRing[b.rarity]} bg-background text-3xl ${rarityText[b.rarity]}`}
              >
                {b.icon}
              </div>
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.24em] ${rarityText[b.rarity]}`}
              >
                {b.rarity}
              </span>
            </div>
            <h3 className="mt-5 font-display text-2xl tracking-wide">{b.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}