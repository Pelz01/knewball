export const contractMatches = [
  fixture(1, "MEX", "RSA", "2026-06-11T19:00:00Z"),
  fixture(2, "KOR", "CZE", "2026-06-12T02:00:00Z"),
  fixture(3, "CAN", "BIH", "2026-06-12T19:00:00Z"),
  fixture(4, "USA", "PAR", "2026-06-13T01:00:00Z"),
  fixture(5, "QAT", "SUI", "2026-06-13T19:00:00Z"),
  fixture(6, "BRA", "JPN", "2026-06-13T22:00:00Z"),
  fixture(7, "HAI", "SCO", "2026-06-14T01:00:00Z"),
  fixture(8, "AUS", "TUR", "2026-06-14T04:00:00Z"),
  fixture(9, "GER", "CUW", "2026-06-14T17:00:00Z"),
  fixture(10, "NED", "JPN", "2026-06-14T20:00:00Z"),
  fixture(11, "CIV", "ECU", "2026-06-14T23:00:00Z"),
  fixture(12, "SWE", "TUN", "2026-06-15T02:00:00Z"),
  fixture(13, "ESP", "CPV", "2026-06-15T16:00:00Z"),
  fixture(14, "BEL", "EGY", "2026-06-15T19:00:00Z"),
  fixture(15, "KSA", "URU", "2026-06-15T22:00:00Z"),
  fixture(16, "IRN", "NZL", "2026-06-16T01:00:00Z"),
  fixture(17, "FRA", "SEN", "2026-06-16T19:00:00Z"),
  fixture(18, "IRQ", "NOR", "2026-06-16T22:00:00Z"),
  fixture(19, "ARG", "ALG", "2026-06-17T01:00:00Z"),
  fixture(20, "AUT", "JOR", "2026-06-17T04:00:00Z"),
  fixture(21, "POR", "COD", "2026-06-17T17:00:00Z"),
  fixture(22, "ENG", "CRO", "2026-06-17T20:00:00Z"),
  fixture(23, "GHA", "PAN", "2026-06-17T23:00:00Z"),
  fixture(24, "UZB", "COL", "2026-06-18T02:00:00Z"),
];

function fixture(id, homeTeam, awayTeam, kickoff) {
  return {
    id: BigInt(id),
    homeTeam,
    awayTeam,
    kickoffTime: BigInt(Math.floor(new Date(kickoff).getTime() / 1000)),
  };
}
