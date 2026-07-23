# SimuTrace

[![CI](https://github.com/Hollujay/simutrace/actions/workflows/ci.yml/badge.svg)](https://github.com/Hollujay/simutrace/actions/workflows/ci.yml)

A browser-based tool that shows exactly how a Soroban smart contract call will change storage, before you submit a real transaction.

## What this is (and isn't)

SimuTrace exists for one job: take a specific function call on a Soroban contract, simulate it, and show a clear before/after diff of the storage keys that call actually touches.

It does **not**:

- Provide a general contract browser or spec viewer (see Stellar Lab's Contract Explorer for that)
- Submit real transactions or request wallet signatures. All calls are read-only simulations.
- Support Stellar Asset Contracts (SACs) yet. SACs have no deployed WASM, so the current spec-fetching approach doesn't work for them. Custom Soroban contracts are supported.

## Quick start

Requires Node 22+.

```bash
git clone https://github.com/Hollujay/simutrace.git
cd simutrace
npm install
npm run dev
```

Open the local URL, paste a deployed custom Soroban contract address on testnet, pick a function, fill in its arguments, and simulate. If the call writes to storage, you'll see each affected key with its value before and after.

Not yet deployed anywhere public; run it locally for now.

## Architecture

```
ContractInput -> contractSpec.ts -> FunctionList -> CallBuilder
                                                        |
                                                        v
                                              simulateCall (simulateCall.ts)
                                                        |
                                          +-------------+-------------+
                                          v                           v
                                  storageSnapshot.ts            SimulationResult
                                  (before, via footprint)
                                          |
                                          v
                                    diff.ts -> StorageDiff
```

The simulation's footprint tells us which storage keys a call would touch. We read those keys' current values before simulating, then diff them against the values the simulation returns. This is why only the keys a specific call touches can be diffed, not a contract's full storage.

## Contributing

See CONTRIBUTING.md for setup and code style. Security issues should be reported privately, see SECURITY.md.

## Maintainer

@Hollujay.
