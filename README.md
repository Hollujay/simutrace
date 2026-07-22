# SimuTrace

**A browser-based tool that shows exactly how a Soroban smart contract call will change storage — before you ever submit a real transaction.**

No wallet required. No signing. No mainnet writes.

## Scope

[Stellar Lab's Contract Explorer](https://lab.stellar.org) already covers general contract inspection: contract info, spec browsing, source code, a static view of all storage entries, and simulating a call to see its result and fee. SimuTrace does **not** duplicate that.

SimuTrace exists for exactly one thing the official tool doesn't do:

> Take one specific function call, simulate it, and show a clear **before/after diff of only the storage keys that call actually touches.**

Everything in this app serves that one job. If you need a general-purpose contract browser, use Stellar Lab.

## Quick Start

```bash
npm install
npm run dev
```

Open the URL shown in your terminal (default `http://localhost:5173`). Paste a deployed Soroban contract ID (C... address) and pick a function to simulate.

## How it works

1. **Fetch spec** — reads the contract's embedded WASM spec to know what functions exist and their argument types.
2. **Build call** — you fill in the function arguments via a dynamic form.
3. **Simulate** — calls `simulateTransaction` against the Soroban RPC endpoint. No real transaction is submitted, no wallet signing required.
4. **Diff storage** — extracts the ledger keys the simulation footprint touched, reads their before/after values, and renders a diff.

## Tech Stack

- React 18, TypeScript 5 (strict), Vite 5
- Tailwind CSS 3
- `@stellar/stellar-sdk` for all Soroban RPC interactions
- Vitest for unit tests

## Networks

- **Testnet** — works out of the box (`https://soroban-testnet.stellar.org`).
- **Mainnet** — requires you to supply your own RPC provider URL. There is no stable public default.
- **Custom** — any Soroban-compatible RPC endpoint.

## No Transaction Submission

SimuTrace is explicitly **simulate-only**. No wallet integration, no `sendTransaction`, no signing. The only `TransactionBuilder` usage in the entire codebase is inside `simulateCall` which calls `simulateTransaction` exclusively. This is enforced by a test (`test/rpc.test.ts`).
