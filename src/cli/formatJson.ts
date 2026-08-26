import type { CheckResult } from './types';
import type { DiffEntry, SimuTraceError } from '../lib/types';

// The stable, documented shape for `simutrace check --json`. Field names and
// nesting here are what README.md's "JSON output schema" section describes;
// keep the two in sync when this changes.
export interface JsonDiffEntry {
  key: string;
  status: DiffEntry['status'];
  before: unknown;
  after: unknown;
}

export interface JsonSuccessOutput {
  ok: true;
  contract: string;
  function: string;
  network: string;
  restoreRequired: boolean;
  returnValue: unknown;
  minResourceFee: string | null;
  latestLedger: number;
  diff: JsonDiffEntry[];
}

export interface JsonErrorOutput {
  ok: false;
  contract: string;
  function: string;
  network: string;
  error: {
    kind: SimuTraceError['kind'];
    message: string;
    details: Record<string, unknown>;
  };
}

export type JsonOutput = JsonSuccessOutput | JsonErrorOutput;

function errorMessage(error: SimuTraceError): string {
  switch (error.kind) {
    case 'contract-not-found':
      return `No contract found with ID ${error.contractId}`;
    case 'sac-not-supported':
      return `Contract ${error.contractId} is a Stellar Asset Contract, which isn't supported yet`;
    case 'no-embedded-spec':
      return `Contract ${error.contractId} does not include an embedded spec`;
    case 'malformed-spec':
      return `Failed to parse contract spec: ${error.reason}`;
    case 'simulation-failed':
      return `Simulation failed: ${error.reason}`;
    case 'rpc-unreachable':
      return `Could not reach ${error.url}`;
    case 'rpc-error':
      return `RPC error ${error.code}: ${error.message}`;
    case 'invalid-argument':
      return `${error.field} expected ${error.expected}`;
  }
}

function errorDetails(error: SimuTraceError): Record<string, unknown> {
  const details: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(error)) {
    if (key !== 'kind') details[key] = value;
  }
  return details;
}

export function toJsonOutput(result: CheckResult): JsonOutput {
  if (!result.ok) {
    return {
      ok: false,
      contract: result.contractId,
      function: result.functionName,
      network: result.network,
      error: {
        kind: result.error.kind,
        message: errorMessage(result.error),
        details: errorDetails(result.error),
      },
    };
  }

  return {
    ok: true,
    contract: result.contractId,
    function: result.functionName,
    network: result.network,
    restoreRequired: result.restoreRequired,
    returnValue: result.returnValue,
    minResourceFee: result.minResourceFee ?? null,
    latestLedger: result.latestLedger,
    diff: result.diff.map((entry) => ({
      key: entry.key,
      status: entry.status,
      before: entry.before,
      after: entry.after,
    })),
  };
}

export function formatJson(result: CheckResult): string {
  return JSON.stringify(toJsonOutput(result), null, 2);
}
