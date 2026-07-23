import type { SimuTraceError } from '../lib/types';

interface ErrorMessageProps {
  error: SimuTraceError;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  switch (error.kind) {
    case 'contract-not-found':
      return (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Contract not found</p>
          <p className="mt-1 text-xs text-red-300">
            No contract found with ID <code className="font-mono">{error.contractId}</code>.
            Check the address and network.
          </p>
        </div>
      );

    case 'sac-not-supported':
      return (
        <div className="rounded border border-amber-800 bg-amber-950/30 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">SAC not supported</p>
          <p className="mt-1 text-xs text-amber-300">
            Contract <code className="font-mono">{error.contractId}</code> is a Stellar Asset
            Contract (SAC), which isn't supported yet. Try a custom Soroban contract instead.
          </p>
        </div>
      );

    case 'no-embedded-spec':
      return (
        <div className="rounded border border-amber-800 bg-amber-950/30 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">No embedded spec</p>
          <p className="mt-1 text-xs text-amber-300">
            Contract <code className="font-mono">{error.contractId}</code> does not include an
            embedded spec (contractspecv0). SimuTrace requires a spec to determine function
            signatures.
          </p>
        </div>
      );

    case 'malformed-spec':
      return (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Malformed contract spec</p>
          <p className="mt-1 text-xs text-red-300">
            Failed to parse the contract spec: {error.reason}
          </p>
        </div>
      );

    case 'simulation-failed':
      return (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Simulation failed</p>
          <p className="mt-1 text-xs text-red-300">{error.reason}</p>
        </div>
      );

    case 'rpc-unreachable':
      return (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">RPC unreachable</p>
          <p className="mt-1 text-xs text-red-300">
            {error.likelyCors
              ? "This RPC endpoint isn't reachable from a browser (CORS). Try a provider that allows browser origins, or use testnet."
              : `Could not reach ${error.url}. Check the URL and network connection.`}
          </p>
        </div>
      );

    case 'rpc-error':
      return (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">RPC error (code {error.code})</p>
          <p className="mt-1 text-xs text-red-300">{error.message}</p>
        </div>
      );

    case 'invalid-argument':
      return (
        <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
          <p className="text-sm font-medium text-red-400">Invalid argument</p>
          <p className="mt-1 text-xs text-red-300">
            Field <code className="font-mono">{error.field}</code> expected {error.expected}.
          </p>
        </div>
      );
  }
}
