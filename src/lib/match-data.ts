export type MatchStatus = "upcoming" | "live" | "final";

export interface Team {
  code: string;
  name: string;
  flag: string; // emoji flag
}

export interface Match {
  id: string;
  group: string;
  home: Team;
  away: Team;
  kickoff: string; // ISO
  venue: string;
  status: MatchStatus;
  score?: { home: number; away: number };
  minute?: number;
  callsLocked: number;
}

const t = (code: string, name: string, flag: string): Team => ({ code, name, flag });

export const TEAMS = {
  ARG: t("ARG", "Argentina", "🇦🇷"),
  BRA: t("BRA", "Brazil", "🇧🇷"),
  FRA: t("FRA", "France", "🇫🇷"),
  ENG: t("ENG", "England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"),
  GER: t("GER", "Germany", "🇩🇪"),
  ESP: t("ESP", "Spain", "🇪🇸"),
  POR: t("POR", "Portugal", "🇵🇹"),
  NED: t("NED", "Netherlands", "🇳🇱"),
  ITA: t("ITA", "Italy", "🇮🇹"),
  BEL: t("BEL", "Belgium", "🇧🇪"),
  CRO: t("CRO", "Croatia", "🇭🇷"),
  URU: t("URU", "Uruguay", "🇺🇾"),
  MAR: t("MAR", "Morocco", "🇲🇦"),
  JPN: t("JPN", "Japan", "🇯🇵"),
  KOR: t("KOR", "South Korea", "🇰🇷"),
  SEN: t("SEN", "Senegal", "🇸🇳"),
} as const;

export const MATCHES: Match[] = [
  {
    id: "m-001",
    group: "Group A — Matchday 2",
    home: TEAMS.ARG,
    away: TEAMS.NED,
    kickoff: "2026-06-18T20:00:00Z",
    venue: "Estadio Azteca, Mexico City",
    status: "upcoming",
    callsLocked: 18402,
  },
  {
    id: "m-002",
    group: "Group C — Matchday 2",
    home: TEAMS.FRA,
    away: TEAMS.MAR,
    kickoff: "2026-06-18T23:00:00Z",
    venue: "MetLife Stadium, NJ",
    status: "live",
    score: { home: 1, away: 1 },
    minute: 67,
    callsLocked: 24910,
  },
  {
    id: "m-003",
    group: "Group B — Matchday 2",
    home: TEAMS.BRA,
    away: TEAMS.POR,
    kickoff: "2026-06-19T19:00:00Z",
    venue: "SoFi Stadium, LA",
    status: "upcoming",
    callsLocked: 9120,
  },
  {
    id: "m-004",
    group: "Group D — Matchday 2",
    home: TEAMS.ENG,
    away: TEAMS.GER,
    kickoff: "2026-06-19T22:00:00Z",
    venue: "BMO Field, Toronto",
    status: "upcoming",
    callsLocked: 31204,
  },
  {
    id: "m-005",
    group: "Group E — Matchday 1",
    home: TEAMS.ESP,
    away: TEAMS.JPN,
    kickoff: "2026-06-20T18:00:00Z",
    venue: "Lumen Field, Seattle",
    status: "upcoming",
    callsLocked: 6804,
  },
  {
    id: "m-006",
    group: "Group F — Matchday 1",
    home: TEAMS.ITA,
    away: TEAMS.CRO,
    kickoff: "2026-06-17T19:00:00Z",
    venue: "Mercedes-Benz Stadium",
    status: "final",
    score: { home: 2, away: 1 },
    callsLocked: 14207,
  },
  {
    id: "m-007",
    group: "Group G — Matchday 1",
    home: TEAMS.MAR,
    away: TEAMS.ESP,
    kickoff: "2026-06-16T19:00:00Z",
    venue: "Soldier Field, Chicago",
    status: "final",
    score: { home: 1, away: 0 },
    callsLocked: 9821,
  },
  {
    id: "m-008",
    group: "Group H — Matchday 1",
    home: TEAMS.GER,
    away: TEAMS.KOR,
    kickoff: "2026-06-16T22:00:00Z",
    venue: "AT&T Stadium, Dallas",
    status: "final",
    score: { home: 3, away: 1 },
    callsLocked: 12044,
  },
];

export interface FanRank {
  rank: number;
  handle: string;
  country: Team;
  ballIq: number;
  streak: number;
  accuracy: number;
}

export const TOP_FANS: FanRank[] = [
  { rank: 1, handle: "@elcapitan.eth", country: TEAMS.ARG, ballIq: 8420, streak: 14, accuracy: 78 },
  { rank: 2, handle: "@toko10", country: TEAMS.JPN, ballIq: 8112, streak: 11, accuracy: 74 },
  { rank: 3, handle: "@samba.brz", country: TEAMS.BRA, ballIq: 7960, streak: 9, accuracy: 71 },
  { rank: 4, handle: "@kingsroad", country: TEAMS.ENG, ballIq: 7642, streak: 12, accuracy: 70 },
  { rank: 5, handle: "@atlas.mar", country: TEAMS.MAR, ballIq: 7488, streak: 8, accuracy: 69 },
  { rank: 6, handle: "@bleu.fr", country: TEAMS.FRA, ballIq: 7301, streak: 7, accuracy: 67 },
  { rank: 7, handle: "@oranje.knows", country: TEAMS.NED, ballIq: 7044, streak: 6, accuracy: 66 },
  { rank: 8, handle: "@oppta", country: TEAMS.POR, ballIq: 6892, streak: 5, accuracy: 65 },
];

export interface CountryRank {
  rank: number;
  country: Team;
  fans: number;
  avgIq: number;
}

export const COUNTRY_RANKS: CountryRank[] = [
  { rank: 1, country: TEAMS.ARG, fans: 48210, avgIq: 6120 },
  { rank: 2, country: TEAMS.BRA, fans: 44980, avgIq: 5890 },
  { rank: 3, country: TEAMS.ENG, fans: 41204, avgIq: 5710 },
  { rank: 4, country: TEAMS.FRA, fans: 38744, avgIq: 5602 },
  { rank: 5, country: TEAMS.GER, fans: 32104, avgIq: 5488 },
  { rank: 6, country: TEAMS.ESP, fans: 29841, avgIq: 5402 },
];

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "legendary";
  icon: string;
}

export const BADGES: Badge[] = [
  { id: "b1", name: "Cold Call", description: "Called a 1-in-10 upset before kickoff", rarity: "rare", icon: "❄" },
  { id: "b2", name: "Hat-Trick", description: "3 correct calls in a single match", rarity: "rare", icon: "✦" },
  { id: "b3", name: "Clean Sheet", description: "Predicted 0-goal result correctly", rarity: "common", icon: "▢" },
  { id: "b4", name: "Oracle", description: "10-match correct winner streak", rarity: "legendary", icon: "◈" },
  { id: "b5", name: "Banderillero", description: "Top-100 in your country", rarity: "common", icon: "△" },
  { id: "b6", name: "Knew Ball", description: "Locked the upset before the timeline", rarity: "legendary", icon: "◉" },
];