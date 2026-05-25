import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { BADGES, type Badge } from "@/lib/match-data";
import { useStore } from "@/lib/store";
import { BadgeIcon } from "@/components/site/BadgeIcon";

export const Route = createFileRoute("/vault")({
  component: VaultPage,
});

function VaultPage() {
  const { wallet, predictions } = useStore();
  const myPreds = wallet ? predictions.filter((p) => p.wallet.toLowerCase() === wallet.toLowerCase()) : [];
  const earnedNames = Array.from(new Set(myPreds.flatMap((p) => p.badges || (p.badge ? [p.badge] : []))));

  // Map earned badge names to badge IDs
  const ownedIds = new Set(
    BADGES.filter((b) => earnedNames.includes(b.name)).map((b) => b.id)
  );

  // Fallback for demo when no wallet is connected or no predictions are claimed yet
  const actualOwnedIds = ownedIds.size > 0 ? ownedIds : new Set(["first-call", "knew-ball"]);

  const owned = BADGES.filter((b) => actualOwnedIds.has(b.id));
  const locked = BADGES.filter((b) => !actualOwnedIds.has(b.id));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Collectibles · Season 01</span>
            <h1 className="mt-2 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">The vault.</h1>
            <p className="mt-4 text-muted-foreground md:text-lg">
              Every badge minted to your wallet on X Layer. Soulbound to your fan ID, tradeable when the season ends.
            </p>
          </div>
          <div className="flex gap-2">
            <Stat label="Owned" value={owned.length} />
            <Stat label="Locked" value={locked.length} />
          </div>
        </header>

        <section className="mb-16">
          <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-3">
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">In your vault</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{owned.length} minted</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((b) => <BadgeCard key={b.id} badge={b} owned />)}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-3">
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">Still to chase</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{locked.length} locked</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((b) => <BadgeCard key={b.id} badge={b} owned={false} />)}
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-border bg-surface p-10 text-center md:p-14">
          <h3 className="mx-auto max-w-3xl font-display text-3xl leading-[0.95] tracking-tight md:text-5xl">
            Keep calling. <span className="text-primary text-glow-green">Keep collecting.</span>
          </h3>
          <Link to="/matches" className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
            Make next call →
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function BadgeCard({ badge, owned }: { badge: Badge; owned: boolean }) {
  return (
    <article className={`group relative overflow-hidden rounded-2xl border bg-surface p-6 transition hover:border-primary/40 ${owned ? "border-primary/30" : "border-border opacity-60"}`}>
      <div className="flex items-start justify-between">
        <BadgeIcon id={badge.id} className="h-14 w-14" />
      </div>
      <h3 className="mt-5 font-display text-xl leading-tight tracking-tight">{badge.name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{badge.description}</p>
      <div className="mt-5 flex items-center justify-between border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>{owned ? "Minted · X Layer" : "Locked"}</span>
        <span className={owned ? "text-primary" : "text-muted-foreground"}>
          {owned ? "↗ view tx" : "—"}
        </span>
      </div>
    </article>
  );
}
