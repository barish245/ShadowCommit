import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  EyeOff, 
  Globe2,
  GitCommit
} from 'lucide-react';
import ProverTerminal from '../components/ProverTerminal';
import BountyCard from '../components/BountyCard';
import { INITIAL_BOUNTIES } from '../data/mockBounties';

export default function LandingPage() {
  const featuredBounties = INITIAL_BOUNTIES.slice(0, 3);

  return (
    <div className="landing-root">
      <div className="bg-grid-pattern" />
      <div className="ambient-glow glow-cyan" />
      <div className="ambient-glow glow-violet" />

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-pill-badge">
              <span className="pulse-dot" />
              <span className="pill-text">Midnight Preprod · Zero-Knowledge</span>
            </div>

            <h1 className="hero-title">
              PRIVATE DEVELOPER <span className="gradient-text-cyan">REPUTATION</span>.
            </h1>

            <p className="hero-subhead">
              Prove open-source impact and claim bounties anonymously using Compact zero-knowledge proofs.
            </p>

            <div className="hero-cta-group">
              <NavLink to="/bounties" className="btn-primary-glow">
                <span>Explore Bounties</span>
                <ArrowRight size={16} />
              </NavLink>
              <NavLink to="/claim" className="btn-secondary-outline">
                <Terminal size={16} />
                <span>Launch ZK Prover</span>
              </NavLink>
            </div>

            <div className="hero-guarantees">
              <div className="guarantee-item">
                <ShieldCheck size={15} className="text-cyan" />
                <span>Zero Doxxing</span>
              </div>
              <div className="guarantee-item">
                <EyeOff size={15} className="text-emerald" />
                <span>Shielded Score</span>
              </div>
              <div className="guarantee-item">
                <Lock size={15} className="text-violet" />
                <span>Sybil-Resistant</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="terminal-wrapper-glow">
              <ProverTerminal interactive={true} />
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="stats-strip-section">
        <div className="stats-strip-container">
          <div className="stat-card">
            <span className="stat-num">$34,000+</span>
            <span className="stat-name">Active Bounty Pool</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">100%</span>
            <span className="stat-name">Shielded Identity</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">16 Levels</span>
            <span className="stat-name">Merkle Tree</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">&lt;0.8s</span>
            <span className="stat-name">Client Prover</span>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="section-padded">
        <div className="section-header text-center">
          <span className="section-eyebrow">ARCHITECTURE</span>
          <h2 className="section-title">How It Works</h2>
        </div>

        <div className="bento-grid">
          <div className="bento-card bento-card-cyan">
            <div className="bento-icon-wrapper">
              <Lock size={22} className="text-cyan" />
            </div>
            <h3 className="bento-title">1. Private Witness</h3>
            <p className="bento-text">
              GitHub handle and commit score stay strictly in browser memory. Never broadcast.
            </p>
          </div>

          <div className="bento-card bento-card-violet">
            <div className="bento-icon-wrapper">
              <Cpu size={22} className="text-violet" />
            </div>
            <h3 className="bento-title">2. ZK Circuit</h3>
            <p className="bento-text">
              Asserts Merkle membership and score threshold without revealing underlying inputs.
            </p>
          </div>

          <div className="bento-card bento-card-emerald">
            <div className="bento-icon-wrapper">
              <GitCommit size={22} className="text-emerald" />
            </div>
            <h3 className="bento-title">3. Nullifier Commit</h3>
            <p className="bento-text">
              Emits a unique single-use nullifier hash to prevent double-claiming on-chain.
            </p>
          </div>
        </div>
      </section>

      {/* PRIVACY MODEL */}
      <section className="section-padded section-alt">
        <div className="section-header text-center">
          <span className="section-eyebrow">PRIVACY MODEL</span>
          <h2 className="section-title">Shielded vs Public</h2>
        </div>

        <div className="privacy-matrix-container">
          <div className="matrix-column matrix-col-cannot">
            <div className="matrix-header">
              <EyeOff size={18} className="text-emerald" />
              <h3>Shielded (Private)</h3>
            </div>
            <ul className="matrix-list">
              <li>
                <CheckCircle2 size={15} className="text-emerald shrink-0" />
                <span>GitHub username & commit history</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="text-emerald shrink-0" />
                <span>Exact reputation score</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="text-emerald shrink-0" />
                <span>Link between wallet and real identity</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="text-emerald shrink-0" />
                <span>Cross-bounty tracking</span>
              </li>
            </ul>
          </div>

          <div className="matrix-column matrix-col-can">
            <div className="matrix-header">
              <Globe2 size={18} className="text-cyan" />
              <h3>Public (On-Chain)</h3>
            </div>
            <ul className="matrix-list">
              <li>
                <CheckCircle2 size={15} className="text-cyan shrink-0" />
                <span>Bounty ID & score threshold</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="text-cyan shrink-0" />
                <span>One-time nullifier hash</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="text-cyan shrink-0" />
                <span>Total claims counter</span>
              </li>
              <li>
                <CheckCircle2 size={15} className="text-cyan shrink-0" />
                <span>Proof verification status</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURED BOUNTIES */}
      <section className="section-padded">
        <div className="section-header flex-between">
          <div>
            <span className="section-eyebrow">MARKETPLACE</span>
            <h2 className="section-title">Featured Bounties</h2>
          </div>
          <NavLink to="/bounties" className="btn-secondary-outline">
            <span>View All</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>

        <div className="bounties-grid">
          {featuredBounties.map(bounty => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner-section">
        <div className="cta-banner-card">
          <div className="cta-content">
            <h2 className="cta-title">Claim Bounties Anonymously</h2>
            <p className="cta-desc">
              Connect your 1AM wallet on Midnight Preprod to prove credentials in zero-knowledge.
            </p>
            <div className="cta-actions">
              <NavLink to="/bounties" className="btn-primary-glow">
                <span>Browse Bounties</span>
                <ArrowRight size={16} />
              </NavLink>
              <NavLink to="/claim" className="btn-secondary-outline">
                <span>Open Prover</span>
              </NavLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
