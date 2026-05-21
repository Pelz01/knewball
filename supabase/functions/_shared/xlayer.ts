import {
  createPublicClient,
  decodeFunctionData,
  defineChain,
  http,
  parseAbi,
  type Address,
  type Hash,
} from "npm:viem@2";

export const knewBallCupAbi = parseAbi([
  "function claimBallIQ(uint256 matchId)",
  "function submitPrediction(uint256 matchId, uint8 winner, uint8 homeScore, uint8 awayScore, uint8 totalGoals, uint8 bothTeamsScored, uint8 firstGoal)",
  "function predictions(uint256 matchId, address wallet) view returns (uint8 winner, uint8 homeScore, uint8 awayScore, uint8 totalGoals, uint8 bothTeamsScored, uint8 firstGoal, uint256 lockedAt, uint256 pointsEarned, bool exists, bool claimed)",
]);

export function getXLayerConfig() {
  const network = Deno.env.get("XLAYER_NETWORK") ?? "testnet";
  const config = network === "mainnet"
    ? {
        id: 196,
        name: "X Layer",
        rpcUrl: Deno.env.get("XLAYER_RPC_URL") ?? "https://rpc.xlayer.tech",
      }
    : {
        id: 1952,
        name: "X Layer testnet",
        rpcUrl: Deno.env.get("XLAYER_RPC_URL") ?? "https://testrpc.xlayer.tech/terigon",
      };
  const contractAddress = Deno.env.get("KNEWBALL_CONTRACT_ADDRESS");
  if (!isAddress(contractAddress)) throw new Error("Missing KNEWBALL_CONTRACT_ADDRESS secret.");

  return {
    contractAddress,
    network,
    publicClient: createPublicClient({
      chain: defineChain({
        id: config.id,
        name: config.name,
        nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
        rpcUrls: { default: { http: [config.rpcUrl] } },
      }),
      transport: http(config.rpcUrl),
    }),
  };
}

export function decodeClaimMatchId(input: `0x${string}`) {
  const decoded = decodeFunctionData({ abi: knewBallCupAbi, data: input });
  if (decoded.functionName !== "claimBallIQ") throw new Error("Transaction does not call claimBallIQ.");
  return decoded.args[0];
}

export function decodeSubmittedPrediction(input: `0x${string}`) {
  const decoded = decodeFunctionData({ abi: knewBallCupAbi, data: input });
  if (decoded.functionName !== "submitPrediction") {
    throw new Error("Transaction does not call submitPrediction.");
  }

  return {
    matchId: decoded.args[0],
    winner: decoded.args[1],
    homeScore: decoded.args[2],
    awayScore: decoded.args[3],
    totalGoals: decoded.args[4],
    bothTeamsScored: decoded.args[5],
    firstGoal: decoded.args[6],
  };
}

export function isAddress(value: string | undefined): value is Address {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

export function isHash(value: string | undefined): value is Hash {
  return Boolean(value && /^0x[a-fA-F0-9]{64}$/.test(value));
}
