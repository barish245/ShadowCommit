import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import pino from 'pino';
import { MidnightWalletProvider, syncWallet } from '../src/wallet.js';

// @ts-expect-error
globalThis.WebSocket = WebSocket;

const config = {
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node: 'http://127.0.0.1:9944',
  nodeWS: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
  faucet: '',
};

setNetworkId(config.networkId as any);

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const wallet = await MidnightWalletProvider.build(logger, config as any, SEED);
await wallet.start();

console.log('Waiting for DUST...');
let attempts = 0;
while (attempts < 120) {
  try {
    const state = await wallet.wallet.state().toPromise();
    const balance = (state?.dust?.state as any)?.balances?.amount ?? 0n;
    if (balance > 0n) { 
      console.log(`DUST ready: ${balance}`); 
      process.exit(0); 
    }
  } catch (e) {}
  await new Promise((r) => setTimeout(r, 5000));
  attempts++;
  console.log(`Waiting... attempt ${attempts}`);
}
console.error('DUST never arrived. Is Docker running?');
process.exit(1);
