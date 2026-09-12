import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightWalletProvider } from './wallet.js';
import { type NetworkConfig } from './config.js';

export type ShadowCommitCircuits = 'issue_credential' | 'claim_bounty' | 'add_bounty' | 'update_config';

export type ShadowCommitProviders = MidnightProviders<ShadowCommitCircuits, any>;

export function buildProviders(
  wallet: MidnightWalletProvider,
  zkConfigPath: string,
  config: NetworkConfig,
): ShadowCommitProviders {
  const zkConfigProvider = new NodeZkConfigProvider<ShadowCommitCircuits>(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `shadowcommit-${Date.now()}`,
      walletProvider: wallet,
      privateStoragePasswordProvider: () => 'xK9#mQ2$pL8@nR5!vW3*',
      accountId: `test-account-${Date.now()}`,
    } as any),
    publicDataProvider: indexerPublicDataProvider(
      config.indexer,
      config.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      config.proofServer,
      zkConfigProvider,
    ),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
}
