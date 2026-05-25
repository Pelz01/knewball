# KnewBall

KnewBall turns World Cup predictions into onchain fan reputation on X Layer.

Fans lock their calls before kickoff, results resolve onchain, correct reads earn Ball IQ, and every take gets a public proof page that cannot be edited after the match starts.

## Live Contract

- X Layer mainnet contract: `0x3b9f102f8e98d2a0a9b3d5b9a2e858d1730dd3b0`
- Mainnet deploy tx: `0xe4e7be75cb5525c0ca3d717c0635d38cdf9444762c5f7b65cfec20cc7b341308`
- X Layer testnet contract: `0x90ffd033b4384b07774a5a0c39ef7c1177464fbf`

## What It Does

- Create a fan profile with wallet signature verification.
- Lock a match prediction on KnewBallCup before kickoff.
- Sync the verified transaction into Supabase after the X Layer receipt succeeds.
- Resolve match results on X Layer through admin or automated resolver flow.
- Claim Ball IQ through the contract.
- Show a Matchday Verdict with correct reads, points, badges, and current form.
- Publish public proof receipts at `/proof/:predictionId`.
- Rank fans and countries through Supabase-backed leaderboards.

## Architecture

```text
KnewBallCup contract = proof truth
Supabase = product memory
Vercel frontend = fan experience
```

The contract handles:

- match creation
- prediction locking
- kickoff anti-cheat
- result resolution
- one-time Ball IQ claim

Supabase handles:

- profiles
- prediction history
- badges
- proof page display cache
- current form
- leaderboards
- automated result workflow

## Core Flow

```text
connect wallet
create profile
lock prediction on X Layer
sync prediction to Supabase
resolve result on X Layer
sync result to Supabase
claim Ball IQ
sync claim to Supabase
show verdict, proof, profile, leaderboard
```

## Local Setup

```bash
npm install
npm run dev
```

Required local env:

```env
VITE_XLAYER_NETWORK=testnet
VITE_KNEWBALL_CONTRACT_ADDRESS=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
KNEWBALL_DEPLOYER_PRIVATE_KEY=
XLAYER_RPC_URL=https://xlayertestrpc.okx.com/terigon
API_FOOTBALL_KEY=
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
```

## Useful Commands

```bash
npm run build
npm run contract:deploy
npm run contract:seed
npm run prepare:auto-test -- --match-id=1003 --minutes=6
npm run auto-resolve -- --dry-run=true --limit=5
npm run auto-resolve -- --dry-run=false --limit=5
```

## Demo Line

KnewBall turns football takes into proof-of-ball reputation on X Layer.
