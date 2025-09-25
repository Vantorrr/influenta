// Ensure global `crypto` exists in Node 18 runtime
// Some libraries reference global `crypto.randomUUID()` (Web Crypto API style)
// In Node 18 this may not be present by default, so we polyfill it from Node's crypto module.

import * as nodeCrypto from 'crypto';

// Attach full node crypto to global if missing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g: any = globalThis as any;

if (!g.crypto) {
  g.crypto = nodeCrypto as unknown as Crypto;
}

// Additionally, ensure randomUUID exists (Node 18 provides it on the module)
if (typeof (g.crypto as any).randomUUID !== 'function' && typeof (nodeCrypto as any).randomUUID === 'function') {
  (g.crypto as any).randomUUID = (nodeCrypto as any).randomUUID.bind(nodeCrypto);
}


