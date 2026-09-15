---
title: Introduction
---
{% include nav.html %}

## What it is

SimuTrace takes a specific function call on a Soroban contract, simulates it, and shows a before/after diff of the storage keys that call actually touches — before you submit a real transaction.

## The problem it solves

Soroban's `simulateTransaction` RPC method tells you whether a call would succeed and roughly what it would cost. It does not tell you what the call actually changes. To find that out today, you either read the contract's Rust source and reason about it by hand, or submit the transaction for real and check afterward. SimuTrace closes that gap: it reads the call's transaction footprint, snapshots the storage keys in that footprint before the call, and diffs them against the simulation's own post-call state, all without ever submitting anything.

## How it works, step by step

1. Paste a deployed custom Soroban contract address (testnet or mainnet).
2. SimuTrace fetches the contract's WASM and reads its embedded spec to list callable functions.
3. Pick a function and fill in its arguments in the call builder.
4. SimuTrace simulates the call via RPC and reads the storage keys the simulation's footprint says the call would touch.
5. It shows each touched key's value before and after, plus the return value, cost, and ledger.

See [Architecture](architecture) for how the pieces fit together in code.

## Scope

- Custom Soroban contracts only. Stellar Asset Contracts (SACs) are not yet supported — see [issue #3](https://github.com/Hollujay/simutrace/issues/3).
- Read-only. SimuTrace never submits a transaction or requests a wallet signature.
- Not a general contract browser. For inspecting a contract's full storage or interface, see Stellar Lab's Contract Explorer instead.

## Where to go next

- [Usage](usage) — using the web app and the CLI, with real examples.
- [Reference](reference) — CLI flags, JSON output schema, and error kinds.
- [Architecture](architecture) — how simulation, snapshotting, and diffing fit together.
- [Threat Model](threat-model) — what SimuTrace does and does not touch.
