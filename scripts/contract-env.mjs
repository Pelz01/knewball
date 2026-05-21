import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const NETWORKS = {
  testnet: {
    id: 1952,
    name: "X Layer testnet",
    rpcUrl: "https://testrpc.xlayer.tech/terigon",
    explorerUrl: "https://www.okx.com/web3/explorer/xlayer-test",
  },
  mainnet: {
    id: 196,
    name: "X Layer",
    rpcUrl: "https://rpc.xlayer.tech",
    explorerUrl: "https://www.okx.com/web3/explorer/xlayer",
  },
};

loadEnvFile(".env.local");

export function getContractEnvironment() {
  const networkName = process.env.XLAYER_NETWORK ?? process.env.VITE_XLAYER_NETWORK ?? "testnet";
  const network = NETWORKS[networkName];
  if (!network) throw new Error(`Unsupported X Layer network: ${networkName}`);

  const chain = defineChain({
    id: network.id,
    name: network.name,
    nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
    rpcUrls: {
      default: { http: [process.env.XLAYER_RPC_URL ?? network.rpcUrl] },
    },
    blockExplorers: {
      default: { name: "OKX Explorer", url: network.explorerUrl },
    },
  });

  return {
    account: getAccount(),
    chain,
    explorerUrl: network.explorerUrl,
    transport: http(process.env.XLAYER_RPC_URL ?? network.rpcUrl),
  };
}

export function getContractAddress() {
  const address = process.env.KNEWBALL_CONTRACT_ADDRESS ?? process.env.VITE_KNEWBALL_CONTRACT_ADDRESS;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address ?? "")) {
    throw new Error("Set KNEWBALL_CONTRACT_ADDRESS or VITE_KNEWBALL_CONTRACT_ADDRESS.");
  }
  return address;
}

function getAccount() {
  const privateKey = process.env.KNEWBALL_DEPLOYER_PRIVATE_KEY;
  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey ?? "")) {
    throw new Error("Set KNEWBALL_DEPLOYER_PRIVATE_KEY to the owner wallet private key.");
  }
  return privateKeyToAccount(privateKey);
}

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;

    const key = trimmed.slice(0, separator).trim();
    if (process.env[key]) continue;
    process.env[key] = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}
