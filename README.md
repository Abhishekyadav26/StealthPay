# StealthPay

Stealth addresses for Mira Okafor following ERC-5564 scheme 1 (secp256k1).

## Setup
```
forge build
npm install
```

## Run tests
```
forge test
npm test
```

## Usage
- `npx tsx cli/index.ts create` — generate Mira's payment identity (meta-address).
- `npx tsx cli/index.ts pay <metaAddress>` — pay.

Announcer contract: `src/ERC5564Announcer.sol`. Stealth crypto: `src/ts/stealth.ts`.
