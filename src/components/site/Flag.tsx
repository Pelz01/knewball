import type { Team } from "@/lib/match-data";

interface FlagProps {
  team: Team;
  className?: string;
}

const FLAG_CDN_UNSUPPORTED = new Set(["gb-eng", "gb-sct"]);

export function Flag({ team, className = "h-4 w-6" }: FlagProps) {
  if (FLAG_CDN_UNSUPPORTED.has(team.iso2)) {
    return (
      <span
        aria-label={`${team.name} flag`}
        className={`inline-flex items-center justify-center rounded-sm border border-border/30 bg-background text-sm leading-none shrink-0 select-none ${className}`}
      >
        {team.flag}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${team.iso2}.png`}
      alt={`${team.name} flag`}
      className={`inline-block object-cover rounded-sm border border-border/30 shrink-0 select-none ${className}`}
      decoding="async"
      loading="lazy"
    />
  );
}
