# KnewBall

KnewBall turns World Cup predictions into onchain fan reputation on X Layer.

Fans lock their football calls before kickoff, match results resolve onchain, correct calls earn Ball IQ, and every take gets a public proof page that cannot be edited after the match starts.

No odds. No wagers. Just proof that you knew ball.

## Live Contract

X Layer mainnet contract:

```text
0x3b9f102f8e98d2a0a9b3d5b9a2e858d1730dd3b0
```

Mainnet deploy tx:

```text
0xe4e7be75cb5525c0ca3d717c0635d38cdf9444762c5f7b65cfec20cc7b341308
```

X Layer testnet contract:

```text
0x90ffd033b4384b07774a5a0c39ef7c1177464fbf
```

## What It Does

KnewBall lets football fans:

- create a fan profile with wallet signature verification
- lock match predictions on X Layer before kickoff
- prove their calls were made before the match started
- resolve match results onchain through admin or automated resolver flow
- claim Ball IQ through the KnewBallCup contract
- unlock Matchday Verdicts, badges, and Current Form
- share public proof receipts at `/proof/:predictionId`
- compete on Top Fans and Country Form leaderboards

## Architecture

KnewBall uses three layers:

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
- one-time Ball IQ claims

Supabase handles:

- fan profiles
- prediction history
- badges
- proof page display cache
- Current Form
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
show verdict, proof, profile, and leaderboard
```

## Automated Result Resolution

KnewBall includes an automated resolver flow.

For production fixtures, each match can be mapped to an external sports data fixture ID. The resolver checks finished matches, submits `resolveMatch()` on X Layer, then syncs the verified result into Supabase.

For testnet and demo flows, KnewBall supports a mock provider so the full result resolution loop can be tested without waiting for real World Cup matches.

Manual admin resolution remains available as a fallback.

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
