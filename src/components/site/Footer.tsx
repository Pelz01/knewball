import { Link } from "@tanstack/react-router";
import { Logo, Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={28} className="text-foreground" />
              <Wordmark className="font-display text-lg tracking-tight" />
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              An onchain World Cup prediction form game. Built for fans who want to prove
              they knew ball before the timeline caught up.
            </p>
            <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Live on X Layer · Season 01
            </div>
          </div>

          <FooterCol
            title="Game"
            links={[
              { to: "/matches", label: "Matches" },
              { to: "/leaderboard", label: "Leaderboard" },
              { to: "/how-it-works", label: "How it works" },
            ]}
          />
          <FooterCol
            title="Community"
            links={[
              { href: "https://x.com", label: "X" },
              { href: "https://discord.com", label: "Discord" },
              { href: "https://t.me", label: "Telegram" },
            ]}
          />
          <FooterCol
            title="Builders"
            links={[
              { href: "https://web3.okx.com/xlayer", label: "X Layer" },
              { href: "#", label: "Docs" },
              { href: "#", label: "GitHub" },
            ]}
          />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-hairline pt-6 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground sm:flex-row sm:items-center">
          <span>© Knewball · 2026</span>
          <span>Reputation and onchain bragging rights only</span>
        </div>
      </div>
    </footer>
  );
}

type Col = { title: string; links: ({ to: string; label: string } | { href: string; label: string })[] };

function FooterCol({ title, links }: Col) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) =>
          "to" in l ? (
            <li key={l.label}>
              <Link to={l.to} className="text-foreground transition hover:text-primary">
                {l.label}
              </Link>
            </li>
          ) : (
            <li key={l.label}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="text-foreground transition hover:text-primary"
              >
                {l.label}
              </a>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
