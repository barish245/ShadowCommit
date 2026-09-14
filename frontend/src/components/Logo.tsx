import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export default function Logo({ size = 38, showText = true, className = '', subtitle = 'ZERO-KNOWLEDGE PROTOCOL' }: LogoProps) {
  return (
    <div className={`shadowcommit-logo-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      <div 
        className="brand-mark-hex"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg 
          viewBox="0 0 44 44" 
          width="100%" 
          height="100%" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.45))' }}
        >
          <defs>
            <linearGradient id="scHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="scShieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 242, 254, 0.25)" />
              <stop offset="100%" stopColor="rgba(129, 140, 248, 0.08)" />
            </linearGradient>
            <linearGradient id="scBranchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
          </defs>

          {/* Outer Cyber Shield / Tech Hexagon */}
          <polygon
            points="22,2 40,8 40,24 22,42 4,24 4,8"
            stroke="url(#scHexGradient)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            fill="url(#scShieldInner)"
          />

          {/* Subtle Cyber Grid Lines inside Shield */}
          <path
            d="M22,2 L22,42"
            stroke="rgba(0, 242, 254, 0.2)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <path
            d="M4,16 L40,16"
            stroke="rgba(0, 242, 254, 0.15)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Git Commit Tree & ZK Keyhole Monogram */}
          {/* Main trunk (branch line) */}
          <path
            d="M17,14 L17,30"
            stroke="url(#scBranchGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Fork branch to right commit */}
          <path
            d="M17,21 Q21,21 24,17"
            stroke="url(#scBranchGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Root Commit Node */}
          <circle cx="17" cy="14" r="2.5" fill="#00f2fe" stroke="#030712" strokeWidth="1.5" />
          
          {/* Merged / Shadow Node */}
          <circle cx="26" cy="16" r="2.5" fill="#818cf8" stroke="#030712" strokeWidth="1.5" />
          
          {/* Target Protected Commit Node (with glowing keyhole) */}
          <circle cx="17" cy="30" r="3.2" fill="#00f2fe" stroke="#030712" strokeWidth="1.5" />
          <circle cx="17" cy="30" r="1.2" fill="#030712" />

          {/* Small ZK spark / delta mark */}
          <path
            d="M31,27 L33.5,31 L28.5,31 Z"
            fill="#00f2fe"
            opacity="0.85"
          />
        </svg>
      </div>

      {showText && (
        <div className="brand-info">
          <span className="brand-title" style={{ letterSpacing: '0.08em', fontWeight: 800 }}>
            SHADOW<span style={{ color: 'var(--cyan-primary, #00f2fe)' }}>COMMIT</span>
          </span>
          {subtitle && (
            <span className="brand-subtitle" style={{ letterSpacing: '0.14em', opacity: 0.75 }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
