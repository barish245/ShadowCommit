import React, { useState } from 'react';
import { 
  Lock, 
  Cpu, 
  Code2,
  Database
} from 'lucide-react';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'circuits' | 'privacy' | 'network'>('circuits');

  return (
    <div className="docs-page-root">
      <div className="page-header-container">
        <div className="page-header-text">
          <span className="section-eyebrow">SPECIFICATION</span>
          <h1 className="page-title">Documentation</h1>
          <p className="page-desc">
            Compact smart contract specifications and zero-knowledge privacy model.
          </p>
        </div>
      </div>

      <div className="docs-tabs-row">
        <button 
          onClick={() => setActiveTab('circuits')}
          className={`docs-tab-btn ${activeTab === 'circuits' ? 'docs-tab-active' : ''}`}
        >
          <Code2 size={15} />
          <span>Circuits</span>
        </button>
        <button 
          onClick={() => setActiveTab('privacy')}
          className={`docs-tab-btn ${activeTab === 'privacy' ? 'docs-tab-active' : ''}`}
        >
          <Lock size={15} />
          <span>Privacy & Salts</span>
        </button>
        <button 
          onClick={() => setActiveTab('network')}
          className={`docs-tab-btn ${activeTab === 'network' ? 'docs-tab-active' : ''}`}
        >
          <Cpu size={15} />
          <span>Midnight Network</span>
        </button>
      </div>

      {activeTab === 'circuits' && (
        <div className="docs-content-container animate-fade-in">
          <div className="glass-card docs-card mb-6">
            <h2 className="docs-section-heading">Ledger State</h2>
            <div className="code-snippet-box font-mono">
              <span className="code-kw">export ledger</span> oracle_credentials: <span className="code-type">MerkleTree&lt;16, Bytes&lt;32&gt;&gt;</span>;<br />
              <span className="code-kw">export ledger</span> admin: <span className="code-type">Bytes&lt;32&gt;</span>;<br />
              <span className="code-kw">export ledger</span> bounties: <span className="code-type">Map&lt;Bytes&lt;32&gt;, Uint&lt;32&gt;&gt;</span>;<br />
              <span className="code-kw">export ledger</span> claimed: <span className="code-type">Set&lt;Bytes&lt;32&gt;&gt;</span>;<br />
              <span className="code-kw">export ledger</span> total_claims: <span className="code-type">Uint&lt;32&gt;</span>;<br />
              <span className="code-kw">export ledger</span> is_active: <span className="code-type">Boolean</span>;
            </div>
          </div>

          <div className="glass-card docs-card mb-6">
            <h2 className="docs-section-heading">claim_bounty Circuit</h2>
            <div className="code-snippet-box font-mono">
              <span className="code-kw">export circuit</span> <span className="code-func">claim_bounty</span>(bounty_id: <span className="code-type">Bytes&lt;32&gt;</span>): [] &#123;<br />
              &nbsp;&nbsp;<span className="code-kw">assert</span>(disclose(is_active));<br />
              &nbsp;&nbsp;<span className="code-kw">const</span> cred = dev_credential();<br />
              &nbsp;&nbsp;<span className="code-kw">const</span> commitment = make_credential_commitment(cred.dev_id, cred.score);<br />
              &nbsp;&nbsp;<span className="code-kw">const</span> path = find_credential_path(commitment);<br />
              &nbsp;&nbsp;<span className="code-kw">assert</span>(oracle_credentials.checkRoot(merkleTreePathRoot&lt;16, Bytes&lt;32&gt;&gt;(path)));<br />
              &nbsp;&nbsp;<span className="code-kw">assert</span>(bounties.member(disclose(bounty_id)));<br />
              &nbsp;&nbsp;<span className="code-kw">assert</span>(cred.score &gt;= bounties.lookup(disclose(bounty_id)));<br />
              &nbsp;&nbsp;<span className="code-kw">const</span> nul = make_nullifier(bounty_id, cred.dev_id);<br />
              &nbsp;&nbsp;<span className="code-kw">assert</span>(!claimed.member(disclose(nul)));<br />
              &nbsp;&nbsp;claimed.insert(disclose(nul));<br />
              &nbsp;&nbsp;total_claims = disclose((total_claims + 1) <span className="code-kw">as</span> Uint&lt;32&gt;);<br />
              &#125;
            </div>
          </div>
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="docs-content-container animate-fade-in">
          <div className="glass-card docs-card mb-6">
            <h2 className="docs-section-heading">Domain Separation Salts</h2>
            <div className="docs-table-wrapper">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Preimage</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono text-cyan">shadowcommit:admin:v1</td>
                    <td className="font-mono">['salt', admin_sk]</td>
                    <td>Public on ledger</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-cyan">shadowcommit:cred:v1</td>
                    <td className="font-mono">['salt', dev_id, score]</td>
                    <td>Merkle Leaf</td>
                  </tr>
                  <tr>
                    <td className="font-mono text-cyan">shadowcommit:null:v1</td>
                    <td className="font-mono">['salt', bounty_id, dev_id]</td>
                    <td>Public Nullifier Set</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card docs-card mb-6">
            <h2 className="docs-section-heading">Sybil Resistance</h2>
            <p className="docs-body-text">
              The nullifier is deterministically derived from <code className="font-mono text-cyan">bounty_id</code> and <code className="font-mono text-cyan">dev_id</code>. A developer cannot claim the same bounty multiple times from different burner wallets.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="docs-content-container animate-fade-in">
          <div className="glass-card docs-card mb-6">
            <h2 className="docs-section-heading">Why Midnight Network?</h2>
            <div className="docs-table-wrapper">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Standard EVM / Solana</th>
                    <th>Midnight Network</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Private State</td>
                    <td>Impossible (All calldata public)</td>
                    <td className="text-emerald">Native client-side ZK</td>
                  </tr>
                  <tr>
                    <td>Prover Runtime</td>
                    <td>Requires custom verifier contracts</td>
                    <td className="text-emerald">Compact DSL native compiler</td>
                  </tr>
                  <tr>
                    <td>Gas / Proving Fees</td>
                    <td>High gas for ZK verification</td>
                    <td className="text-emerald">DUST fee mechanism</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
