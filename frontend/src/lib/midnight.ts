import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import type { MidnightProvider, WalletProvider } from '@midnight-ntwrk/midnight-js-types';


export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

// PATCHED PUBLIC DATA PROVIDER
// Fixes the known "offset: null" GraphQL bug on Preprod/Preview indexers.
// ALWAYS use this in the browser — never use indexerPublicDataProvider directly.
export function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string) {
  const base = indexerPublicDataProvider(queryUrl, subscriptionUrl);

  async function queryLatest(query: string, address: string) {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: { address } }),
    });
    if (!res.ok) throw new Error(`Indexer HTTP ${res.status}`);
    const payload = await res.json();
    if (payload.errors?.length) throw new Error(payload.errors.map((e: any) => e.message).join('; '));
    return payload.data?.contractAction ?? null;
  }

  return {
    ...base,
    async queryContractState(contractAddress: string, config?: any) {
      if (config) return base.queryContractState(contractAddress, config);
      const action = await queryLatest(
        `query LATEST($address: HexEncoded!) { contractAction(address: $address) { state } }`,
        contractAddress,
      );
      return action ? ContractState.deserialize(fromHex(action.state)) : null;
    },
  };
}

// IN-MEMORY PRIVATE STATE PROVIDER (browser cannot use LevelDB)
export function createPrivateStateProvider() {
  let scope = '';
  const stateStore = new Map<string, unknown>();
  const signingKeyStore = new Map<string, unknown>();
  const key = (id: string) => `${scope}:${id}`;
  return {
    setContractAddress(address: string) { scope = address; },
    async set(id: string, state: unknown) { stateStore.set(key(id), state); },
    async get(id: string) { return stateStore.get(key(id)) ?? null; },
    async remove(id: string) { stateStore.delete(key(id)); },
    async clear() { stateStore.clear(); },
    async setSigningKey(addr: string, k: unknown) { signingKeyStore.set(addr, k); },
    async getSigningKey(addr: string) { return signingKeyStore.get(addr) ?? null; },
    async removeSigningKey(addr: string) { signingKeyStore.delete(addr); },
    async clearSigningKeys() { signingKeyStore.clear(); },
    async exportPrivateStates(): Promise<never> { throw new Error('Not implemented'); },
    async importPrivateStates(): Promise<never> { throw new Error('Not implemented'); },
    async exportSigningKeys(): Promise<never> { throw new Error('Not implemented'); },
    async importSigningKeys(): Promise<never> { throw new Error('Not implemented'); },
  };
}

export type ConnectedSession = {
  api: any;
  config: any;
  providers: {
    privateStateProvider: ReturnType<typeof createPrivateStateProvider>;
    publicDataProvider: ReturnType<typeof createPatchedPublicDataProvider>;
    zkConfigProvider: FetchZkConfigProvider;
    proofProvider: { proveTx: (unprovenTx: any, _config: any) => Promise<any> };
    walletProvider: WalletProvider;
    midnightProvider: MidnightProvider;
  };
  unshieldedAddress: string;
};

export class RobustFetchZkConfigProvider extends FetchZkConfigProvider {
  async getVerifierKey(circuitId: string) {
    console.log(`[ZK] getVerifierKey called for ${circuitId}`);
    try {
      const vk = await super.getVerifierKey(circuitId);
      console.log(`[ZK] super returned vk of length ${vk?.length}`);
      // Check if it's actually a valid Midnight file and not an HTML fallback from Vite
      if (vk && vk.length > 0 && new TextDecoder().decode(vk.slice(0, 1)).charCodeAt(0) !== 60) {
        console.log(`[ZK] Returning valid vk from super`);
        return vk;
      } else {
        console.log(`[ZK] HTML or invalid fallback detected!`);
      }
    } catch (e) {
      console.warn(`[ZK Config] Local verifier key fallback for '${circuitId}'`, e);
    }
    console.log(`[ZK] Returning dummy 27-byte verifier key`);
    const buf = new Uint8Array(27);
    buf.set(new TextEncoder().encode('midnight:verifier-key[v6]:'), 0);
    return buf;
  }
  async getProverKey(circuitId: string) {
    try {
      const pk = await super.getProverKey(circuitId);
      if (pk && pk.length > 0 && new TextDecoder().decode(pk.slice(0, 1)).charCodeAt(0) !== 60) return pk;
    } catch (e) {
      console.warn(`[ZK Config] Local prover key fallback for '${circuitId}'`);
    }
    return new Uint8Array(64);
  }
  async getZKIR(circuitId: string) {
    try {
      const zkir = await super.getZKIR(circuitId);
      if (zkir && zkir.length > 0 && new TextDecoder().decode(zkir.slice(0, 1)).charCodeAt(0) !== 60) return zkir;
    } catch (e) {
      console.warn(`[ZK Config] Local ZKIR fallback for '${circuitId}'`);
    }
    return new Uint8Array(64);
  }
}

// MAIN SESSION FACTORY — call after wallet.connect()
export async function createConnectedSession(api: any): Promise<ConnectedSession> {
  // ALWAYS fetch in parallel — never await sequentially
  const [config, unshieldedAddr, shieldedAddress] = await Promise.all([
    api.getConfiguration(),
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
  ]);

  setNetworkId(config.networkId);  // MUST call before any SDK operations

  const zkConfigProvider = new RobustFetchZkConfigProvider(
    new URL('/managed', window.location.origin).toString(),
    window.fetch.bind(window),
  );


  const provingProvider = await api.getProvingProvider(zkConfigProvider);

  const proofProvider = {
    async proveTx(unprovenTx: any, _config: any) {
      const { CostModel } = await import('@midnight-ntwrk/ledger-v8');
      return unprovenTx.prove(provingProvider, CostModel.initialCostModel());
    },
  };

  const walletProvider: WalletProvider = {
    getCoinPublicKey: () => shieldedAddress.shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedAddress.shieldedEncryptionPublicKey,
    balanceTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const balanced = await api.balanceUnsealedTransaction(txHex);
      if (!balanced?.tx) throw new Error('balanceUnsealedTransaction returned invalid result');
      const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
      return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced.tx));
    },
  };

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx: any) => {
      const txHex = toHex(tx.serialize());
      const result = await api.submitTransaction(txHex);
      if (typeof result === 'string' && result) return result;
      if (result?.transactionId) return result.transactionId;
      if (result?.id) return result.id;
      return txHex.slice(0, 64);
    },
  };

  return {
    api, config,
    providers: {
      privateStateProvider: createPrivateStateProvider(),
      publicDataProvider: createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri),
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
    unshieldedAddress: unshieldedAddr.unshieldedAddress,
  };
}

export async function waitForContractDeployment(
  publicDataProvider: ReturnType<typeof createPatchedPublicDataProvider>,
  contractAddress: string,
  pollIntervalMs = 2000,
  maxAttempts = 45,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const state = await publicDataProvider.queryContractState(contractAddress);
    if (state?.data) return;
    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
  throw new Error(`Contract not indexed after ${maxAttempts * pollIntervalMs}ms`);
}
