import { Link } from "@tanstack/react-router";
import { Logo, Wordmark } from "./Logo";

const links = [
  { to: "/matches", label: "Matches" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/vault", label: "Vault" },
  { to: "/profile", label: "Profile" },
  { to: "/how-it-works", label: "How it works" },
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <Logo size={28} className="text-foreground transition group-hover:text-primary" />
          <Wordmark className="font-display text-lg tracking-tight" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
              activeProps={{ className: "bg-surface-elevated text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            X Layer
          </span>
          <button
            type="button"
            className="group relative inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Connect wallet
            <span aria-hidden className="text-base leading-none">→</span>
          </button>
        </div>
      </div>
    </header>
  );
}