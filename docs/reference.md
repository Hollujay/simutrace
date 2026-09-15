---
title: Reference
---
{% include nav.html %}

## CLI flags

`simutrace check` (also runnable as `npm run cli -- check` from a clone):

| Flag | Required | Description |
|---|---|---|
| `--contract <id>` | yes | Contract address to call |
| `--function <name>` | yes | Function to simulate |
| `--network <testnet\|mainnet>` | yes | Testnet uses SimuTrace's built-in RPC endpoint. Mainnet has no single official public endpoint, so `--rpc-url` is also required |
| `--args <key=value,...>` | no | Comma-separated function arguments, matching the function's parameter names. Values are parsed the same way the web app's call builder parses them: numbers, `true`/`false`, `G...`/`C...` addresses, and so on |
| `--rpc-url <url>` | only for mainnet | RPC endpoint to use |
| `--json` | no | Machine-readable JSON instead of text |

### Exit codes

- `0`: the simulation ran successfully, regardless of whether the diff is empty or non-empty. An empty diff from a genuine simulation is a valid result.
- `1`: the simulation did not genuinely complete — an unreachable RPC endpoint, an invalid contract or function, a simulation error reported by the RPC, invalid arguments, or invalid CLI usage. A non-zero exit always means the command has something specific to report; SimuTrace never prints an empty or misleading diff in place of a real failure.

## JSON output schema

`--json` prints one JSON object to stdout.

On success (real output, from the increment example in [Usage](usage)):

```jsonc
{
  "ok": true,
  "contract": "CACI5YOIX2R23F6LZTGUA6ADLZQY6BEVBLIXPDQBMGJ2W6QXIJSKDHHV",
  "function": "increment",
  "network": "testnet",
  "restoreRequired": false,
  "returnValue": 1,
  "minResourceFee": "18332",
  "latestLedger": 4692217,
  "diff": [
    { "key": "\"COUNTER\"", "status": "added", "before": null, "after": 1 }
  ]
}
```

- `restoreRequired` is `true` when the contract data has expired and needs to be restored before it can be simulated; `diff` is empty in that case because no simulation of the actual call could run yet, not because nothing changed.
- Each `diff` entry's `status` is one of `"added"`, `"changed"`, `"removed"`, `"unchanged"`.

On failure (real output, from passing a malformed contract ID):

```jsonc
{
  "ok": false,
  "contract": "CBAD00000000000000000000000000000000000000000000000000000",
  "function": "foo",
  "network": "testnet",
  "error": {
    "kind": "malformed-spec",
    "message": "Failed to parse contract spec: Invalid contract ID: CBAD00000000000000000000000000000000000000000000000000000",
    "details": {
      "contractId": "CBAD00000000000000000000000000000000000000000000000000000",
      "reason": "Invalid contract ID: CBAD00000000000000000000000000000000000000000000000000000"
    }
  }
}
```

A failure object never has a `diff` field. `error.kind` matches one of the kinds the web app also reports: `contract-not-found`, `sac-not-supported`, `no-embedded-spec`, `malformed-spec`, `simulation-failed`, `rpc-unreachable`, `rpc-error`, `invalid-argument`. `error.details` carries the rest of that error's fields for scripting.

## Error kinds (web app and CLI)

| Kind | Meaning |
|---|---|
| `contract-not-found` | No contract found with that ID on the selected network |
| `sac-not-supported` | The address is a Stellar Asset Contract, which has no deployed WASM to read a spec from |
| `no-embedded-spec` | The contract's WASM has no embedded `contractspecv0` section |
| `malformed-spec` | The contract's spec section couldn't be parsed |
| `simulation-failed` | The RPC simulation itself reported an error |
| `rpc-unreachable` | The RPC endpoint couldn't be reached, including likely browser CORS rejection |
| `rpc-error` | The RPC responded with a JSON-RPC error code |
| `invalid-argument` | A call argument didn't match the function's expected parameter type |
