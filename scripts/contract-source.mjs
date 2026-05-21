import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import solc from "solc";

export function compileKnewBallCup() {
  const sourcePath = resolve(process.cwd(), "contracts", "KnewBallCup.sol");
  const input = {
    language: "Solidity",
    sources: {
      "KnewBallCup.sol": { content: readFileSync(sourcePath, "utf8") },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((error) => error.severity === "error") ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
  }

  const contract = output.contracts["KnewBallCup.sol"].KnewBallCup;
  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  };
}
