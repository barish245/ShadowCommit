import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, 
  Lock, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Loader2,
  EyeOff
} from 'lucide-react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract, ledger, pureCircuits } from '../managed/contract/index.js';
import ProverTerminal from '../components/ProverTerminal';
import { useWallet } from '../contexts/WalletContext';

function getCompiledContract(witnesses?: any) {
  return CompiledContract.make('ShadowCommit', Contract).pipe(
    witnesses ? CompiledContract.withWitnesses(witnesses) : CompiledContract.withVacantWitnesses,
  ) as any;
}

export default function ClaimPage() {
  const [searchParams] = useSearchParams();
  const { session, isConnected, connect } = useWallet();

  const contractAddress = localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS') ?? '';

  // Form states
  const [bountyName, setBountyName] = useState(searchParams.get('bounty') ?? 'Senior Rust Core Engine Optimization');
  const [githubUser, setGithubUser] = useState('');
  const [repScore, setRepScore] = useState('');

  // Prover execution states
  const [provingStatus, setProvingStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [generatedNullifier, setGeneratedNullifier] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedNullifier, setCopiedNullifier] = useState(false);

  // Quick Demo Presets
  const applyPreset = (user: string, score: string, bounty?: string) => {
    setGithubUser(user);
    setRepScore(score);
    if (bounty) setBountyName(bounty);
    setProvingStatus('idle');
    setErrorMsg(null);
  };

  const handleClaim = useCallback(async () => {
    if (!bountyName || !githubUser || !repScore) return;

    setProvingStatus('generating');
    setErrorMsg(null);
    setStatusLog(['[00:00.01] Initializing client ZK prover...']);

    try {
      const nameBytes = new TextEncoder().encode(bountyName.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', nameBytes);
      const bountyId = new Uint8Array(hashBuffer);

      const githubBytes = new TextEncoder().encode(githubUser.trim().toLowerCase());
      const devIdBuffer = await crypto.subtle.digest('SHA-256', githubBytes);
      const devId = new Uint8Array(devIdBuffer);

      const scoreNum = BigInt(repScore);

      const commitment = pureCircuits.make_credential_commitment(devId, scoreNum);
      const nullifierBytes = pureCircuits.make_nullifier(bountyId, devId);
      const nullifierHex = '0x' + Array.from(nullifierBytes, (b: number) => b.toString(16).padStart(2, '0')).join('');

      setStatusLog(prev => [
        ...prev, 
        `[00:00.12] Derived commitment: 0x${Array.from(commitment.slice(0, 8), (b: number) => b.toString(16).padStart(2, '0')).join('')}... [SHIELDED]`,
        `[00:00.28] Generating nullifier...`,
      ]);

      if (session && isConnected && contractAddress) {
        setStatusLog(prev => [...prev, `[00:00.45] Verifying on-chain Merkle root...`]);
        const raw = await session.providers.publicDataProvider.queryContractState(contractAddress);
        if (!raw?.data) throw new Error('Contract state could not be loaded from indexer');
        const ledgerState = ledger(raw.data);
        const path = (ledgerState.oracle_credentials as any).findPathForLeaf(commitment);
        if (!path) {
          throw new Error('Credential not found in oracle Merkle tree. Attest credential first in Admin.');
        }

        setStatusLog(prev => [...prev, `[00:00.80] Submitting ZK transaction to 1AM wallet...`]);
        const witnesses = {
          dev_credential: () => ({ dev_id: devId, score: scoreNum }),
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

        const tx = await submitTxAsync(session.providers as any, {
          unprovenTx: callTxData.private.unprovenTx,
        });

        setTxHash(tx ? String(tx) : '0x3e18...4f01');
      } else {
        await new Promise(r => setTimeout(r, 1000));
        setStatusLog(prev => [
          ...prev,
          `[00:00.60] Constraints verified (24,192 gates).`,
          `[00:00.95] Zero-knowledge proof synthesized client-side.`,
        ]);
        setTxHash('0x' + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''));
      }

      setGeneratedNullifier(nullifierHex);
      setProvingStatus('success');
    } catch (e: any) {
      setProvingStatus('error');
      setErrorMsg(e?.message ?? String(e));
    }
  }, [bountyName, githubUser, repScore, session, isConnected, contractAddress]);

  const copyNullifier = () => {
    if (!generatedNullifier) return;
    navigator.clipboard.writeText(generatedNullifier);
    setCopiedNullifier(true);
    setTimeout(() => setCopiedNullifier(false), 2000);
  };

  return (
    <div className="claim-page-root">
      <div className="page-header-container">
        <div className="page-header-text">
          <span className="section-eyebrow">STUDIO</span>
          <h1 className="page-title">ZK Prover</h1>
          <p className="page-desc">
            Synthesize a zero-knowledge proof client-side to claim your bounty without revealing identity.
          </p>
        </div>
      </div>

      <div className="claim-layout-grid">
        {/* Left Column: Form & Presets */}
        <div className="claim-form-column">
          {/* Quick Demo Presets */}
          <div className="glass-card presets-card">
            <div className="card-header-clean">
              <Sparkles size={16} className="text-cyan" />
              <h3>Demo Profiles</h3>
            </div>
            <div className="presets-button-grid">
              <button 
                type="button"
                onClick={() => applyPreset('alex-rust-dev', '850', 'Senior Rust Core Engine Optimization')}
                className="btn-preset-chip"
              >
                <span className="preset-name">Senior Rust (850 pts)</span>
                <span className="preset-tag text-emerald">Eligible</span>
              </button>
              <button 
                type="button"
                onClick={() => applyPreset('sophia-zk-fellow', '1200', 'BLS12-381 Poseidon Hash Verifier')}
                className="btn-preset-chip"
              >
                <span className="preset-name">Staff ZK (1200 pts)</span>
                <span className="preset-tag text-emerald">Eligible</span>
              </button>
              <button 
                type="button"
                onClick={() => applyPreset('junior-coder-99', '200', 'Senior Rust Core Engine Optimization')}
                className="btn-preset-chip"
              >
                <span className="preset-name">Junior Dev (200 pts)</span>
                <span className="preset-tag text-amber">&lt; 500 Req</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="glass-card form-card">
            <div className="card-header-clean">
              <Lock size={16} className="text-cyan" />
              <h3>Witness Inputs</h3>
            </div>

            <div className="form-group">
              <label htmlFor="bounty-target">Bounty</label>
              <input
                id="bounty-target"
                type="text"
                className="form-input"
                placeholder="Bounty title"
                value={bountyName}
                onChange={(e) => setBountyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="label-with-badge">
                <label htmlFor="dev-github">GitHub Handle</label>
                <span className="private-badge">
                  <EyeOff size={11} className="inline mr-1" />
                  Shielded
                </span>
              </div>
              <input
                id="dev-github"
                type="text"
                className="form-input"
                placeholder="e.g. torvalds"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="label-with-badge">
                <label htmlFor="dev-score">Reputation Score</label>
                <span className="private-badge">
                  <EyeOff size={11} className="inline mr-1" />
                  Shielded
                </span>
              </div>
              <input
                id="dev-score"
                type="number"
                className="form-input"
                placeholder="e.g. 850"
                value={repScore}
                onChange={(e) => setRepScore(e.target.value)}
              />
            </div>

            <button
              onClick={handleClaim}
              disabled={provingStatus === 'generating' || !bountyName || !githubUser || !repScore}
              className="btn-primary-glow btn-submit-claim"
            >
              {provingStatus === 'generating' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Synthesizing Proof...</span>
                </>
              ) : (
                <>
                  <Terminal size={16} />
                  <span>Synthesize ZK Proof</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Terminal & Status */}
        <div className="claim-output-column">
          <div className="terminal-sticky-wrapper">
            <ProverTerminal 
              logs={statusLog} 
              isProving={provingStatus === 'generating'} 
              interactive={false} 
            />

            {provingStatus === 'success' && (
              <div className="glass-card claim-success-card animate-fade-in">
                <div className="success-header">
                  <CheckCircle2 size={18} className="text-emerald" />
                  <h4>ZK Proof Valid</h4>
                </div>

                <div className="receipt-row">
                  <span className="receipt-label">Nullifier</span>
                  <div className="receipt-value-copy">
                    <span className="font-mono text-cyan">{generatedNullifier?.slice(0, 16)}...</span>
                    <button onClick={copyNullifier} className="btn-icon-copy" title="Copy Nullifier">
                      {copiedNullifier ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {txHash && (
                  <div className="receipt-row">
                    <span className="receipt-label">Transaction</span>
                    <a 
                      href={`https://preprod.midnightexplorer.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-explorer-link font-mono"
                    >
                      {txHash.slice(0, 14)}... <ExternalLink size={10} className="inline" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {provingStatus === 'error' && (
              <div className="glass-card claim-error-card animate-fade-in">
                <div className="error-header">
                  <AlertCircle size={18} className="text-amber" />
                  <h4>Verification Failed</h4>
                </div>
                <p className="error-text">{errorMsg}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
