import React from 'react';
import { NavLink } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo size={32} subtitle="" />
            <p className="footer-tagline">
              Zero-knowledge developer reputation protocol on Midnight Network.
            </p>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-col-title">App</h4>
            <NavLink to="/bounties">Bounties</NavLink>
            <NavLink to="/claim">ZK Prover</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            <NavLink to="/docs">Docs</NavLink>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-col-title">Midnight</h4>
            <a href="https://preprod.midnightexplorer.com" target="_blank" rel="noopener noreferrer">
              Explorer <ExternalLink size={11} className="inline-icon" />
            </a>
            <a href="https://faucet.preprod.midnight.network" target="_blank" rel="noopener noreferrer">
              Faucet <ExternalLink size={11} className="inline-icon" />
            </a>
            <a href="https://docs.midnight.network" target="_blank" rel="noopener noreferrer">
              Docs <ExternalLink size={11} className="inline-icon" />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © 2026 ShadowCommit · Built on Midnight Network
          </div>
          <div className="footer-tech-specs">
            <span>Compact v0.31 · 1AM Wallet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
