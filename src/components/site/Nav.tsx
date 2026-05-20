import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Logo, Wordmark } from "./Logo";
import { OnboardingModal } from "./OnboardingModal";
import { useStore, shortAddress } from "@/lib/store";

const appLinks = [
  { to: "/matches", label: "Matchboard" },
  { to: "/leaderboard", label: "Leaderboard" },
] as const;

const publicLinks = [
  { to: "/matches", label: "Matches" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/how-it-works", label: "How it works" },
] as const;

export function Nav({ variant = "app" }: { variant?: "marketing" | "app" }) {
  const { wallet, profile, totalBallIq, disconnect } = useStore();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2.5">
          <Logo size={28} className="text-foreground transition group-hover:text-primary" />
          <Wordmark className="font-display text-lg tracking-tight" />
        </Link>

        {variant === "app" && (
          <nav className="hidden items-center gap-1 md:flex">
            {(profile ? appLinks : publicLinks).map((l) => (
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
        )}

        <div className="flex items-center gap-2">
          {variant === "marketing" ? (
            <>
              <Link
                to="/leaderboard"
                className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated sm:inline-flex"
              >
                Leaderboard
              </Link>
              <Link
                to="/matches"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Launch app
                <span aria-hidden className="text-base leading-none transition group-hover:translate-x-0.5">→</span>
              </Link>
            </>
          ) : wallet && profile ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile/$wallet"
                params={{ wallet }}
                className="flex items-center gap-3 rounded-full border border-border bg-surface px-3 py-1.5 text-sm transition hover:bg-surface-elevated"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs">⚽</span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="font-medium text-foreground">{profile.displayName}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    {totalBallIq.toLocaleString()} IQ
                  </span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:hidden">
                  {profile.displayName} · {totalBallIq.toLocaleString()} IQ
                </span>
              </Link>
              <button
                type="button"
                onClick={() => { disconnect(); router.navigate({ to: "/" }); }}
                className="hidden rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground md:inline-flex"
              >
                Sign out
              </button>
            </div>
          ) : wallet ? (
            <span
              className="inline-flex items-center rounded-full border border-border bg-surface px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            >
              {shortAddress(wallet)}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
              Connect wallet
            </button>
          )}
        </div>
      </div>
      <OnboardingModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
