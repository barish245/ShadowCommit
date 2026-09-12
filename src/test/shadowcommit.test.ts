import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx, type DeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type EnvironmentConfiguration, waitForFunds } from '@midnight-ntwrk/testkit-js';
import pino from 'pino';
import crypto from 'crypto';
import { getConfig } from '../config.js';
import { buildProviders, type ShadowCommitProviders } from '../providers.js';
import { MidnightWalletProvider, syncWallet } from '../wallet.js';
import { CompiledShadowCommit, Contract, ledger, pureCircuits, zkConfigPath } from '../../contracts/index.js';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const ALICE_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const PRIVATE_STATE_ID = 'ShadowCommitPrivateState';
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

function resolveSecret() {
  if (network === 'local') return { kind: 'seed' as const, value: ALICE_SEED };
  const upper = network.toUpperCase();
  const mnemonic = process.env[`MIDNIGHT_${upper}_MNEMONIC`]?.trim().replace(/\s+/g, ' ');
  const seed = process.env[`MIDNIGHT_${upper}_SEED`]?.trim();
  if (mnemonic && seed) throw new Error('Set only one of mnemonic or seed.');
  if (mnemonic) return { kind: 'mnemonic' as const, value: mnemonic };
  if (seed) return { kind: 'seed' as const, value: seed };
  throw new Error(`Set MIDNIGHT_${upper}_MNEMONIC or MIDNIGHT_${upper}_SEED`);
}

describe(`ShadowCommit (${network})`, () => {
  let wallet: MidnightWalletProvider;
  let providers: ShadowCommitProviders;
  let contractAddress: ContractAddress;
  let adminSk: Uint8Array;
  
  const config = getConfig();
  const secret = resolveSecret();
  const isRemote = config.faucet !== '';

  async function queryLedger(p: ShadowCommitProviders) {
    const state = await p.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId as any);
    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId as any,
      networkId: config.networkId as any,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    wallet = await MidnightWalletProvider.build(logger, envConfig, secret.value);
    await wallet.start();
    await syncWallet(logger, wallet.wallet, 600_000);

    if (isRemote) {
      const balance = await waitForFunds(wallet as any, envConfig, true, (wallet as any).unshieldedKeystore);
      logger.info(`Balance: ${balance}`);
    }

    providers = buildProviders(wallet, zkConfigPath, config);
    adminSk = new Uint8Array(crypto.randomBytes(32));
  });

  afterAll(async () => { if (wallet) await wallet.stop(); });

  it('deploys the contract', async () => {
    const adminHash = typeof (pureCircuits as any)?.admin_public_key === 'function'
        ? (pureCircuits as any).admin_public_key(adminSk)
        : new Uint8Array(crypto.randomBytes(32));

    const deployed: any = await (deployContract as any)(providers, {
      compiledContract: CompiledShadowCommit,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: {},
      args: [adminHash],
    });
    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`Deployed at: ${contractAddress}`);
    expect(contractAddress).toBeDefined();
  });

  it('admin adds a bounty', async () => {
    const bountyId = new Uint8Array(crypto.createHash('sha256').update('senior-rust-dev').digest());
    await (submitCallTx as any)(providers, {
      compiledContract: CompiledShadowCommit,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: 'add_bounty',
      witnesses: { admin_secret: () => adminSk },
      args: [bountyId, 500n],
    });
    logger.info('Bounty "senior-rust-dev" added with min_score=500');
  });

  it('oracle issues a credential', async () => {
    const devId = new Uint8Array(crypto.createHash('sha256').update('dev-alice').digest());
    const score = 800n;
    
    // Compute the credential commitment
    const commitment = (pureCircuits as any).make_credential_commitment(devId, score);
    
    // Admin (acting as Oracle) adds it to the tree on-chain
    await (submitCallTx as any)(providers, {
      compiledContract: CompiledShadowCommit,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: 'issue_credential',
      witnesses: { admin_secret: () => adminSk },
      args: [commitment],
    });
    
    logger.info('Oracle issued credential');
  });

  it('developer claims bounty with valid credential from Merkle tree', async () => {
    const devId = new Uint8Array(crypto.createHash('sha256').update('dev-alice').digest());
    const score = 800n;
    const bountyId = new Uint8Array(crypto.createHash('sha256').update('senior-rust-dev').digest());
    
    const commitment = (pureCircuits as any).make_credential_commitment(devId, score);
    const ledgerState = await queryLedger(providers);
    const path = (ledgerState.oracle_credentials as any).findPathForLeaf(commitment);

    await (submitCallTx as any)(providers, {
      compiledContract: CompiledShadowCommit,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID,
      circuitId: 'claim_bounty',
      witnesses: {
        dev_credential: () => ({
          dev_id: devId,
          score: score,
        }),
        find_credential_path: () => path,
      },
      args: [bountyId],
    });
    const state = await queryLedger(providers);
    expect(state.total_claims).toEqual(1n);
    logger.info('Developer claimed bounty successfully using Merkle Tree path');
  });

  it('rejects developer with un-attested credential', async () => {
    const devId = new Uint8Array(crypto.createHash('sha256').update('dev-bob').digest());
    const score = 9999n; // Bob fakes his score
    const bountyId = new Uint8Array(crypto.createHash('sha256').update('senior-rust-dev').digest());
    
    // Create a fake path with all zeros for testing
    const fakePath = Array.from({ length: 16 }).map(() => ({
      left: new Uint8Array(32),
      right: new Uint8Array(32),
    }));
    
    // We expect the circuit execution to fail!
    await expect(
      (submitCallTx as any)(providers, {
        compiledContract: CompiledShadowCommit,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: 'claim_bounty',
        witnesses: {
          dev_credential: () => ({
            dev_id: devId,
            score: score,
          }),
          find_credential_path: () => fakePath,
        },
        args: [bountyId],
      }),
    ).rejects.toThrow();
    logger.info('Un-attested fake score correctly rejected');
  });

  it('prevents double claiming (nullifier)', async () => {
    const devId = new Uint8Array(crypto.createHash('sha256').update('dev-alice').digest());
    const score = 800n;
    const bountyId = new Uint8Array(crypto.createHash('sha256').update('senior-rust-dev').digest());
    const commitment = (pureCircuits as any).make_credential_commitment(devId, score);
    const ledgerState = await queryLedger(providers);
    const path = (ledgerState.oracle_credentials as any).findPathForLeaf(commitment);

    // Second claim with same dev_id + bounty_id should fail
    await expect(
      (submitCallTx as any)(providers, {
        compiledContract: CompiledShadowCommit,
        contractAddress,
        privateStateId: PRIVATE_STATE_ID,
        circuitId: 'claim_bounty',
        witnesses: {
          dev_credential: () => ({
            dev_id: devId,
            score: score,
          }),
          find_credential_path: () => path,
        },
        args: [bountyId],
      }),
    ).rejects.toThrow();
    logger.info('Double-claim correctly prevented by nullifier');
  });
});
