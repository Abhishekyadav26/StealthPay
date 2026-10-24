import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak256 } from 'viem';
import { toHex, hexToBytes, bytesToHex } from 'viem';

const N = secp256k1.Point.Fn.ORDER;
const G = secp256k1.Point.BASE;

function toBytes32(b: bigint): Uint8Array {
  const out = new Uint8Array(32);
  let x = b;
  for (let i = 31; i >= 0; i--) { out[i] = Number(x & 0xffn); x >>= 8n; }
  return out;
}

export function randomPrivKey(): Uint8Array {
  return secp256k1.utils.randomSecretKey();
}

export function pubKey(priv: Uint8Array): Uint8Array {
  return secp256k1.getPublicKey(priv, false); // uncompressed 65 bytes
}

export function pubKeyCompressed(priv: Uint8Array): Uint8Array {
  return secp256k1.getPublicKey(priv, true);
}

export function ecdh(priv: Uint8Array, pub: Uint8Array): Uint8Array {
  const point = secp256k1.getSharedSecret(priv, pub, false);
  // shared secret x coordinate (drop prefix)
  return point.slice(1, 33);
}

export function hashShared(sharedX: Uint8Array): Uint8Array {
  const h = keccak256(bytesToHex(sharedX) as `0x${string}`);
  return hexToBytes(h);
}

export function pubkeyToAddress(pub: Uint8Array): `0x${string}` {
  // pub uncompressed 65 bytes, skip 04
  const h = keccak256(bytesToHex(pub.slice(1)) as `0x${string}`);
  return (`0x${h.slice(-40)}`) as `0x${string}`;
}

export interface StealthKeys {
  spendingPrivateKey: Uint8Array;
  viewingPrivateKey: Uint8Array;
  spendingPublicKey: Uint8Array;
  viewingPublicKey: Uint8Array;
  metaAddress: string; // 0x + spendingPub(65? compressed) + viewingPub
}

export function generateStealthKeys(): StealthKeys {
  const sp = randomPrivKey();
  const vp = randomPrivKey();
  const spub = pubKeyCompressed(sp);
  const vpub = pubKeyCompressed(vp);
  return {
    spendingPrivateKey: sp,
    viewingPrivateKey: vp,
    spendingPublicKey: spub,
    viewingPublicKey: vpub,
    metaAddress: '0x' + bytesToHex(spub).slice(2) + bytesToHex(vpub).slice(2),
  };
}

export function parseMetaAddress(meta: string): { spendingPub: Uint8Array; viewingPub: Uint8Array } {
  const hex = meta.startsWith('0x') ? meta.slice(2) : meta;
  // compressed pubkeys are 33 bytes = 66 hex chars each
  const sp = hexToBytes(('0x' + hex.slice(0, 66)) as `0x${string}`);
  const vp = hexToBytes(('0x' + hex.slice(66, 132)) as `0x${string}`);
  return { spendingPub: sp, viewingPub: vp };
}

export interface DerivedStealth {
  stealthAddress: `0x${string}`;
  ephemeralPublicKey: Uint8Array; // compressed
  viewTag: number;
  stealthPrivateKey?: Uint8Array;
}

export function deriveStealthAddress(metaAddress: string, ephemeralPriv?: Uint8Array): DerivedStealth {
  const { spendingPub, viewingPub } = parseMetaAddress(metaAddress);
  const r = ephemeralPriv ?? randomPrivKey();
  // R = r*G compressed
  const R = pubKeyCompressed(r);
  // shared = r * V (viewing pub)
  const sharedX = ecdh(r, viewingPub);
  const h = hashShared(sharedX);
  const viewTag = h[0];
  // stealth pubkey = S + h*G
  const hScalar = BigInt('0x' + bytesToHex(h).slice(2));
  const S = secp256k1.Point.fromHex(spendingPub);
  const hG = G.multiply(hScalar);
  const stealthPoint = S.add(hG);
  const stealthPubUncomp = stealthPoint.toBytes(false);
  const stealthAddress = pubkeyToAddress(stealthPubUncomp);
  return { stealthAddress, ephemeralPublicKey: R, viewTag, };
}

export function recoverStealthPrivateKey(
  spendingPriv: Uint8Array,
  viewingPriv: Uint8Array,
  ephemeralPub: Uint8Array
): Uint8Array {
  const sharedX = ecdh(viewingPriv, ephemeralPub);
  const h = hashShared(sharedX);
  const hScalar = BigInt('0x' + bytesToHex(h).slice(2));
  const s = BigInt('0x' + bytesToHex(spendingPriv).slice(2));
  const stealthPriv = (s + hScalar) % N;
  return hexToBytes(('0x' + stealthPriv.toString(16).padStart(64, '0')) as `0x${string}`);
}

export function checkViewTag(
  viewingPriv: Uint8Array,
  ephemeralPub: Uint8Array,
  expectedViewTag: number
): boolean {
  const sharedX = ecdh(viewingPriv, ephemeralPub);
  const h = hashShared(sharedX);
  return h[0] === expectedViewTag;
}

export function stealthAddressFromPriv(priv: Uint8Array): `0x${string}` {
  return pubkeyToAddress(pubKey(priv));
}
