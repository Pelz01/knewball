import type { Team } from "@/lib/match-data";

interface FlagProps {
  team: Team;
  className?: string;
}

export function Flag({ team, className = "h-4 w-6" }: FlagProps) {
  return (
    <img
      src={`https://flagcdn.com/w80/${team.iso2}.png`}
      alt={`${team.name} flag`}
      className={`inline-block object-cover rounded-sm border border-border/30 shrink-0 select-none ${className}`}
      loading="lazy"
    />
  );
}
