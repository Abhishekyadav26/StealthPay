import { describe, it, expect } from 'vitest';
import {
  generateStealthKeys, deriveStealthAddress, recoverStealthPrivateKey,
  stealthAddressFromPriv, checkViewTag, parseMetaAddress,
} from '../../src/ts/stealth';

describe('stealth', () => {
  it('roundtrip', () => {
    const keys = generateStealthKeys();
    const derived = deriveStealthAddress(keys.metaAddress);
    console.log('stealth', derived.stealthAddress, 'viewTag', derived.viewTag);
    expect(checkViewTag(keys.viewingPrivateKey, derived.ephemeralPublicKey, derived.viewTag)).toBe(true);
    const priv = recoverStealthPrivateKey(keys.spendingPrivateKey, keys.viewingPrivateKey, derived.ephemeralPublicKey);
    const addr = stealthAddressFromPriv(priv);
    expect(addr.toLowerCase()).toBe(derived.stealthAddress.toLowerCase());
  });

  it('two payments different addresses', () => {
    const keys = generateStealthKeys();
    const a = deriveStealthAddress(keys.metaAddress);
    const b = deriveStealthAddress(keys.metaAddress);
    expect(a.stealthAddress).not.toBe(b.stealthAddress);
  });
});
