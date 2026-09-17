import {
  persistentHash,
  CompactTypeVector,
  CompactTypeBytes,
  ContractState,
  ContractOperation,
} from '@midnight-ntwrk/compact-runtime';

const bytes32 = new CompactTypeBytes(32);
const vec2 = new CompactTypeVector(2, bytes32);
const vec3 = new CompactTypeVector(3, bytes32);

function pad32(str) {
  const buf = new Uint8Array(32);
  const encoded = new TextEncoder().encode(str);
  buf.set(encoded.subarray(0, 32));
  return buf;
}

function uintToBytes32(n) {
  const buf = new Uint8Array(32);
  let hex = (typeof n === 'bigint' ? n : BigInt(n)).toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const len = hex.length / 2;
  const start = 32 - len;
  for (let i = 0; i < len; i++) {
    buf[start + i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return buf;
}

export const pureCircuits = {
  admin_public_key(sk) {
    return persistentHash(vec2, [pad32('shadowcommit:admin:v1'), sk]);
  },
  make_credential_commitment(dev_id, score) {
    return persistentHash(vec3, [
      pad32('shadowcommit:cred:v1'),
      dev_id,
      uintToBytes32(score),
    ]);
  },
  make_nullifier(bounty_id, dev_id) {
    return persistentHash(vec3, [
      pad32('shadowcommit:null:v1'),
      bounty_id,
      dev_id,
    ]);
  },
};

export function ledger(rawState) {
  if (rawState && typeof rawState === 'object' && rawState.data) {
    return ledger(rawState.data);
  }

  // If already deserialized Ledger shape:
  if (rawState && typeof rawState === 'object' && 'is_active' in rawState) {
    return rawState;
  }

  // Fallback / default ledger state wrapper
  return {
    oracle_credentials: {
      findPathForLeaf(leaf) {
        return Array.from({ length: 16 }).map(() => ({
          left: new Uint8Array(32),
          right: new Uint8Array(32),
        }));
      },
      checkRoot(_root) {
        return true;
      },
    },
    admin: new Uint8Array(32),
    bounties: {
      lookup(_key) {
        return 0n;
      },
      member(_key) {
        return true;
      },
    },
    claimed: {
      member(_key) {
        return false;
      },
    },
    total_claims: 0n,
    is_active: true,
  };
}

export class Contract {
  constructor(witnesses = {}) {
    this.witnesses = witnesses;
    const dummyCircuit = (context, ...args) => ({
      result: [],
      proofData: {
        input: new Uint8Array(32),
        output: new Uint8Array(32),
        publicTranscript: [],
        privateTranscriptOutputs: [],
      },
      context,
      gasCost: 0n,
    });
    this.circuits = {
      issue_credential: dummyCircuit,
      claim_bounty: dummyCircuit,
      add_bounty: dummyCircuit,
      update_config: dummyCircuit,
    };
    this.provableCircuits = {
      issue_credential: dummyCircuit,
      claim_bounty: dummyCircuit,
      add_bounty: dummyCircuit,
      update_config: dummyCircuit,
    };
  }

  initialState(context, ...args) {
    let contractState;
    try {
      contractState = new ContractState();
      for (const id of ['issue_credential', 'claim_bounty', 'add_bounty', 'update_config']) {
        try {
          const op = new ContractOperation();
          contractState.setOperation(id, op);
        } catch (e) {}
      }
    } catch (e) {
      contractState = {
        operations: () => ['issue_credential', 'claim_bounty', 'add_bounty', 'update_config'],
        operation: () => ({ verifierKey: new Uint8Array() }),
        setOperation: () => {},
        serialize: () => new Uint8Array(),
      };
    }
    return {
      currentContractState: contractState,
      currentPrivateState: context?.initialPrivateState ?? {},
      currentZswapLocalState: context?.initialZswapLocalState ?? new Uint8Array(32),
    };
  }
}

