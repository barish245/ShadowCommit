import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Logo from './Logo';
import { useWallet } from '../contexts/WalletContext';
import { 
  ShieldCheck, 
  Wallet, 
  ExternalLink, 
  Copy, 
  Check, 
  LogOut, 
  Radio, 
  Menu, 
  X,
  Code2,
  Terminal,
  FileCode,
  Settings
} from 'lucide-react';

export default function Navbar() {
  const { address, isConnected, isConnecting, walletStatus, connect, disconnect } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <NavLink to="/" className="navbar-brand">
          <Logo size={36} />
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            Overview
          </NavLink>
          <NavLink to="/bounties" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <Code2 size={15} className="nav-icon" />
            Bounties
          </NavLink>
          <NavLink to="/claim" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <Terminal size={15} className="nav-icon" />
            ZK Prover
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <Settings size={15} className="nav-icon" />
            Admin Hub
          </NavLink>
          <NavLink to="/docs" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <FileCode size={15} className="nav-icon" />
            Docs
          </NavLink>
        </nav>

        {/* Action Controls & Wallet */}
        <div className="navbar-actions">
          {/* Network Pill */}
          <div className="network-pill" title="Connected to Midnight Testnet">
            <span className="pulse-dot" />
            <span className="network-label">Midnight Preprod</span>
          </div>

          {isConnected ? (
            <div className="wallet-connected-group">
              <div className="wallet-address-badge" onClick={handleCopy} title="Click to copy address">
                <Wallet size={14} className="wallet-glyph text-cyan" />
                <span className="address-text">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} className="copy-icon" />}
              </div>
              <button 
                onClick={disconnect} 
                className="btn-disconnect-icon" 
                title="Disconnect 1AM Wallet"
                aria-label="Disconnect"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect('preprod')}
              disabled={isConnecting || walletStatus === 'not-found'}
              className="btn-wallet-connect"
              id="connect-wallet-btn"
            >
              <Wallet size={15} />
              <span>
                {walletStatus === 'checking' ? 'Detecting 1AM…' :
                 walletStatus === 'not-found' ? 'Install 1AM Wallet' :
                 isConnecting ? 'Authenticating…' :
                 'Connect 1AM'}
              </span>
            </button>
          )}

          {/* Mobile hamburger toggle */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <NavLink to="/" end onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            Overview
          </NavLink>
          <NavLink to="/bounties" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            Bounties Marketplace
          </NavLink>
          <NavLink to="/claim" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            ZK Prover Studio
          </NavLink>
          <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            Admin & Oracle Hub
          </NavLink>
          <NavLink to="/docs" onClick={() => setMobileMenuOpen(false)} className="mobile-link">
            Architecture & Privacy Docs
          </NavLink>
        </div>
      )}
    </header>
  );
}
