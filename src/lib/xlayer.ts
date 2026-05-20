import type { DraftPrediction, FanProfile } from "./store";
import { MATCHES } from "./match-data";

export const XLAYER_TESTNET = {
  chainId: 1952,
  chainIdHex: "0x7a0",
  name: "X Layer testnet",
  rpcUrls: ["https://testrpc.xlayer.tech/terigon", "https://xlayertestrpc.okx.com/terigon"],
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer-test",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
} as const;

export const XLAYER_MAINNET = {
  chainId: 196,
  chainIdHex: "0xc4",
  name: "X Layer mainnet",
  rpcUrls: ["https://rpc.xlayer.tech", "https://xlayerrpc.okx.com"],
  explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
} as const;

export const ACTIVE_XLAYER =
  import.meta.env.VITE_XLAYER_NETWORK === "mainnet" ? XLAYER_MAINNET : XLAYER_TESTNET;

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

  const match = MATCHES.find((m) => m.id === args.draft.matchId);
  const payload = {
    app: "KnewBall",
    action: "submitPrediction",
    chain: ACTIVE_XLAYER.name,
    wallet: args.from,
    profile: args.profile ? {
      displayName: args.profile.displayName,
      country: args.profile.country,
    } : null,
    match: match ? {
      id: match.id,
      home: match.home.code,
      away: match.away.code,
      kickoff: match.kickoff,
    } : { id: args.draft.matchId },
    prediction: {
      winner: args.draft.winner,
      homeScore: args.draft.homeScore,
      awayScore: args.draft.awayScore,
      overUnder: args.draft.overUnder,
      bothTeamsToScore: args.draft.btts,
      firstGoal: args.draft.firstGoal,
    },
    lockedAtClient: new Date().toISOString(),
    proofVersion: 1,
  };

  const data = utf8ToHex(JSON.stringify(payload));
  return requestProvider<string>(provider, "eth_sendTransaction", [{
      from: args.from,
      to: args.from,
      value: "0x0",
      data,
    }]);
}

export function explorerTxUrl(txHash: string) {
  return `${ACTIVE_XLAYER.explorerUrl}/tx/${txHash}`;
}

function utf8ToHex(value: string) {
  const bytes = new TextEncoder().encode(value);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
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
