import { createVerifierKey } from '@midnight-ntwrk/midnight-js-types';
const vk = createVerifierKey(new Uint8Array(64));
console.log(typeof vk, Buffer.isBuffer(vk), vk.constructor.name);
console.log(Object.keys(vk));
