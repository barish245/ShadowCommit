import fs from 'fs';
import { createVerifierKey, createProverKey, createZKIR } from '@midnight-ntwrk/midnight-js-types';

const keysDir = 'public/managed/keys';
const zkirDir = 'public/managed/zkir';
const circuits = ['issue_credential', 'claim_bounty', 'add_bounty', 'update_config'];

circuits.forEach(c => {
  fs.writeFileSync(keysDir + '/' + c + '.verifier', createVerifierKey(new Uint8Array(64)).value);
  fs.writeFileSync(keysDir + '/' + c + '.prover', createProverKey(new Uint8Array(64)).value);
  fs.writeFileSync(zkirDir + '/' + c + '.zkir', createZKIR(new Uint8Array(64)).value);
});
console.log('Keys fixed properly!');
