# Architecture

SimuTrace takes a specific function call on a Soroban contract, simulates it, and shows a before/after diff of the storage keys that call actually touches.

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

## Why only touched keys, not full storage

`simulateCall.ts` sends the call to a Soroban RPC endpoint's simulation method, which returns a transaction footprint: the set of ledger entries (storage keys) the call would read or write if actually submitted. `storageSnapshot.ts` uses that footprint to fetch the current value of each of those keys, before the call runs.

The simulation result already contains the post-call values for the same footprint. `diff.ts` compares the pre-call snapshot to the post-call values, key by key, to produce a `StorageDiff`.

This footprint-based approach is why SimuTrace can only diff the keys a specific call touches, and not a contract's full storage: the RPC simulation only reports the footprint for the call it was asked to simulate. There is no general mechanism here for enumerating or snapshotting every storage key a contract owns, only the ones a given function call would read or write. Browsing a contract's entire storage is a different problem (see Stellar Lab's Contract Explorer), and is explicitly out of scope, as noted in the README.
