import { TOP_FANS, COUNTRY_RANKS, TEAMS, type Team } from "@/lib/match-data";
import { Flag } from "./Flag";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fetchLeaderboardFans, type SupabaseLeaderboardFan } from "@/lib/supabase";

type FanRow = {
  rank: number;
  key: string;
  handle: string;
  country: Team;
  ballIq: number;
  form: number;
  formLabel: string;
  claimedCalls: number;
};

type CountryRow = {
  rank: number;
  country: Team;
  avgIq: number;
  totalIq: number;
  fans: number;
  isUserCountry: boolean;
};

const TEAMS_BY_CODE = new Map(Object.values(TEAMS).map((team) => [team.code, team]));

export function Leaderboard() {
  const [tab, setTab] = useState<"fans" | "countries">("fans");
  const [supabaseFans, setSupabaseFans] = useState<SupabaseLeaderboardFan[]>([]);
  const { wallet, profile, totalBallIq, currentForm, predictions } = useStore();

  useEffect(() => {
    let mounted = true;
    fetchLeaderboardFans()
      .then((fans) => {
        if (mounted) setSupabaseFans(fans);
      })
      .catch((error) => {
        console.warn("Could not load Supabase leaderboard", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const claimedCalls = predictions.filter((prediction) => prediction.claimed && wallet && prediction.wallet.toLowerCase() === wallet.toLowerCase()).length;
  const profileCountry = profile
    ? teamForCountry(profile.country)
    : null;

  const dynamicFans = useMemo(() => {
    const realRows: FanRow[] = supabaseFans.map((fan) => ({
      rank: 0,
      key: fan.wallet,
      handle: fan.displayName,
      country: teamForCountry(fan.country),
      ballIq: fan.ballIq,
      form: fan.formPercentage ?? 0,
      formLabel: fan.formLabel,
      claimedCalls: fan.claimedCalls,
    }));

    if (import.meta.env.DEV && wallet && profile && profileCountry) {
      const walletKey = wallet.toLowerCase();
      const existingIndex = realRows.findIndex((fan) => fan.key === walletKey);
      const connectedRow = {
        rank: 0,
        key: walletKey,
        handle: profile.displayName,
        country: profileCountry,
        ballIq: totalBallIq,
        form: currentForm.percentage ?? 0,
        formLabel: currentForm.percentage === null ? `Building Form: ${currentForm.calls.length}/5` : currentForm.label,
        claimedCalls,
      };

      if (existingIndex === -1) realRows.push(connectedRow);
      else realRows[existingIndex] = connectedRow;
    }

    if (realRows.length > 0) {
      return realRows
        .sort((a, b) => b.ballIq - a.ballIq)
        .map((fan, index) => ({ ...fan, rank: index + 1 }));
    }

    if (!import.meta.env.DEV) return [];

    return TOP_FANS.map((fan) => ({
      rank: fan.rank,
      key: `seeded:${fan.handle}`,
      handle: fan.handle,
      country: fan.country,
      ballIq: fan.ballIq,
      form: fan.form,
      formLabel: `${fan.form}%`,
      claimedCalls: Math.max(5, Math.round(fan.ballIq / 420)),
    }))
      .sort((a, b) => b.ballIq - a.ballIq)
      .map((fan, index) => ({ ...fan, rank: index + 1 }));
  }, [claimedCalls, currentForm.calls.length, currentForm.label, currentForm.percentage, profile, profileCountry, supabaseFans, totalBallIq, wallet]);

  const countryRows = useMemo(() => {
    const rowsByCountry = new Map<string, CountryRow>();

    for (const fan of supabaseFans.filter((fan) => fan.claimedCalls > 0)) {
      const country = teamForCountry(fan.country);
      const existing = rowsByCountry.get(country.code);
      if (existing) {
        existing.totalIq += fan.ballIq;
        existing.fans += 1;
        existing.avgIq = Math.round(existing.totalIq / existing.fans);
      } else {
        rowsByCountry.set(country.code, {
          rank: 0,
          country,
          avgIq: fan.ballIq,
          totalIq: fan.ballIq,
          fans: 1,
          isUserCountry: profileCountry?.code === country.code,
        });
      }
    }

    if (profile && profileCountry && claimedCalls > 0 && !rowsByCountry.has(profileCountry.code)) {
      rowsByCountry.set(profileCountry.code, {
        rank: 0,
        country: profileCountry,
        avgIq: Math.round(totalBallIq / Math.max(1, claimedCalls)),
        totalIq: totalBallIq,
        fans: 1,
        isUserCountry: true,
      });
    }

    if (rowsByCountry.size === 0 && import.meta.env.DEV) {
      for (const country of COUNTRY_RANKS) {
        rowsByCountry.set(country.country.code, {
          rank: country.rank,
          country: country.country,
          avgIq: country.avgIq,
          totalIq: country.avgIq * country.fans,
          fans: country.fans,
          isUserCountry: false,
        });
      }
    }

    return [...rowsByCountry.values()]
      .sort((a, b) => b.avgIq - a.avgIq)
      .map((country, index) => ({ ...country, rank: index + 1 }));
  }, [claimedCalls, profile, profileCountry, supabaseFans, totalBallIq]);

  return (
    <div>
      <div className="mb-6 flex gap-3 border-b border-hairline">
        <TabButton active={tab === "fans"} onClick={() => setTab("fans")}>Top Fans</TabButton>
        <TabButton active={tab === "countries"} onClick={() => setTab("countries")}>Country Form</TabButton>
      </div>

      {tab === "fans" ? (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-hairline px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <h3 className="font-display text-xl tracking-tight sm:text-2xl">Global Ball IQ — top fans</h3>
            <p className="mt-1.5 font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
              Season 01 · live ranking
            </p>
          </div>
          <span className="hidden rounded-full border border-border px-3.5 py-1.5 font-mono text-[10px] tracking-[0.22em] text-muted-foreground sm:inline-flex">
            Updated 12s ago
          </span>
        </header>

        {/* Column headers — hide Form + Acc on mobile */}
        <div className="grid grid-cols-[36px_1fr_auto_auto_auto] items-center gap-x-4 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:grid-cols-[40px_1fr_auto_auto_auto] sm:gap-x-5 sm:px-8 sm:py-4">
          <span>#</span>
          <span>Fan</span>
          <span className="hidden text-right sm:block">Form</span>
          <span className="hidden text-right sm:block">Claims</span>
          <span className="text-right">Ball IQ</span>
        </div>

        <ul className="divide-y divide-hairline">
          {dynamicFans.length > 0 ? dynamicFans.map((f) => (
            <li
              key={f.key}
              className="grid grid-cols-[36px_1fr_auto_auto_auto] items-center gap-x-4 px-6 py-4.5 transition hover:bg-surface-elevated sm:grid-cols-[40px_1fr_auto_auto_auto] sm:gap-x-5 sm:px-8 sm:py-5"
            >
              <span
                className={`font-display text-base sm:text-lg ${
                  f.rank <= 3 ? "text-gold" : "text-muted-foreground"
                }`}
              >
                {String(f.rank).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
                <Flag team={f.country} className="h-4.5 w-6 shrink-0 rounded-sm border border-border/20 sm:h-5 sm:w-7" />
                <span className="truncate text-sm font-medium sm:text-base">{f.handle}</span>
              </span>
              <span className="hidden items-center justify-end gap-1.5 font-mono text-sm tabular-nums sm:inline-flex">
                {f.formLabel}
              </span>
              <span className="hidden text-right font-mono text-sm tabular-nums text-muted-foreground sm:block">
                {f.claimedCalls}
              </span>
              <span className="text-right font-display text-lg tracking-tight tabular-nums sm:text-xl">
                {f.ballIq.toLocaleString()}
              </span>
            </li>
          )) : (
            <EmptyLeaderboard message="Mainnet leaderboard is building. The first claimed calls will appear here." />
          )}
        </ul>
      </div>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <header className="border-b border-hairline px-6 py-5 sm:px-8 sm:py-6">
          <h3 className="font-display text-xl tracking-tight sm:text-2xl">Country Form</h3>
          <p className="mt-1.5 font-mono text-[10px] tracking-[0.22em] text-muted-foreground">
            Ball IQ per active fan · fair across nation size
          </p>
        </header>
        <ul className="divide-y divide-hairline">
          {countryRows.length > 0 ? countryRows.map((c) => {
            const belowThreshold = c.fans < 3;
            const pct = belowThreshold ? 8 : Math.round((c.avgIq / 6500) * 100);
            return (
              <li key={c.country.code} className="px-6 py-5 sm:px-8 sm:py-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="w-6 font-display text-base text-muted-foreground tabular-nums sm:w-8 sm:text-lg">
                    {String(c.rank).padStart(2, "0")}
                  </span>
                  <Flag team={c.country} className="h-4.5 w-6 rounded-sm border border-border/20 sm:h-5.5 sm:w-8" />
                  <span className="font-display text-lg tracking-tight sm:text-xl">{c.country.name}</span>
                  {c.isUserCountry && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
                      your country
                    </span>
                  )}
                  <span className="ml-auto font-display text-lg text-gold tabular-nums sm:text-xl">
                    {belowThreshold ? "Building" : c.avgIq.toLocaleString()}
                  </span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background sm:mt-5">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:mt-2.5">
                  {c.fans.toLocaleString()} active fans · {belowThreshold ? "Building Country Form" : "Country Score"}
                </div>
              </li>
            );
          }) : (
            <EmptyLeaderboard message="Country Form will unlock once mainnet fans start claiming Ball IQ." />
          )}
        </ul>
      </div>
      )}
    </div>
  );
}

function EmptyLeaderboard({ message }: { message: string }) {
  return (
    <li className="px-6 py-12 text-center sm:px-8">
      <p className="font-display text-2xl tracking-tight">Season 1 is live</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {message}
      </p>
    </li>
  );
}

function teamForCountry(country: string) {
  return TEAMS_BY_CODE.get(country) ??
    TOP_FANS.find((fan) => fan.country.code === country)?.country ??
    COUNTRY_RANKS.find((row) => row.country.code === country)?.country ??
    TOP_FANS[0].country;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-1 pb-4 font-display text-xl tracking-tight transition ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
