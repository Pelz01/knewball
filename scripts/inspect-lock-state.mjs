import { createPublicClient, parseAbi } from "viem";
import { getContractAddress, getContractEnvironment } from "./contract-env.mjs";

const abi = parseAbi([
  "function matches(uint256 matchId) view returns (string homeTeam, string awayTeam, uint256 kickoffTime, bool exists)",
  "function predictions(uint256 matchId, address wallet) view returns (uint8 winner, uint8 homeScore, uint8 awayScore, uint8 totalGoals, uint8 bothTeamsScored, uint8 firstGoal, uint256 lockedAt, uint256 pointsEarned, bool exists, bool claimed)",
]);

const matchIds = process.argv.slice(2).filter((value) => /^\d+$/.test(value));
const ids = matchIds.length > 0 ? matchIds.map(BigInt) : [1n, 6n];
const { account, chain, transport } = getContractEnvironment();
const address = getContractAddress();
const publicClient = createPublicClient({ chain, transport });

console.log(`Contract ${address}`);
console.log(`Wallet ${account.address}`);
console.log(`Chain time ${new Date(Number((await publicClient.getBlock()).timestamp) * 1000).toISOString()}`);

for (const id of ids) {
  const [match, prediction] = await Promise.all([
    publicClient.readContract({ abi, address, functionName: "matches", args: [id] }),
    publicClient.readContract({ abi, address, functionName: "predictions", args: [id, account.address] }),
  ]);

  console.log(JSON.stringify({
    matchId: id.toString(),
    match: {
      homeTeam: match[0],
      awayTeam: match[1],
      kickoffTime: new Date(Number(match[2]) * 1000).toISOString(),
      exists: match[3],
    },
    prediction: {
      lockedAt: prediction[6] > 0n ? new Date(Number(prediction[6]) * 1000).toISOString() : null,
      exists: prediction[8],
      claimed: prediction[9],
    },
  }, null, 2));
}
