# Threat Model

## Core safety property

SimuTrace never submits real transactions and never requests wallet signatures. All calls are read-only simulations sent to a public Soroban RPC endpoint from the user's browser. There is no code path in this tool that can move funds, change contract state on-chain, or require a private key. This is the property the rest of the design rests on, stated plainly rather than left implicit.

## What SimuTrace does and does not touch

- No private keys or secret keys are ever collected, stored, or transmitted.
- No data is sent to any server controlled by this project; RPC calls go directly from the browser to the public Soroban RPC endpoint the user configures.
- The tool is client-side only; there is no backend that could be compromised to affect users.

See `SECURITY.md` for the vulnerability reporting process.

## Known area of concern

[Issue #2](https://github.com/Hollujay/simutrace/issues/2) tracks a moderate-severity `npm audit` finding in esbuild (via Vite's dependency chain, esbuild <=0.24.2): the development server allows any website open in the browser to send requests to it and read the response. This affects `npm run dev` only, not the production build. It is currently open and unresolved; a non-breaking fix path is still being investigated, since the suggested `npm audit fix --force` would bump Vite to a new major version. Until resolved, avoid running `npm run dev` while browsing untrusted sites in the same browser.
