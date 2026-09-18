import React, { useState, useCallback, useEffect } from 'react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract, ledger, pureCircuits } from '../managed/contract/index.js';
import { useWallet } from '../contexts/WalletContext';

function getCompiledContract(witnesses?: any) {
  return CompiledContract.make('ShadowCommit', Contract).pipe(
    witnesses ? CompiledContract.withWitnesses(witnesses) : CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(new URL('/managed', window.location.origin).toString()),
  ) as any;
}

export default function DevPage() {
  const { session, isConnected } = useWallet();
  const contractAddress = localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS') ?? '';

  // On-chain state
  const [totalClaims, setTotalClaims] = useState<string>('—');
  const [isActive, setIsActive] = useState<boolean | null>(null);

  // Claim form
  const [bountyName, setBountyName] = useState('');
  const [devGithubId, setDevGithubId] = useState('');
  const [devScore, setDevScore] = useState('');
  const [claimStatus, setClaimStatus] = useState<'idle' | 'proving' | 'success' | 'error'>('idle');
  const [claimError, setClaimError] = useState<string | null>(null);

  // Read on-chain state
  const refreshState = useCallback(async () => {
    if (!session || !contractAddress) return;
    try {
      const raw = await session.providers.publicDataProvider.queryContractState(contractAddress);
      if (raw?.data) {
        const state = ledger(raw.data);
        setTotalClaims(String(state.total_claims));
        setIsActive(state.is_active);
      }
    } catch (e) {
      console.error('Failed to read state:', e);
    }
  }, [session, contractAddress]);

  useEffect(() => {
    if (session && contractAddress) refreshState();
  }, [session, contractAddress, refreshState]);

  const handleClaim = useCallback(async () => {
    if (!session || !isConnected || !contractAddress) return;
    setClaimStatus('proving');
    setClaimError(null);
    try {
      const compiledContract = getCompiledContract();

      // 1. Hash bounty name to bounty_id (same as admin did)
      const nameBytes = new TextEncoder().encode(bountyName.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', nameBytes);
      const bountyId = new Uint8Array(hashBuffer);

      // 2. Hash GitHub ID to dev_id
      const githubBytes = new TextEncoder().encode(devGithubId.trim().toLowerCase());
      const devIdBuffer = await crypto.subtle.digest('SHA-256', githubBytes);
      const devId = new Uint8Array(devIdBuffer);

      // 3. Compute commitment
      const score = BigInt(devScore);
      const commitment = pureCircuits.make_credential_commitment(devId, score);

      // 4. Query current ledger state from indexer to find Merkle path
      const raw = await session.providers.publicDataProvider.queryContractState(contractAddress);
      if (!raw?.data) throw new Error('Contract state could not be loaded from indexer');
      const ledgerState = ledger(raw.data);
      const path = (ledgerState.oracle_credentials as any).findPathForLeaf(commitment);
      if (!path) {
        throw new Error('Credential not found in oracle Merkle tree. Ensure an admin has issued your credential.');
      }

      // 5. Build and submit transaction
      const witnesses = {
        dev_credential: () => ({
          dev_id: devId,
          score: score,
        }),
        find_credential_path: () => path,
      };
      const compiledContract = getCompiledContract(witnesses);
      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract,
        contractAddress,
        circuitId: 'claim_bounty',
        witnesses,
        args: [bountyId],
      });

      await submitTxAsync(session.providers as any, {
        unprovenTx: callTxData.private.unprovenTx,
      });

      setClaimStatus('success');
      await refreshState();
    } catch (e: any) {
      setClaimStatus('error');
      setClaimError(e?.message ?? String(e));
    }
  }, [session, isConnected, contractAddress, bountyName, devGithubId, devScore, refreshState]);

  return (
    <div className="dev-page">
      <h1>🕵️ ShadowCommit — Claim Bounties Anonymously</h1>
      <p className="tagline">Prove your reputation. Protect your identity.</p>

      {/* Connection Status */}
      {!isConnected && (
        <div className="card">
          <h2>Connect Wallet</h2>
          <p>Connect your anonymous 1AM wallet to start claiming bounties with zero-knowledge proofs.</p>
        </div>
      )}

      {!contractAddress && isConnected && (
        <div className="card">
          <p>⚠️ No contract deployed yet. Ask the admin to deploy first, or go to <a href="/admin">/admin</a>.</p>
        </div>
      )}

      {/* On-Chain Stats */}
      {contractAddress && isConnected && (
        <section className="card stats-card">
          <h2>📊 On-Chain Status</h2>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{totalClaims}</span>
              <span className="stat-label">Total Claims</span>
            </div>
            <div className="stat">
              <span className="stat-value">{isActive === null ? '—' : isActive ? '🟢 Active' : '🔴 Paused'}</span>
              <span className="stat-label">Protocol Status</span>
            </div>
          </div>
          <button onClick={refreshState} className="refresh-btn">↻ Refresh</button>
        </section>
      )}

      {/* Claim Bounty Form */}
      {contractAddress && isConnected && (
        <section className="card">
          <h2>🔐 Claim a Bounty</h2>
          <p className="hint">
            Your GitHub ID and score are submitted as <strong>private witnesses</strong> — they never leave your browser.
            A zero-knowledge proof verifies your credential in the Oracle's on-chain Merkle tree without revealing who you are.
          </p>

          <div className="form-group">
            <label htmlFor="claim-bounty-name">Bounty Name</label>
            <input
              id="claim-bounty-name"
              type="text"
              placeholder="e.g. Senior Rust Developer"
              value={bountyName}
              onChange={(e) => setBountyName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="claim-github-id">Your GitHub Username (private witness)</label>
            <input
              id="claim-github-id"
              type="text"
              placeholder="e.g. torvalds"
              value={devGithubId}
              onChange={(e) => setDevGithubId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="claim-score">Your Reputation Score (private witness)</label>
            <input
              id="claim-score"
              type="number"
              placeholder="e.g. 850"
              value={devScore}
              onChange={(e) => setDevScore(e.target.value)}
            />
          </div>

          <button
            id="claim-btn"
            onClick={handleClaim}
            disabled={claimStatus === 'proving' || !bountyName || !devGithubId || !devScore}
          >
            {claimStatus === 'proving' ? '🔄 Generating ZK Proof...' : '🛡️ Claim Bounty (ZK Proof)'}
          </button>

          {claimStatus === 'success' && (
            <div className="success-box">
              <p>✅ <strong>Bounty claimed successfully!</strong></p>
              <p>Your identity was never revealed. Only an anonymous nullifier was recorded on-chain.</p>
            </div>
          )}

          {claimStatus === 'error' && claimError && (
            <div className="error-box">
              <p>❌ Claim failed:</p>
              <pre>{claimError}</pre>
            </div>
          )}
        </section>
      )}

      {/* Privacy Explainer */}
      <section className="card privacy-card">
        <h2>🛡️ Privacy Model</h2>
        <div className="privacy-grid">
          <div>
            <h3>Observer CAN See</h3>
            <ul>
              <li>That <em>someone</em> claimed a bounty</li>
              <li>Total number of claims</li>
              <li>Bounty IDs and thresholds</li>
              <li>Anonymous nullifier hashes</li>
            </ul>
          </div>
          <div>
            <h3>Observer CANNOT See</h3>
            <ul>
              <li>Your GitHub identity</li>
              <li>Your actual reputation score</li>
              <li>Your wallet ↔ GitHub link</li>
              <li>Which Merkle leaf is yours</li>
              <li>Whether you claimed other bounties</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

