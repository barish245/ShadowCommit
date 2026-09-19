import React, { useState, useCallback, useEffect } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Lock, 
  FilePlus, 
  Check, 
  Loader2, 
  Database,
  ArrowRight
} from 'lucide-react';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { createUnprovenDeployTx, createUnprovenCallTx, submitTxAsync } from '@midnight-ntwrk/midnight-js-contracts';
import { sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits } from '../managed/contract/index.js';
import { useWallet } from '../contexts/WalletContext';
import { toHex, fromHex, waitForContractDeployment } from '../lib/midnight';

function getCompiledContract(witnesses?: any) {
  return CompiledContract.make('ShadowCommit', Contract).pipe(
    witnesses ? CompiledContract.withWitnesses(witnesses) : CompiledContract.withVacantWitnesses,
  ) as any;
}

export default function AdminPage() {
  const { session, isConnected, connect, address } = useWallet();

  // Deployment states
  const [status, setStatus] = useState<'idle' | 'deploying' | 'deployed' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(
    localStorage.getItem('DEPLOYED_CONTRACT_ADDRESS'),
  );
  const [copied, setCopied] = useState(false);

  // Contract On-Chain Telemetry
  const [totalClaims, setTotalClaims] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  // Form: Add Bounty
  const [bountyName, setBountyName] = useState('');
  const [bountyMinScore, setBountyMinScore] = useState('');
  const [bountyStatus, setBountyStatus] = useState<'idle' | 'adding' | 'added' | 'error'>('idle');
  const [bountyError, setBountyError] = useState<string | null>(null);

  // Form: Oracle Attestation
  const [credGithubUser, setCredGithubUser] = useState('');
  const [credScore, setCredScore] = useState('');
  const [credStatus, setCredStatus] = useState<'idle' | 'issuing' | 'issued' | 'error'>('idle');
  const [credError, setCredError] = useState<string | null>(null);
  const [issuedLeafHash, setIssuedLeafHash] = useState<string | null>(null);

  const refreshLedger = useCallback(async () => {
    if (!session || !deployedAddress) return;
    try {
      const raw = await session.providers.publicDataProvider.queryContractState(deployedAddress);
      if (raw?.data) {
        const l = ledger(raw.data);
        setTotalClaims(Number(l.total_claims));
        setIsActive(l.is_active);
      }
    } catch (e) {
      // ledger not ready or indexing
    }
  }, [session, deployedAddress]);

  useEffect(() => {
    if (session && deployedAddress) {
      refreshLedger();
    }
  }, [session, deployedAddress, refreshLedger]);

  const handleDeploy = useCallback(async () => {
    if (!session || !isConnected) return;
    setStatus('deploying');
    setErrorMsg(null);
    try {
      const compiledContract = getCompiledContract();

      const adminSecret = crypto.getRandomValues(new Uint8Array(32));
      localStorage.setItem('ADMIN_SECRET', toHex(adminSecret));

      const adminHash = pureCircuits.admin_public_key(adminSecret);

      const deployTxData = await createUnprovenDeployTx(session.providers as any, {
        compiledContract,
        args: [adminHash],
        privateStateId: 'DeployerState',
        initialPrivateState: {},
        signingKey: sampleSigningKey(),
      });

      const contractAddr = deployTxData.public.contractAddress;

      await submitTxAsync(session.providers as any, {
        unprovenTx: deployTxData.private.unprovenTx,
      });

      await waitForContractDeployment(session.providers.publicDataProvider, contractAddr);

      setDeployedAddress(contractAddr);
      localStorage.setItem('DEPLOYED_CONTRACT_ADDRESS', contractAddr);
      setStatus('deployed');
      await refreshLedger();
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? String(e));
    }
  }, [session, isConnected, refreshLedger]);

  const handleAddBounty = useCallback(async () => {
    if (!session || !isConnected || !deployedAddress) return;
    setBountyStatus('adding');
    setBountyError(null);
    try {
      const adminSecretHex = localStorage.getItem('ADMIN_SECRET');
      if (!adminSecretHex) throw new Error('Admin secret not found. Deploy contract first.');
      const adminSecret = fromHex(adminSecretHex);
      const compiledContract = getCompiledContract({
        admin_secret: () => adminSecret,
      });

      const nameBytes = new TextEncoder().encode(bountyName.trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', nameBytes);
      const bountyId = new Uint8Array(hashBuffer);

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract,
        contractAddress: deployedAddress,
        circuitId: 'add_bounty',
        witnesses: {
          admin_secret: () => adminSecret,
        },
        args: [bountyId, BigInt(bountyMinScore)],
      });

      await submitTxAsync(session.providers as any, {
        unprovenTx: callTxData.private.unprovenTx,
      });

      setBountyStatus('added');
      setBountyName('');
      setBountyMinScore('');
      await refreshLedger();
    } catch (e: any) {
      setBountyStatus('error');
      setBountyError(e?.message ?? String(e));
    }
  }, [session, isConnected, deployedAddress, bountyName, bountyMinScore, refreshLedger]);

  const handleIssueCredential = useCallback(async () => {
    if (!session || !isConnected || !deployedAddress) return;
    setCredStatus('issuing');
    setCredError(null);
    try {
      const adminSecretHex = localStorage.getItem('ADMIN_SECRET');
      if (!adminSecretHex) throw new Error('Admin secret not found. Deploy contract first.');
      const adminSecret = fromHex(adminSecretHex);
      const compiledContract = getCompiledContract({
        admin_secret: () => adminSecret,
      });

      const githubBytes = new TextEncoder().encode(credGithubUser.trim().toLowerCase());
      const hashBuffer = await crypto.subtle.digest('SHA-256', githubBytes);
      const devId = new Uint8Array(hashBuffer);

      const commitment = pureCircuits.make_credential_commitment(devId, BigInt(credScore));
      const commitmentHex = '0x' + Array.from(commitment, (b: number) => b.toString(16).padStart(2, '0')).join('');
      setIssuedLeafHash(commitmentHex);

      const callTxData = await createUnprovenCallTx(session.providers as any, {
        compiledContract,
        contractAddress: deployedAddress,
        circuitId: 'issue_credential',
        witnesses: {
          admin_secret: () => adminSecret,
        },
        args: [commitment],
      });

      await submitTxAsync(session.providers as any, {
        unprovenTx: callTxData.private.unprovenTx,
      });

      setCredStatus('issued');
      setCredGithubUser('');
      setCredScore('');
      await refreshLedger();
    } catch (e: any) {
      setCredStatus('error');
      setCredError(e?.message ?? String(e));
    }
  }, [session, isConnected, deployedAddress, credGithubUser, credScore, refreshLedger]);

  const copyAddress = () => {
    if (!deployedAddress) return;
    navigator.clipboard.writeText(deployedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="admin-page-root">
      <div className="page-header-container">
        <div className="page-header-text">
          <span className="section-eyebrow">ADMIN CONSOLE</span>
          <h1 className="page-title">Protocol Admin</h1>
          <p className="page-desc">
            Deploy contracts, attest developer credentials, and manage bounties.
          </p>
        </div>
      </div>

      <div className="admin-grid-layout">
        {/* Section 1: Contract Instance */}
        <div className="glass-card admin-card">
          <div className="card-header-clean flex-between">
            <div className="flex-inline items-center gap-2">
              <Database size={16} className="text-cyan" />
              <h3>Contract Instance</h3>
            </div>
            {deployedAddress && (
              <span className="status-badge-inline text-emerald">
                <CheckCircle2 size={12} className="inline mr-1" />
                Active
              </span>
            )}
          </div>

          <div className="admin-section-body">
            {deployedAddress ? (
              <div className="deployed-info-box">
                <div className="address-display-row">
                  <span className="label-mono">Address:</span>
                  <span className="val-mono font-mono text-cyan">
                    {deployedAddress.slice(0, 14)}...{deployedAddress.slice(-8)}
                  </span>
                  <div className="action-buttons-group">
                    <button onClick={copyAddress} className="btn-icon-tiny" title="Copy Address">
                      {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                    </button>
                    <a
                      href={`https://preprod.midnightexplorer.com/contracts/${deployedAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-icon-tiny"
                      title="View on Explorer"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                <div className="stats-row-admin">
                  <div className="stat-item-admin">
                    <span className="stat-label-admin">Claims</span>
                    <span className="stat-val-admin font-mono">{totalClaims ?? '0'}</span>
                  </div>
                  <div className="stat-item-admin">
                    <span className="stat-label-admin">Network</span>
                    <span className="stat-val-admin font-mono">Preprod</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-deploy-prompt">
                <p className="text-muted text-sm mb-3">No contract deployed in this session.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="inline-error-banner mb-3">
                <AlertCircle size={14} className="text-amber shrink-0" />
                <span className="text-xs font-mono">{errorMsg}</span>
              </div>
            )}

            {!isConnected ? (
              <button onClick={() => connect()} className="btn-secondary-outline w-full">
                <span>Connect 1AM Wallet</span>
              </button>
            ) : (
              <button 
                onClick={handleDeploy} 
                disabled={status === 'deploying'} 
                className="btn-primary-glow w-full"
              >
                {status === 'deploying' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deploying to Preprod...</span>
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    <span>{deployedAddress ? 'Redeploy Instance' : 'Deploy Instance'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Oracle Credential Attestation */}
        <div className="glass-card admin-card">
          <div className="card-header-clean">
            <ShieldCheck size={16} className="text-emerald" />
            <h3>Oracle Attestation</h3>
          </div>

          <div className="admin-section-body">
            <div className="form-group">
              <label htmlFor="cred-github">GitHub Handle</label>
              <input
                id="cred-github"
                type="text"
                className="form-input"
                placeholder="e.g. torvalds"
                value={credGithubUser}
                onChange={(e) => setCredGithubUser(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cred-score">Verified Score</label>
              <input
                id="cred-score"
                type="number"
                className="form-input"
                placeholder="e.g. 850"
                value={credScore}
                onChange={(e) => setCredScore(e.target.value)}
              />
            </div>

            {credStatus === 'issued' && (
              <div className="inline-success-banner mb-3">
                <CheckCircle2 size={14} className="text-emerald shrink-0" />
                <span className="text-xs">Attestation committed to Merkle tree</span>
              </div>
            )}

            {credStatus === 'error' && (
              <div className="inline-error-banner mb-3">
                <AlertCircle size={14} className="text-amber shrink-0" />
                <span className="text-xs">{credError}</span>
              </div>
            )}

            <button
              onClick={handleIssueCredential}
              disabled={credStatus === 'issuing' || !deployedAddress || !credGithubUser || !credScore}
              className="btn-primary-glow w-full"
            >
              {credStatus === 'issuing' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Attesting...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Attest Credential</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 3: Add Bounty */}
        <div className="glass-card admin-card">
          <div className="card-header-clean">
            <FilePlus size={16} className="text-violet" />
            <h3>Publish Bounty</h3>
          </div>

          <div className="admin-section-body">
            <div className="form-group">
              <label htmlFor="bounty-title">Bounty Title</label>
              <input
                id="bounty-title"
                type="text"
                className="form-input"
                placeholder="e.g. Compact ZK Bridge"
                value={bountyName}
                onChange={(e) => setBountyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="bounty-min-score">Min Score Required</label>
              <input
                id="bounty-min-score"
                type="number"
                className="form-input"
                placeholder="e.g. 600"
                value={bountyMinScore}
                onChange={(e) => setBountyMinScore(e.target.value)}
              />
            </div>

            {bountyStatus === 'added' && (
              <div className="inline-success-banner mb-3">
                <CheckCircle2 size={14} className="text-emerald shrink-0" />
                <span className="text-xs">Bounty published on-chain</span>
              </div>
            )}

            {bountyStatus === 'error' && (
              <div className="inline-error-banner mb-3">
                <AlertCircle size={14} className="text-amber shrink-0" />
                <span className="text-xs">{bountyError}</span>
              </div>
            )}

            <button
              onClick={handleAddBounty}
              disabled={bountyStatus === 'adding' || !deployedAddress || !bountyName || !bountyMinScore}
              className="btn-secondary-outline w-full"
            >
              {bountyStatus === 'adding' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <FilePlus size={16} />
                  <span>Publish Bounty</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
