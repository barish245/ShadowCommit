# ShadowCommit: Zero-Knowledge Developer Reputation & Bounty Protocol

## 1. The Core Friction (The Problem)

In the open-source and Web3 ecosystem, a developer's **reputation is permanently tied to their real-world identity** (their primary GitHub account, Twitter, or doxxed wallet). This creates a massive friction point for three types of developers:

1. **The Moonlighter**: A senior engineer at a Web2 megacorp (e.g., Google, Apple) wants to contribute to DeFi protocols or claim lucrative bug bounties, but their employment contract strictly forbids outside work. 
2. **The Geopolitically Restricted**: Brilliant developers in restrictive regimes want to contribute to privacy tools or decentralized infrastructure, but doing so under their real identity risks severe legal retaliation.
3. **The Meritocratic Contributor**: Developers who face bias based on geography, gender, or background who want their code reviewed purely on merit and past performance.

**The Catch-22**: If these developers use their real GitHub, they get doxxed and face consequences. If they create a fresh, anonymous "burner" account, they have zero reputation—maintainers ignore their PRs, and they are disqualified from high-tier bug bounties that require verified experience.

## 2. The Solution: ShadowCommit

**ShadowCommit** is a dev-tooling protocol built on the Midnight Network that completely decouples **reputation** from **identity**. 

It allows developers to prove they possess elite credentials (e.g., "I have >1,000 GitHub stars," "I have merged code into `bitcoin/bitcoin`," or "I am a Y-Combinator alumni") to unlock repository access or claim bounties **under a completely untraceable pseudonym**.

### How the User Experience Works:
1. **The Attestation Phase (Off-chain):** The developer connects their real GitHub to an oracle (a trusted signer). The oracle verifies their stats and issues a signed credential (a JSON Web Token or Schnorr signature) containing their metrics.
2. **The Shadow Phase (Midnight Contract):** The developer logs into a Web3 bounty platform with a fresh, anonymous 1AM wallet. 
3. **The ZK Proof:** Instead of linking their GitHub, the developer submits their signed credential as a **private witness** to the Midnight smart contract. 
4. **The Gate:** The Compact circuit verifies the oracle's signature and asserts that the developer's hidden stats meet the bounty's requirements (e.g., `assert(witness.commits > 500)`).
5. **The Result:** The developer is instantly granted access to the bounty or repository. The smart contract records a **nullifier** (to prevent them from claiming the same bounty twice with the same credential), but their real GitHub identity is completely hidden from the blockchain, the repository maintainer, and the public.

---

## 3. Midnight Network Architecture

This leverages the **Confidential Credentials** and **Private Allowlist** patterns from the Midnight developer guide.

### Ledger State (Public)
*   `oracle_public_key: Bytes<32>`: The trusted authority that signs GitHub stats.
*   `bounty_requirements: Map<Bytes<32>, Uint<32>>`: A mapping of Bounty IDs to the required reputation score (e.g., minimum commits).
*   `claimed_nullifiers: Set<Bytes<32>>`: Prevents a single high-rep developer from spam-claiming bounties under 100 different pseudonyms.

### Private Witnesses (Never Disclosed)
*   `developer_real_id: Bytes<32>`: The hash of their actual GitHub ID.
*   `reputation_score: Uint<32>`: Their actual commit/star count.
*   `oracle_signature: Bytes<64>`: The cryptographic proof that the oracle verified this data.

### The Core Compact Circuit
When a developer applies for a bounty, the circuit performs the following *in zero-knowledge*:
1. **Verify Authenticity**: Check that `oracle_signature` is a valid signature over `[developer_real_id, reputation_score]` using the public `oracle_public_key`.
2. **Verify Eligibility**: `assert(reputation_score >= bounty_requirements[bounty_id])`.
3. **Prevent Sybil Attacks**: Compute `nullifier = persistentHash([bounty_id, developer_real_id])`.
4. **State Update**: `assert(!claimed_nullifiers.member(nullifier))` and then `claimed_nullifiers.insert(nullifier)`.

**Privacy Guarantee**: An observer looking at the Midnight blockchain only sees that *someone* who met the criteria claimed the bounty. They do not know who, and they do not know the developer's exact reputation score.

---

## 4. Hackathon Phased Delivery Plan (Levels 1-4)

If we build this, here is how it maps perfectly to the "New Moon to Full" hackathon requirements:

### Level 1 (New Moon) - The Contract
*   Write `shadowcommit.compact` implementing the signature verification, threshold assertion, and nullifier logic.
*   Compile and deploy to the Midnight Preprod network.
*   *Deliverable:* Working Compact code and deployed contract address.

### Level 2 (Waxing Crescent) - The Dev-Facing UI
*   Build a React/Vite frontend tailored for developers.
*   Integrate the 1AM wallet for the "burner" pseudonym.
*   Implement a mock "Oracle" backend script that generates the signed witness data.
*   *Deliverable:* UI where a user connects a wallet, uploads their credential, and sees the ZK proof generate and submit.

### Level 3 (First Quarter) - The Bounty Platform (Production Grade)
*   Expand the frontend into a two-sided marketplace: 
    *   **Maintainer View**: Post bounties with reputation requirements.
    *   **Developer View**: Browse bounties and generate ZK proofs of eligibility.
*   Implement Vitest test suites verifying that invalid signatures or low scores fail the circuit.
*   Setup GitHub Actions CI/CD.
*   *Deliverable:* A polished, end-to-end dApp demonstrating real utility.

### Level 4 (Waxing Gibbous) - MVP Launch
*   Deploy the frontend to Vercel.
*   Write a comprehensive `README.md` explaining the cryptography and the exact privacy model (what is leaked vs. what is hidden).
*   Launch a demo video showing a developer claiming a "Senior Rust Dev" bounty without ever revealing their GitHub.

---

## 5. Why this is a Winning Idea
1. **Solves a Real Web3 Problem**: The industry desperately needs sybil-resistant reputation, but current solutions (like POAPs or Soulbound Tokens) are fundamentally anti-privacy and permanently doxx users.
2. **Perfect Use of Midnight**: You literally cannot build this safely on Ethereum. If you submit a credential on Ethereum, it's public forever. Midnight's local proof generation is the *only* way to do this.
3. **Developer Appeal**: Hackathon judges are developers. Building a tool *for* developers that protects their freedom and privacy resonates deeply with the Web3 ethos.
