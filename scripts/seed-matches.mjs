import { createPublicClient, createWalletClient, parseAbi } from "viem";
import { contractMatches } from "./contract-matches.mjs";
import { getContractAddress, getContractEnvironment } from "./contract-env.mjs";

const abi = parseAbi([
  "function createMatch(uint256 matchId, string homeTeam, string awayTeam, uint256 kickoffTime)",
  "function matches(uint256 matchId) view returns (string homeTeam, string awayTeam, uint256 kickoffTime, bool exists)",
]);
const address = getContractAddress();
const { account, chain, explorerUrl, transport } = getContractEnvironment();
const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ account, chain, transport });

console.log(`Seeding ${contractMatches.length} frontend fixtures on ${chain.name}`);
console.log(`Contract: ${address}`);

for (const match of contractMatches) {
  const current = await publicClient.readContract({
    abi,
    address,
    functionName: "matches",
    args: [match.id],
  });

  if (current[3]) {
    console.log(`Skip ${match.id}: ${current[0]} vs ${current[1]} already exists.`);
    continue;
  }

  const hash = await walletClient.writeContract({
    abi,
    account,
    address,
    functionName: "createMatch",
    args: [match.id, match.homeTeam, match.awayTeam, match.kickoffTime],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Created ${match.id}: ${match.homeTeam} vs ${match.awayTeam} - ${explorerUrl}/tx/${hash}`);
}
