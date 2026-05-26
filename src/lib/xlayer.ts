import { createPublicClient, encodeFunctionData, http, parseAbi, type Address } from "viem";
import type { DraftPrediction, FanProfile } from "./store";

export const XLAYER_TESTNET = {
  chainId: 1952,
  chainIdHex: "0x7a0",
  name: "X Layer testnet",
  rpcUrls: ["https://xlayertestrpc.okx.com/terigon", "https://testrpc.xlayer.tech/terigon"],
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer-test",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
} as const;

export const XLAYER_MAINNET = {
  chainId: 196,
  chainIdHex: "0xc4",
  name: "X Layer mainnet",
  rpcUrls: ["https://xlayerrpc.okx.com", "https://rpc.xlayer.tech"],
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
} as const;

export const ACTIVE_XLAYER_NETWORK = String(import.meta.env.VITE_XLAYER_NETWORK ?? "testnet")
  .trim()
  .toLowerCase();

export const ACTIVE_XLAYER =
  ACTIVE_XLAYER_NETWORK === "mainnet" ? XLAYER_MAINNET : XLAYER_TESTNET;

const KNEWBALL_CUP_ABI = parseAbi([
  "function claimBallIQ(uint256 matchId)",
  "function submitPrediction(uint256 matchId, uint8 winner, uint8 homeScore, uint8 awayScore, uint8 totalGoals, uint8 bothTeamsScored, uint8 firstGoal)",
  "function resolveMatch(uint256 matchId, uint8 homeScore, uint8 awayScore, uint8 firstGoal)",
  "function predictions(uint256 matchId, address wallet) view returns (uint8 winner, uint8 homeScore, uint8 awayScore, uint8 totalGoals, uint8 bothTeamsScored, uint8 firstGoal, uint256 lockedAt, uint256 pointsEarned, bool exists, bool claimed)",
  "function results(uint256 matchId) view returns (uint8 homeScore, uint8 awayScore, uint8 winner, uint8 firstGoal, uint8 bothTeamsScored, uint8 totalGoals, uint256 resolvedAt, bool resolved)",
  "event PredictionSubmitted(address indexed wallet, uint256 indexed matchId, uint256 lockedAt)",
  "event MatchResolved(uint256 indexed matchId, uint8 homeScore, uint8 awayScore, uint256 resolvedAt)",
]);

export type Eip1193Provider = {
  request: <T = unknown>(args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<T>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider & { providers?: Eip1193Provider[]; isOkxWallet?: boolean };
    okxwallet?: Eip1193Provider;
  }
}

export function getInjectedProvider(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  if (window.okxwallet?.request) return window.okxwallet;
  if (window.ethereum?.providers?.length) {
    const okx = window.ethereum.providers.find((p) => "isOkxWallet" in p);
    return okx ?? window.ethereum.providers[0];
  }
  return window.ethereum;
}

export async function connectXLayerWallet() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No EVM wallet found. Install OKX Wallet or another EIP-1193 wallet.");
  }

  const accounts = await requestProvider<string[]>(provider, "eth_requestAccounts");
  const wallet = accounts[0];
  if (!wallet) throw new Error("Wallet did not return an account.");

  try {
    await ensureXLayerNetwork(provider);
  } catch (err) {
    console.warn("X Layer network switch was skipped during wallet connect.", err);
  }

  try {
    const chainIdHex = await requestProvider<string>(provider, "eth_chainId");
    return { wallet, chainId: Number.parseInt(chainIdHex, 16) };
  } catch {
    return { wallet, chainId: null };
  }
}

export async function ensureXLayerNetwork(provider = getInjectedProvider()) {
  if (!provider) throw new Error("No EVM wallet found.");
  const chainIdHex = await requestProvider<string>(provider, "eth_chainId");
  if (chainIdHex.toLowerCase() === ACTIVE_XLAYER.chainIdHex) return;

  try {
    await requestProvider(provider, "wallet_switchEthereumChain", [{ chainId: ACTIVE_XLAYER.chainIdHex }]);
  } catch (err) {
    const code = getProviderErrorCode(err);
    if (code !== 4902 && code !== "4902") {
      throw new Error(`Switch to ${ACTIVE_XLAYER.name} failed: ${providerErrorMessage(err)}`);
    }
    await requestProvider(provider, "wallet_addEthereumChain", [{
        chainId: ACTIVE_XLAYER.chainIdHex,
        chainName: ACTIVE_XLAYER.name,
        nativeCurrency: ACTIVE_XLAYER.nativeCurrency,
        rpcUrls: ACTIVE_XLAYER.rpcUrls,
        blockExplorerUrls: [ACTIVE_XLAYER.explorerUrl],
      }]);
  }
}

export async function sendPredictionProofTransaction(args: {
  from: string;
  profile: FanProfile | null;
  draft: DraftPrediction;
}) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No EVM wallet found.");
  await ensureXLayerNetwork(provider);

  void args.profile;
  const data = encodeFunctionData({
    abi: KNEWBALL_CUP_ABI,
    functionName: "submitPrediction",
    args: [
      matchIdToContractId(args.draft.matchId),
      winnerToContractPick(args.draft.winner),
      args.draft.homeScore,
      args.draft.awayScore,
      totalGoalsToContractPick(args.draft.overUnder),
      binaryToContractPick(args.draft.btts),
      firstGoalToContractPick(args.draft.firstGoal),
    ],
  });

  return requestProvider<string>(provider, "eth_sendTransaction", [{
      from: args.from,
      to: knewBallCupAddress(),
      value: "0x0",
      data,
  }]);
}

export async function sendResolveMatchTransaction(args: {
  from: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  firstGoal: "home" | "away" | "none";
}) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No EVM wallet found.");
  await ensureXLayerNetwork(provider);

  const data = encodeFunctionData({
    abi: KNEWBALL_CUP_ABI,
    functionName: "resolveMatch",
    args: [
      matchIdToContractId(args.matchId),
      args.homeScore,
      args.awayScore,
      firstGoalToContractPick(args.firstGoal),
    ],
  });

  return requestProvider<string>(provider, "eth_sendTransaction", [{
      from: args.from,
      to: knewBallCupAddress(),
      value: "0x0",
      data,
  }]);
}

export async function sendClaimBallIQTransaction(args: {
  from: string;
  matchId: string;
}) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No EVM wallet found.");
  await ensureXLayerNetwork(provider);

  const data = encodeFunctionData({
    abi: KNEWBALL_CUP_ABI,
    functionName: "claimBallIQ",
    args: [matchIdToContractId(args.matchId)],
  });

  return requestProvider<string>(provider, "eth_sendTransaction", [{
      from: args.from,
      to: knewBallCupAddress(),
      value: "0x0",
      data,
    }]);
}

export async function waitForTransactionReceipt(txHash: string) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No EVM wallet found.");

  for (let attempt = 0; attempt < 45; attempt += 1) {
    const receipt = await requestProvider<{ status?: string } | null>(
      provider,
      "eth_getTransactionReceipt",
      [txHash],
    );
    if (receipt) {
      if (receipt.status === "0x0") throw new Error("X Layer transaction reverted.");
      return receipt;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
  }

  throw new Error("X Layer receipt is still pending. Check the transaction and try again.");
}

export async function signWalletMessage(message: string) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No EVM wallet found.");
  const accounts = await requestProvider<string[]>(provider, "eth_accounts");
  const wallet = accounts[0];
  if (!wallet) throw new Error("Connect your wallet before signing.");

  try {
    return await requestProvider<string>(provider, "personal_sign", [message, wallet]);
  } catch (error) {
    const code = getProviderErrorCode(error);
    if (code === 4001 || code === "4001") throw error;
    return requestProvider<string>(provider, "personal_sign", [wallet, message]);
  }
}

export function explorerTxUrl(txHash: string) {
  return `${ACTIVE_XLAYER.explorerUrl}/tx/${txHash}`;
}

export function knewBallCupContractAddress() {
  return knewBallCupAddress();
}

export function xLayerNetworkLabel() {
  return ACTIVE_XLAYER.chainId === XLAYER_MAINNET.chainId ? "X Layer" : "X Layer Testnet";
}

export async function getLockedPrediction(matchId: string, wallet: string) {
  const contractMatchId = matchIdToContractId(matchId);
  const prediction = await activePublicClient.readContract({
    abi: KNEWBALL_CUP_ABI,
    address: knewBallCupAddress(),
    functionName: "predictions",
    args: [contractMatchId, wallet as Address],
  });

  if (!prediction[8]) return null;

  const txHash = await findPredictionSubmissionHash(contractMatchId, wallet);

  return {
    winner: winnerFromContractPick(prediction[0]),
    homeScore: prediction[1],
    awayScore: prediction[2],
    overUnder: totalGoalsFromContractPick(prediction[3]),
    btts: binaryFromContractPick(prediction[4]),
    firstGoal: firstGoalFromContractPick(prediction[5]),
    lockedAt: Number(prediction[6]) * 1000,
    claimed: prediction[9],
    txHash,
  } satisfies Pick<DraftPrediction, "winner" | "homeScore" | "awayScore" | "overUnder" | "btts" | "firstGoal"> & {
    lockedAt: number;
    claimed: boolean;
    txHash: string;
  };
}

export async function getResolvedMatchFromContract(matchId: string) {
  const contractMatchId = matchIdToContractId(matchId);
  const result = await activePublicClient.readContract({
    abi: KNEWBALL_CUP_ABI,
    address: knewBallCupAddress(),
    functionName: "results",
    args: [contractMatchId],
  });

  if (!result[7]) return null;
  const txHash = await findMatchResolvedHash(contractMatchId);

  return {
    homeScore: result[0],
    awayScore: result[1],
    winner: winnerFromContractPick(result[2]),
    firstGoal: firstGoalFromContractPick(result[3]),
    btts: binaryFromContractPick(result[4]),
    overUnder: totalGoalsFromContractPick(result[5]),
    resolvedAt: Number(result[6]) * 1000,
    txHash,
  };
}

async function findPredictionSubmissionHash(matchId: bigint, wallet: string) {
  try {
    let toBlock = await activePublicClient.getBlockNumber();

    // X Layer testnet RPC limits eth_getLogs ranges, so scan recent windows.
    for (let window = 0; window < 40; window += 1) {
      const fromBlock = toBlock > 99n ? toBlock - 99n : 0n;
      const events = await activePublicClient.getContractEvents({
        abi: KNEWBALL_CUP_ABI,
        address: knewBallCupAddress(),
        eventName: "PredictionSubmitted",
        args: { wallet: wallet as Address, matchId },
        fromBlock,
        toBlock,
      });

      const txHash = events[events.length - 1]?.transactionHash;
      if (txHash) return txHash;
      if (fromBlock === 0n) break;
      toBlock = fromBlock - 1n;
    }

    return "";
  } catch (error) {
    console.warn("Could not recover PredictionSubmitted transaction hash.", error);
    return "";
  }
}

async function findMatchResolvedHash(matchId: bigint) {
  try {
    let toBlock = await activePublicClient.getBlockNumber();

    for (let window = 0; window < 80; window += 1) {
      const fromBlock = toBlock > 99n ? toBlock - 99n : 0n;
      const events = await activePublicClient.getContractEvents({
        abi: KNEWBALL_CUP_ABI,
        address: knewBallCupAddress(),
        eventName: "MatchResolved",
        args: { matchId },
        fromBlock,
        toBlock,
      });

      const txHash = events[events.length - 1]?.transactionHash;
      if (txHash) return txHash;
      if (fromBlock === 0n) break;
      toBlock = fromBlock - 1n;
    }

    return "";
  } catch (error) {
    console.warn("Could not recover MatchResolved transaction hash.", error);
    return "";
  }
}

function knewBallCupAddress(): Address {
  const address = String(import.meta.env.VITE_KNEWBALL_CONTRACT_ADDRESS ?? "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Missing ${ACTIVE_XLAYER.name} KnewBallCup contract address.`);
  }
  return address as Address;
}

function matchIdToContractId(matchId: string) {
  if (!/^\d+$/.test(matchId)) throw new Error(`Match ${matchId} is missing an onchain numeric id.`);
  return BigInt(matchId);
}

function winnerToContractPick(value: DraftPrediction["winner"]) {
  if (value === "home") return 0;
  if (value === "draw") return 1;
  return 2;
}

function totalGoalsToContractPick(value: DraftPrediction["overUnder"]) {
  return value === "under" ? 0 : 1;
}

function binaryToContractPick(value: DraftPrediction["btts"]) {
  return value === "no" ? 0 : 1;
}

function firstGoalToContractPick(value: DraftPrediction["firstGoal"]) {
  if (value === "home") return 0;
  if (value === "away") return 1;
  return 2;
}

const activePublicClient = createPublicClient({
  chain: {
    id: ACTIVE_XLAYER.chainId,
    name: ACTIVE_XLAYER.name,
    nativeCurrency: ACTIVE_XLAYER.nativeCurrency,
    rpcUrls: { default: { http: ACTIVE_XLAYER.rpcUrls } },
  },
  transport: http(ACTIVE_XLAYER.rpcUrls[0]),
});

function winnerFromContractPick(value: number) {
  if (value === 0) return "home";
  if (value === 1) return "draw";
  return "away";
}

function totalGoalsFromContractPick(value: number) {
  return value === 0 ? "under" : "over";
}

function binaryFromContractPick(value: number) {
  return value === 0 ? "no" : "yes";
}

function firstGoalFromContractPick(value: number) {
  if (value === 0) return "home";
  if (value === 1) return "away";
  return "none";
}

async function requestProvider<T = unknown>(
  provider: Eip1193Provider,
  method: string,
  params?: unknown[],
) {
  try {
    return await provider.request<T>({ method, params });
  } catch (err) {
    const next = new Error(providerErrorMessage(err)) as Error & { code?: number | string };
    next.code = getProviderErrorCode(err);
    throw next;
  }
}

export function providerErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err) {
    const maybe = err as { message?: unknown; reason?: unknown; code?: unknown };
    const detail = maybe.message ?? maybe.reason;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (typeof maybe.code === "number" || typeof maybe.code === "string") return `Wallet error ${maybe.code}`;
  }
  return "Wallet request failed. Check that your wallet is unlocked and approve the popup.";
}

function getProviderErrorCode(err: unknown) {
  if (typeof err === "object" && err && "code" in err) {
    return (err as { code?: number | string }).code;
  }
  if (err instanceof Error) {
    const match = err.message.match(/\b(4001|4902|-?\d{4,})\b/);
    return match?.[1];
  }
  return undefined;
}
