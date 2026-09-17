import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type Bounty } from '../data/mockBounties';
import { Award, ArrowRight, ShieldCheck, Tag, Coins } from 'lucide-react';

interface BountyCardProps {
  bounty: Bounty;
  onSelect?: (bounty: Bounty) => void;
}

export default function BountyCard({ bounty, onSelect }: BountyCardProps) {
  const navigate = useNavigate();

  const handleClaimClick = () => {
    if (onSelect) {
      onSelect(bounty);
    } else {
      navigate(`/claim?bounty=${encodeURIComponent(bounty.name)}&minScore=${bounty.minScore}`);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Rust': return 'badge-rust';
      case 'Compact': return 'badge-compact';
      case 'ZK': return 'badge-zk';
      case 'DeFi': return 'badge-defi';
      case 'Security': return 'badge-security';
      default: return 'badge-default';
    }
  };

  return (
    <div className={`bounty-card-root ${bounty.status === 'featured' ? 'bounty-card-featured' : ''}`}>
      {/* Card Header */}
      <div className="bounty-card-header">
        <div className="bounty-sponsor-row">
          <span className="sponsor-name">{bounty.sponsor}</span>
          <span className={`category-badge ${getCategoryBadgeClass(bounty.category)}`}>
            {bounty.category}
          </span>
        </div>
        <h3 className="bounty-title">{bounty.name}</h3>
      </div>

      {/* Card Description */}
      <p className="bounty-description">{bounty.description}</p>

      {/* Tech Tags */}
      <div className="bounty-tags-row">
        {bounty.tags.map((tag, idx) => (
          <span key={idx} className="bounty-tag">
            <Tag size={11} className="inline mr-1 text-muted" />
            {tag}
          </span>
        ))}
      </div>

      {/* Metrics & Reward Bar */}
      <div className="bounty-metrics-bar">
        <div className="metric-box">
          <span className="metric-label">Min. Reputation</span>
          <div className="metric-value text-cyan">
            <ShieldCheck size={14} className="inline mr-1" />
            <span>{bounty.minScore}+ pts</span>
          </div>
        </div>

        <div className="metric-box text-right">
          <span className="metric-label">Reward</span>
          <div className="metric-value text-emerald">
            <Coins size={14} className="inline mr-1" />
            <span>{bounty.rewardNIGHT.toLocaleString()} NIGHT</span>
          </div>
          <span className="metric-subval">~${bounty.rewardUSD.toLocaleString()} USD</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bounty-card-footer">
        <div className="difficulty-tag">
          <span className="difficulty-indicator" />
          <span>Level: {bounty.difficulty}</span>
        </div>

        <button 
          onClick={handleClaimClick} 
          className="btn-claim-trigger"
          title={`Claim ${bounty.name} with ZK proof`}
        >
          <span>Claim with ZK</span>
          <ArrowRight size={14} className="btn-arrow" />
        </button>
      </div>
    </div>
  );
}
