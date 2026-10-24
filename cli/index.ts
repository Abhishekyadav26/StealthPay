import { createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { generateStealthKeys, deriveStealthAddress, recoverStealthPrivateKey, stealthAddressFromPriv } from '../src/ts/stealth';

const cmd = process.argv[2];
if (cmd === 'create') {
  const k = generateStealthKeys();
  console.log(JSON.stringify({
    spendingPrivateKey: '0x' + Buffer.from(k.spendingPrivateKey).toString('hex'),
    viewingPrivateKey: '0x' + Buffer.from(k.viewingPrivateKey).toString('hex'),
    metaAddress: k.metaAddress,
  }, null, 2));
} else if (cmd === 'pay') {
  const meta = process.argv[3];
  const rpc = process.argv[4] || 'http://127.0.0.1:8545';
  const pk = process.argv[5] as `0x${string}`;
  const amt = process.argv[6] || '0.01';
  // derive
  const d = deriveStealthAddress(meta);
  console.log('stealth address', d.stealthAddress);
  const account = privateKeyToAccount(pk);
  const client = createWalletClient({ account, chain: anvil, transport: http(rpc) });
  const hash = await client.sendTransaction({ to: d.stealthAddress, value: parseEther(amt) });
  console.log('tx', hash);
} else {
  console.log('usage: create | pay <meta> [rpc] [pk] [amount]');
}
