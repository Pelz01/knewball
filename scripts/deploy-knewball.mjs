import { createPublicClient, createWalletClient } from "viem";
import { getContractEnvironment } from "./contract-env.mjs";
import { compileKnewBallCup } from "./contract-source.mjs";

const { account, chain, explorerUrl, transport } = getContractEnvironment();
const { abi, bytecode } = compileKnewBallCup();
const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ account, chain, transport });

console.log(`Deploying KnewBallCup to ${chain.name} (${chain.id})`);
console.log(`Owner wallet: ${account.address}`);

const hash = await walletClient.deployContract({ abi, account, bytecode });
console.log(`Deploy tx: ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (!receipt.contractAddress) throw new Error("Deployment receipt did not include a contract address.");

console.log(`Contract address: ${receipt.contractAddress}`);
console.log(`Explorer: ${explorerUrl}/address/${receipt.contractAddress}`);
console.log("Set these values before seeding and frontend testing:");
console.log(`VITE_XLAYER_NETWORK=${chain.id === 196 ? "mainnet" : "testnet"}`);
console.log(`VITE_KNEWBALL_CONTRACT_ADDRESS=${receipt.contractAddress}`);
