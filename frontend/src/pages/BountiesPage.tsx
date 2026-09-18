import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  ShieldCheck, 
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import BountyCard from '../components/BountyCard';
import { INITIAL_BOUNTIES, INITIAL_AUDIT_FEED } from '../data/mockBounties';

export default function BountiesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'reward' | 'score' | 'newest'>('reward');

  const categories = ['All', 'Rust', 'Compact', 'ZK', 'DeFi', 'Security'];

  const filteredBounties = useMemo(() => {
    return INITIAL_BOUNTIES.filter(bounty => {
      const matchesSearch = 
        bounty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || bounty.category === selectedCategory;
      return matchesSearch && matchesCat;
    }).sort((a, b) => {
      if (sortBy === 'reward') return b.rewardNIGHT - a.rewardNIGHT;
      if (sortBy === 'score') return a.minScore - b.minScore;
      return b.createdDate.localeCompare(a.createdDate);
    });
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="bounties-page-root">
      <div className="page-header-container">
        <div className="page-header-text">
          <span className="section-eyebrow">MARKETPLACE</span>
          <h1 className="page-title">Developer Bounties</h1>
          <p className="page-desc">
            Explore active bounties with zero-knowledge reputation verification.
          </p>
        </div>

        <div className="page-header-actions">
          <button 
            onClick={() => navigate('/admin')} 
            className="btn-secondary-outline"
          >
            <PlusCircle size={15} />
            <span>Post Bounty</span>
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="filter-toolbar-card">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search bounties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-pills-row">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-pill ${selectedCategory === cat ? 'category-pill-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="sort-wrapper">
          <SlidersHorizontal size={14} className="sort-icon" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="sort-select"
          >
            <option value="reward">Highest Reward</option>
            <option value="score">Lowest Requirement</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="marketplace-layout-grid">
        <div className="bounties-main-column">
          <div className="results-status-bar">
            <span><strong>{filteredBounties.length}</strong> bounties available</span>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-clear-search">
                Clear search
              </button>
            )}
          </div>

          {filteredBounties.length === 0 ? (
            <div className="empty-state-card">
              <Search size={28} className="text-muted mb-2" />
              <h3>No bounties found</h3>
              <p>Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="bounties-grid">
              {filteredBounties.map(bounty => (
                <BountyCard key={bounty.id} bounty={bounty} />
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="marketplace-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <div className="flex-inline items-center gap-2">
                <span className="pulse-dot" />
                <h4>Recent Claims</h4>
              </div>
              <span className="text-xs text-muted">Preprod</span>
            </div>

            <div className="audit-feed-list">
              {INITIAL_AUDIT_FEED.map(item => (
                <div key={item.id} className="audit-item">
                  <div className="audit-item-top">
                    <span className="audit-bounty-name">{item.bountyName}</span>
                    <span className="audit-time">{item.timestamp}</span>
                  </div>
                  <div className="audit-item-bottom">
                    <span className="audit-nullifier font-mono">{item.nullifierHash.slice(0, 14)}...</span>
                    <a 
                      href={`https://preprod.midnightexplorer.com/tx/${item.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="audit-tx-link font-mono"
                    >
                      {item.txHash.slice(0, 10)}... <ExternalLink size={10} className="inline ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card sidebar-card-highlight">
            <div className="sidebar-card-header">
              <ShieldCheck size={16} className="text-cyan" />
              <h4>Privacy Guarantee</h4>
            </div>
            <p className="sidebar-text">
              Zero-knowledge proof synthesized client-side. Your GitHub ID is never broadcast.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
