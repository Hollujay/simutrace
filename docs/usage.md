---
title: Usage
---
{% include nav.html %}

## Web app

Use the live app at [simutrace.vercel.app](https://simutrace.vercel.app), or run it locally:

```bash
git clone https://github.com/Hollujay/simutrace.git
cd simutrace
npm install
npm run dev
```

1. Choose a network (Testnet, Mainnet, or a custom RPC URL) in the top-right selector.
2. Paste a deployed custom Soroban contract address and click **Fetch**.
3. Pick a function from the list.
4. Fill in its arguments and click **Simulate**.
5. If the call writes to storage, each affected key appears with its value before and after. If the call needs a restore first (its data has expired), SimuTrace tells you that instead of showing a diff.

## CLI

The CLI runs the exact same simulation and diff logic as the web app, useful for scripting or CI assertions.

```bash
npm run cli -- check --contract <id> --function <name> --network <testnet|mainnet> --args <key=value,...> [--json]
```

Example against a real testnet contract:

```bash
$ npm run cli -- check --contract CACI5YOIX2R23F6LZTGUA6ADLZQY6BEVBLIXPDQBMGJ2W6QXIJSKDHHV --function increment --network testnet
Contract: CACI5YOIX2R23F6LZTGUA6ADLZQY6BEVBLIXPDQBMGJ2W6QXIJSKDHHV
Function: increment
Network: testnet
Cost: 18332
Return value: 1
Ledger: 4692213

Storage diff (1 changed of 1 total):
  [added] "COUNTER"
    after: 1
```

See [Reference](reference) for the full flag list, JSON schema, and exit codes.
