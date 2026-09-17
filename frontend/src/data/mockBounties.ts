export interface Bounty {
  id: string;
  name: string;
  sponsor: string;
  description: string;
  minScore: number;
  rewardNIGHT: number;
  rewardUSD: number;
  category: 'Rust' | 'ZK' | 'Compact' | 'DeFi' | 'Security';
  tags: string[];
  status: 'active' | 'featured' | 'claimed';
  difficulty: 'Senior' | 'Lead' | 'Staff' | 'Contributor';
  createdDate: string;
}

export const INITIAL_BOUNTIES: Bounty[] = [
  {
    id: 'bounty-rust-core',
    name: 'Senior Rust Core Engine Optimization',
    sponsor: 'Midnight Labs Research',
    description: 'Optimize Substrate FRAME pallet execution and Patricia-Merkle trie state transitions for low-latency batch transactions.',
    minScore: 800,
    rewardNIGHT: 4500,
    rewardUSD: 9000,
    category: 'Rust',
    tags: ['Rust', 'Substrate', 'WASM', 'High-Perf'],
    status: 'featured',
    difficulty: 'Lead',
    createdDate: '2026-09-15',
  },
  {
    id: 'bounty-compact-amm',
    name: 'Confidential AMM Compact Circuit Audit',
    sponsor: 'DarkPool Liquidity Protocol',
    description: 'Audit private liquidity pool circuits and verify zero-knowledge balance invariants under concurrent shielded swaps.',
    minScore: 650,
    rewardNIGHT: 3200,
    rewardUSD: 6400,
    category: 'Compact',
    tags: ['Compact', 'ZK Proofs', 'AMM', 'DeFi'],
    status: 'active',
    difficulty: 'Senior',
    createdDate: '2026-09-18',
  },
  {
    id: 'bounty-zk-snark-verifier',
    name: 'BLS12-381 Poseidon Hash Verifier',
    sponsor: 'ZeroKnowledge Foundation',
    description: 'Implement an optimized zero-knowledge membership proof verifier utilizing algebraic hashes in Compact Standard Library.',
    minScore: 1000,
    rewardNIGHT: 6000,
    rewardUSD: 12000,
    category: 'ZK',
    tags: ['Cryptography', 'SNARKs', 'Compact', 'Math'],
    status: 'featured',
    difficulty: 'Staff',
    createdDate: '2026-09-12',
  },
  {
    id: 'bounty-stealth-indexer',
    name: 'Shielded Event Indexer & GraphQL Pipeline',
    sponsor: 'Shadow Analytics',
    description: 'Construct a resilient streaming GraphQL indexer client handling block reorganization and offset pagination for shielded events.',
    minScore: 500,
    rewardNIGHT: 2200,
    rewardUSD: 4400,
    category: 'DeFi',
    tags: ['TypeScript', 'GraphQL', 'Indexers', 'RxJS'],
    status: 'active',
    difficulty: 'Contributor',
    createdDate: '2026-09-20',
  },
  {
    id: 'bounty-sybil-defense',
    name: 'Sybil-Resistant DAO Governance Module',
    sponsor: 'Nocturne Autonomous Org',
    description: 'Build anonymous voting circuits using domain-separated persistent nullifiers and snapshot Merkle roots.',
    minScore: 750,
    rewardNIGHT: 3800,
    rewardUSD: 7600,
    category: 'Security',
    tags: ['Governance', 'Nullifiers', 'ZK', 'Privacy'],
    status: 'active',
    difficulty: 'Senior',
    createdDate: '2026-09-21',
  },
];

export interface ClaimAuditItem {
  id: string;
  bountyName: string;
  nullifierHash: string;
  timestamp: string;
  txHash: string;
  status: 'confirmed' | 'pending';
}

export const INITIAL_AUDIT_FEED: ClaimAuditItem[] = [
  {
    id: 'audit-1',
    bountyName: 'Senior Rust Core Engine Optimization',
    nullifierHash: '0x8f2a...c419e7',
    timestamp: '24 mins ago',
    txHash: '0x3e19...b9021',
    status: 'confirmed',
  },
  {
    id: 'audit-2',
    bountyName: 'Confidential AMM Compact Circuit Audit',
    nullifierHash: '0x1d40...98a3b2',
    timestamp: '2 hours ago',
    txHash: '0x7c02...e548f',
    status: 'confirmed',
  },
  {
    id: 'audit-3',
    bountyName: 'Shielded Event Indexer & GraphQL Pipeline',
    nullifierHash: '0x62e8...7fa109',
    timestamp: '5 hours ago',
    txHash: '0x99a1...130bf',
    status: 'confirmed',
  },
];
