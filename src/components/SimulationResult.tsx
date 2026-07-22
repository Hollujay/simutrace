import { rpc } from '@stellar/stellar-sdk';
import { scValToNative } from '@stellar/stellar-sdk';

interface SimulationResultProps {
  result: rpc.Api.SimulateTransactionResponse;
}

export function SimulationResult({ result }: SimulationResultProps) {
  if (rpc.Api.isSimulationError(result)) {
    return (
      <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3">
        <p className="text-sm font-medium text-red-400">Simulation Error</p>
        <pre className="mt-1 text-xs text-red-300 whitespace-pre-wrap font-mono">
          {result.error}
        </pre>
      </div>
    );
  }

  if (rpc.Api.isSimulationRestore(result)) {
    return (
      <div className="rounded border border-amber-800 bg-amber-950/30 px-4 py-3">
        <p className="text-sm font-medium text-amber-400">Restore Required</p>
        <p className="mt-1 text-xs text-amber-300">
          This contract data has expired and needs to be restored before it can be used.
        </p>
      </div>
    );
  }

  if (rpc.Api.isSimulationSuccess(result)) {
    let returnValue: unknown = null;
    try {
      if (result.result?.retval) {
        returnValue = scValToNative(result.result.retval);
      }
    } catch {
      returnValue = '(unable to decode)';
    }

    return (
      <div className="rounded border border-emerald-800 bg-emerald-950/30 px-4 py-3">
        <p className="text-sm font-medium text-emerald-400">Simulation Succeeded</p>
        <div className="mt-2 space-y-1 text-xs text-slate-300">
          <p>
            <span className="text-slate-500">Cost:</span>{' '}
            {result.minResourceFee ?? 'unknown'}
          </p>
          {returnValue !== null && (
            <div>
              <span className="text-slate-500">Return value:</span>
              <pre className="mt-0.5 font-mono text-emerald-300 whitespace-pre-wrap">
                {typeof returnValue === 'object'
                  ? JSON.stringify(returnValue, null, 2)
                  : String(returnValue)}
              </pre>
            </div>
          )}
          <p>
            <span className="text-slate-500">Ledger:</span> {result.latestLedger}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-slate-700 bg-slate-800/50 px-4 py-3">
      <p className="text-sm text-slate-400">Unknown simulation response.</p>
    </div>
  );
}
