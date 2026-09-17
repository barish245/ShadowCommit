import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, Loader2, Play, RotateCcw, ShieldCheck, Lock } from 'lucide-react';

interface ProverTerminalProps {
  interactive?: boolean;
  onProofComplete?: (nullifier: string) => void;
  externalStatus?: 'idle' | 'proving' | 'success' | 'error';
  customLogs?: string[];
}

export default function ProverTerminal({ 
  interactive = true, 
  onProofComplete,
  externalStatus,
  customLogs 
}: ProverTerminalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState<Array<{ text: string; time: string; type: 'info' | 'success' | 'warn' | 'dim' }>>([
    { text: 'ShadowCommit Compact Runtime initialized. Client-side WASM ready.', time: '00:00.01', type: 'dim' },
    { text: 'Awaiting private witness input: [dev_id, reputation_score]...', time: '00:00.02', type: 'info' },
  ]);

  const defaultProvingSteps = [
    { text: 'Loading Compact circuit constraints for claim_bounty(bounty_id)...', type: 'info' as const },
    { text: 'Computing persistentHash([pad("shadowcommit:cred:v1"), dev_id, score])...', type: 'info' as const },
    { text: 'Derived leaf commitment: 0x4a92f810c9be7401d830b42c884b6... [WITNESS SHIELDED]', type: 'warn' as const },
    { text: 'Traversing 16-level on-chain Merkle Tree path against indexer root...', type: 'info' as const },
    { text: 'Constraint verified: merkleTreePathRoot(path) matches oracle_credentials.root', type: 'success' as const },
    { text: 'Asserting eligibility: witness.score (850) >= bounty.min_score (500) -> PASS', type: 'success' as const },
    { text: 'Generating sybil-resistant nullifier: persistentHash(["shadowcommit:null:v1", bounty_id, dev_id])...', type: 'info' as const },
    { text: 'Nullifier generated: 0x7c94b301e7a5d9082... [PUBLIC LEDGER TRANSCRIPT]', type: 'warn' as const },
    { text: 'Synthesizing Groth16 zero-knowledge proof. 24,192 R1CS constraints satisfied.', type: 'info' as const },
    { text: 'Proof verified client-side. Zero identity or score metadata leaked.', type: 'success' as const },
  ];

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStep(0);
    setLogs([{ text: 'Starting confidential ZK proof generation sequence...', time: '00:00.00', type: 'info' }]);

    defaultProvingSteps.forEach((step, idx) => {
      setTimeout(() => {
        const timeSec = ((idx + 1) * 0.28).toFixed(2);
        setLogs(prev => [...prev, { text: step.text, time: `00:0${timeSec}`, type: step.type }]);
        setActiveStep(idx + 1);

        if (idx === defaultProvingSteps.length - 1) {
          setIsRunning(false);
          if (onProofComplete) {
            onProofComplete('0x7c94b301e7a5d9082103f67ba0543e29104cf5e1b9a8432170de84013498ac12');
          }
        }
      }, (idx + 1) * 320);
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setActiveStep(0);
    setLogs([
      { text: 'ShadowCommit Compact Runtime initialized. Client-side WASM ready.', time: '00:00.01', type: 'dim' },
      { text: 'Awaiting private witness input: [dev_id, reputation_score]...', time: '00:00.02', type: 'info' },
    ]);
  };

  return (
    <div className="prover-terminal-root">
      {/* Terminal Titlebar */}
      <div className="terminal-titlebar">
        <div className="terminal-controls">
          <span className="control-dot dot-red" />
          <span className="control-dot dot-yellow" />
          <span className="control-dot dot-green" />
        </div>
        <div className="terminal-title">
          <Terminal size={13} className="text-cyan" />
          <span>shadowcommit-prover --compact-v0.31 --client-wasm</span>
        </div>
        <div className="terminal-actions">
          {interactive && (
            <div className="terminal-btn-row">
              <button 
                onClick={runSimulation} 
                disabled={isRunning} 
                className="terminal-action-btn"
                title="Simulate Prover Constraints"
              >
                {isRunning ? <Loader2 size={13} className="animate-spin text-cyan" /> : <Play size={13} />}
                <span>{isRunning ? 'Proving...' : 'Simulate'}</span>
              </button>
              <button 
                onClick={handleReset} 
                disabled={isRunning} 
                className="terminal-action-btn"
                title="Clear Terminal"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Display Screen */}
      <div className="terminal-screen font-mono">
        {logs.map((log, index) => (
          <div key={index} className={`terminal-log-line log-${log.type}`}>
            <span className="log-time">[{log.time}]</span>
            <span className="log-prompt">›</span>
            <span className="log-text">{log.text}</span>
          </div>
        ))}

        {isRunning && (
          <div className="terminal-log-line log-dim">
            <span className="log-time">[RUN]</span>
            <span className="log-prompt">›</span>
            <span className="log-text flex-inline items-center gap-1">
              Evaluating R1CS witness polynomial coefficients <Loader2 size={12} className="animate-spin text-cyan inline ml-1" />
            </span>
          </div>
        )}
      </div>

      {/* Terminal Footer Telemetry */}
      <div className="terminal-footer">
        <div className="telemetry-item">
          <Lock size={12} className="text-cyan" />
          <span>ZK Circuit: <strong>claim_bounty</strong></span>
        </div>
        <div className="telemetry-item">
          <ShieldCheck size={12} className="text-emerald" />
          <span>Proof Status: <strong>{isRunning ? 'SYNTHESIZING' : activeStep > 0 ? 'CONSTRAINTS_SATISFIED' : 'STANDBY'}</strong></span>
        </div>
        <div className="telemetry-item ml-auto">
          <span className="telemetry-badge">Merkle Depth 16</span>
        </div>
      </div>
    </div>
  );
}
