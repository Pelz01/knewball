export type MatchStatus = "upcoming" | "live" | "final";

export interface Team {
  code: string;
  name: string;
  flag: string; // emoji flag fallback
  iso2: string; // 2-letter lowercase country code for CDN
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
  underdogTeam?: string; // e.g. "JPN"
  isUpsetResult?: boolean;
  chaosOutcome?: string; // e.g. "underdog win", "shock draw"
  resolvedAt?: number;
}

const t = (code: string, name: string, flag: string, iso2: string): Team => ({ code, name, flag, iso2 });

export const TEAMS = {
  ALG: t("ALG", "Algeria", "🇩🇿", "dz"),
  ARG: t("ARG", "Argentina", "🇦🇷", "ar"),
  AUS: t("AUS", "Australia", "🇦🇺", "au"),
  AUT: t("AUT", "Austria", "🇦🇹", "at"),
  BEL: t("BEL", "Belgium", "🇧🇪", "be"),
  BIH: t("BIH", "Bosnia & Herzegovina", "🇧🇦", "ba"),
  BRA: t("BRA", "Brazil", "🇧🇷", "br"),
  CAN: t("CAN", "Canada", "🇨🇦", "ca"),
  CPV: t("CPV", "Cape Verde", "🇨🇻", "cv"),
  CIV: t("CIV", "Côte d'Ivoire", "🇨🇮", "ci"),
  COD: t("COD", "DR Congo", "🇨🇩", "cd"),
  COL: t("COL", "Colombia", "🇨🇴", "co"),
  CRC: t("CRC", "Costa Rica", "🇨🇷", "cr"),
  CRO: t("CRO", "Croatia", "🇭🇷", "hr"),
  CUW: t("CUW", "Curaçao", "🇨🇼", "cw"),
  CZE: t("CZE", "Czechia", "🇨🇿", "cz"),
  DEN: t("DEN", "Denmark", "🇩🇰", "dk"),
  ECU: t("ECU", "Ecuador", "🇪🇨", "ec"),
  EGY: t("EGY", "Egypt", "🇪🇬", "eg"),
  ENG: t("ENG", "England", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "gb-eng"),
  ESP: t("ESP", "Spain", "🇪🇸", "es"),
  FRA: t("FRA", "France", "🇫🇷", "fr"),
  GER: t("GER", "Germany", "🇩🇪", "de"),
  GHA: t("GHA", "Ghana", "🇬🇭", "gh"),
  HAI: t("HAI", "Haiti", "🇭🇹", "ht"),
  IRN: t("IRN", "Iran", "🇮🇷", "ir"),
  IRQ: t("IRQ", "Iraq", "🇮🇶", "iq"),
  JOR: t("JOR", "Jordan", "🇯🇴", "jo"),
  JPN: t("JPN", "Japan", "🇯🇵", "jp"),
  KOR: t("KOR", "South Korea", "🇰🇷", "kr"),
  KSA: t("KSA", "Saudi Arabia", "🇸🇦", "sa"),
  MAR: t("MAR", "Morocco", "🇲🇦", "ma"),
  MEX: t("MEX", "Mexico", "🇲🇽", "mx"),
  NED: t("NED", "Netherlands", "🇳🇱", "nl"),
  NOR: t("NOR", "Norway", "🇳🇴", "no"),
  NZL: t("NZL", "New Zealand", "🇳🇿", "nz"),
  PAN: t("PAN", "Panama", "🇵🇦", "pa"),
  PAR: t("PAR", "Paraguay", "🇵🇾", "py"),
  POR: t("POR", "Portugal", "🇵🇹", "pt"),
  QAT: t("QAT", "Qatar", "🇶🇦", "qa"),
  RSA: t("RSA", "South Africa", "🇿🇦", "za"),
  SCO: t("SCO", "Scotland", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "gb-sct"),
  SEN: t("SEN", "Senegal", "🇸🇳", "sn"),
  SUI: t("SUI", "Switzerland", "🇨🇭", "ch"),
  SWE: t("SWE", "Sweden", "🇸🇪", "se"),
  TUN: t("TUN", "Tunisia", "🇹🇳", "tn"),
  TUR: t("TUR", "Türkiye", "🇹🇷", "tr"),
  URU: t("URU", "Uruguay", "🇺🇾", "uy"),
  USA: t("USA", "United States", "🇺🇸", "us"),
  UZB: t("UZB", "Uzbekistan", "🇺🇿", "uz"),
} as const;

// Sorted alphabetically by country name for use in dropdowns
export const WORLD_CUP_TEAMS = Object.values(TEAMS).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const MATCHES: Match[] = [
  {
    id: "m-001",
    group: "Group A - Matchday 1",
    home: TEAMS.MEX,
    away: TEAMS.RSA,
    kickoff: "2026-06-11T19:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 18402,
  },
  {
    id: "m-002",
    group: "Group A - Matchday 1",
    home: TEAMS.KOR,
    away: TEAMS.CZE,
    kickoff: "2026-06-12T02:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 12680,
  },
  {
    id: "m-003",
    group: "Group B - Matchday 2",
    home: TEAMS.CAN,
    away: TEAMS.BIH,
    kickoff: "2026-06-12T19:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 22104,
  },
  {
    id: "m-004",
    group: "Group D - Matchday 2",
    home: TEAMS.USA,
    away: TEAMS.PAR,
    kickoff: "2026-06-13T01:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 31204,
  },
  {
    id: "m-005",
    group: "Group B - Matchday 1",
    home: TEAMS.QAT,
    away: TEAMS.SUI,
    kickoff: "2026-06-13T19:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 6804,
  },
  {
    id: "m-006",
    group: "Group C - Matchday 1",
    home: TEAMS.BRA,
    away: TEAMS.JPN,
    kickoff: "2026-06-13T22:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 29210,
    underdogTeam: "JPN",
  },
  {
    id: "m-007",
    group: "Group C - Matchday 1",
    home: TEAMS.HAI,
    away: TEAMS.SCO,
    kickoff: "2026-06-14T01:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 9821,
  },
  {
    id: "m-008",
    group: "Group D - Matchday 1",
    home: TEAMS.AUS,
    away: TEAMS.TUR,
    kickoff: "2026-06-14T04:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 12044,
  },
  {
    id: "m-009",
    group: "Group E - Matchday 1",
    home: TEAMS.GER,
    away: TEAMS.CUW,
    kickoff: "2026-06-14T17:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 19422,
  },
  {
    id: "m-010",
    group: "Group F - Matchday 1",
    home: TEAMS.NED,
    away: TEAMS.JPN,
    kickoff: "2026-06-14T20:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 24018,
  },
  {
    id: "m-011",
    group: "Group E - Matchday 1",
    home: TEAMS.CIV,
    away: TEAMS.ECU,
    kickoff: "2026-06-14T23:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 10930,
  },
  {
    id: "m-012",
    group: "Group F - Matchday 1",
    home: TEAMS.SWE,
    away: TEAMS.TUN,
    kickoff: "2026-06-15T02:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 13372,
  },
  {
    id: "m-013",
    group: "Group H - Matchday 1",
    home: TEAMS.ESP,
    away: TEAMS.CPV,
    kickoff: "2026-06-15T16:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 21404,
  },
  {
    id: "m-014",
    group: "Group G - Matchday 1",
    home: TEAMS.BEL,
    away: TEAMS.EGY,
    kickoff: "2026-06-15T19:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 18842,
  },
  {
    id: "m-015",
    group: "Group H - Matchday 1",
    home: TEAMS.KSA,
    away: TEAMS.URU,
    kickoff: "2026-06-15T22:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 17205,
  },
  {
    id: "m-016",
    group: "Group G - Matchday 1",
    home: TEAMS.IRN,
    away: TEAMS.NZL,
    kickoff: "2026-06-16T01:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 9514,
  },
  {
    id: "m-017",
    group: "Group I - Matchday 1",
    home: TEAMS.FRA,
    away: TEAMS.SEN,
    kickoff: "2026-06-16T19:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 27640,
  },
  {
    id: "m-018",
    group: "Group I - Matchday 1",
    home: TEAMS.IRQ,
    away: TEAMS.NOR,
    kickoff: "2026-06-16T22:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 11948,
  },
  {
    id: "m-019",
    group: "Group J - Matchday 1",
    home: TEAMS.ARG,
    away: TEAMS.ALG,
    kickoff: "2026-06-17T01:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 30221,
  },
  {
    id: "m-020",
    group: "Group J - Matchday 1",
    home: TEAMS.AUT,
    away: TEAMS.JOR,
    kickoff: "2026-06-17T04:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 8754,
  },
  {
    id: "m-021",
    group: "Group K - Matchday 1",
    home: TEAMS.POR,
    away: TEAMS.COD,
    kickoff: "2026-06-17T17:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 25531,
  },
  {
    id: "m-022",
    group: "Group L - Matchday 1",
    home: TEAMS.ENG,
    away: TEAMS.CRO,
    kickoff: "2026-06-17T20:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 31886,
  },
  {
    id: "m-023",
    group: "Group L - Matchday 1",
    home: TEAMS.GHA,
    away: TEAMS.PAN,
    kickoff: "2026-06-17T23:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 10906,
  },
  {
    id: "m-024",
    group: "Group K - Matchday 1",
    home: TEAMS.UZB,
    away: TEAMS.COL,
    kickoff: "2026-06-18T02:00:00Z",
    venue: "World Cup 2026",
    status: "upcoming",
    callsLocked: 13772,
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
  { rank: 5, country: TEAMS.MAR, fans: 32104, avgIq: 5488 },
  { rank: 6, country: TEAMS.JPN, fans: 29841, avgIq: 5402 },
];

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Badge names must match exactly what evaluates in store.tsx
export const BADGES: Badge[] = [
  { id: "first-call",      name: "First Call",      description: "User locks first prediction on X Layer",      icon: "✉️" },
  { id: "knew-ball",        name: "Knew Ball",       description: "User gets first correct prediction",          icon: "🎯" },
  { id: "perfect-call",     name: "Perfect Call",    description: "User gets all prediction fields correct",     icon: "🏆" },
  { id: "score-prophet",    name: "Score Prophet",   description: "User predicts exact final score",             icon: "🔮" },
  { id: "first-blood",      name: "First Blood",     description: "User predicts first team to score",           icon: "⚡" },
  { id: "hot-foot",         name: "Hot Foot",        description: "User gets 3 correct winner calls in a row",   icon: "🔥" },
  { id: "upset-hunter",     name: "Upset Hunter",    description: "User correctly predicts underdog win",        icon: "🏹" },
  { id: "chaos-merchant",   name: "Chaos Merchant",  description: "You saw the madness coming",                  icon: "🌀" },
  { id: "country-captain",  name: "Country Captain", description: "User enters top 10 for their country",        icon: "👑" },
];

export const BADGE_GROUPS = {
  "Call Milestone": ["first-call"],
  "Accuracy": ["first-blood", "score-prophet", "perfect-call"],
  "Reputation": ["knew-ball", "hot-foot", "upset-hunter", "chaos-merchant", "country-captain"]
};
