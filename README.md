# ShadowCommit

[![CI](https://github.com/barish245/ShadowCommit/actions/workflows/ci.yaml/badge.svg)](https://github.com/barish245/ShadowCommit/actions/workflows/ci.yaml)

> **Prove your developer reputation without revealing your identity.** Zero-knowledge bounty claims on the Midnight Network.

## Live Demo & Video

- **Demo Video**: [Watch Full Demo Video (Google Drive)](https://drive.google.com/file/d/10Pvgt_9Hp61vneGx4GJh6fzv9B3uo1vW/view?usp=sharing)
- **App**: _Coming soon_ <!-- https://shadowcommit.vercel.app -->
- **Contract (Preprod)**: `c3a77cb03c27e0a9d119b14238497db9169ad3860e9ae2815b263021e3ddff5d`
- **Explorer**: https://explorer.1am.xyz/contract/c3a77cb03c27e0a9d119b14238497db9169ad3860e9ae2815b263021e3ddff5d
- **Deployment Tx**: https://explorer.1am.xyz/tx/3f6a4aef289c86e0870356cd971734889179adb0ca41d8a6837081939d852053?network=preprod

---

## Application Screenshots

### 1. Protocol Overview & Terminal
![Protocol Overview](assets/ss1.png)

### 2. Developer Bounties Marketplace
![Developer Bounties Marketplace](assets/ss2.png)

### 3. Client-Side ZK Prover Studio
![ZK Prover Studio](assets/ss3.png)

---

## What is ShadowCommit?

ShadowCommit decouples **developer reputation** from **identity**. It lets developers prove they have elite credentials (GitHub stars, commits, merged PRs) to claim bounties — all **under a completely untraceable pseudonym**.

### The Problem
- **Moonlighters**: Senior engineers at Web2 companies who can't publicly contribute to Web3.
- **Geopolitically restricted**: Developers in restrictive regimes who face legal risk.
- **Merit seekers**: Developers who want their code judged purely on quality, not identity.

### The Solution
A Compact smart contract on Midnight Network that verifies **private credentials** using zero-knowledge proofs. Developers prove they meet a bounty's requirements without revealing who they are.

---

## Privacy Model

| Observer CAN see | Observer CANNOT see |
|---|---|
| That *someone* claimed a bounty | Who the developer is (GitHub ID) |
| Total number of claims | The developer's actual reputation score |
| Bounty IDs and score thresholds | The oracle's secret key |
| Anonymous nullifier hashes | The link between wallet and GitHub identity |
| That the protocol is active/paused | Whether the same person claimed different bounties |

---

## Architecture

```
┌───────────────────────────────────────────────────────┐
│                     Developer                          │
│  (anonymous 1AM wallet — no link to real identity)    │
└──────────────────────┬────────────────────────────────┘
                       │  Private witnesses:
                       │  - dev_id (hashed GitHub)
                       │  - score (reputation)
                       │  - oracle_secret (credential)
                       ▼
┌───────────────────────────────────────────────────────┐
│              ShadowCommit Compact Contract             │
│                                                        │
│  1. Verify oracle signed the credential                │
│  2. Assert score >= bounty threshold                   │
│  3. Compute nullifier = hash(bounty_id, dev_id)       │
│  4. Check nullifier not already claimed                │
│  5. Insert nullifier + increment counter               │
│                                                        │
│  PUBLIC: nullifier, total_claims, bounty map           │
│  PRIVATE: dev_id, score, oracle_secret                 │
└───────────────────────────────────────────────────────┘
```

---

## Setup

### Prerequisites
- Node.js >= 22
- Yarn 1.22.22
- Docker Desktop
- Compact Compiler 0.31.0
- 1AM Wallet (Chrome extension)

### Install & Compile

```bash
git clone https://github.com/barish245/ShadowCommit.git
cd ShadowCommit
yarn install
yarn compile
```

### Local Development

```bash
# Start the local Midnight network (Docker)
yarn env:up

# Wait for DUST tokens to accrue
npx vite-node scripts/wait-for-dust.ts

# Run tests
yarn test:local

# Start frontend
cd frontend