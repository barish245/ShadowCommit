import type {
  WitnessContext,
} from '@midnight-ntwrk/compact-js';

export type DevCredential = {
  dev_id: Uint8Array;
  score: bigint;
};

export type MerkleTreePathEntry = {
  left: Uint8Array;
  right: Uint8Array;
};

export type Witnesses = {
  dev_credential: (context: WitnessContext<any, any>) => DevCredential;
  admin_secret: (context: WitnessContext<any, any>) => Uint8Array;
  find_credential_path: (context: WitnessContext<any, any>, commitment: Uint8Array) => MerkleTreePathEntry[];
};

export type ImpureCircuits = {
  issue_credential: (commitment: Uint8Array) => void;
  claim_bounty: (bounty_id: Uint8Array) => void;
  add_bounty: (bounty_id: Uint8Array, min_score: bigint) => void;
  update_config: (active: boolean) => void;
};

export type PureCircuits = {
  admin_public_key: (sk: Uint8Array) => Uint8Array;
  make_credential_commitment: (dev_id: Uint8Array, score: bigint) => Uint8Array;
  make_nullifier: (bounty_id: Uint8Array, dev_id: Uint8Array) => Uint8Array;
};

export type Ledger = {
  oracle_credentials: {
    findPathForLeaf: (leaf: Uint8Array) => MerkleTreePathEntry[] | null;
    checkRoot: (root: Uint8Array) => boolean;
  };
  admin: Uint8Array;
  bounties: {
    lookup: (key: Uint8Array) => bigint;
    member: (key: Uint8Array) => boolean;
  };
  claimed: {
    member: (key: Uint8Array) => boolean;
  };
  total_claims: bigint;
  is_active: boolean;
};

export declare const Contract: any;
export declare function ledger(state: any): Ledger;
export declare const pureCircuits: PureCircuits;
