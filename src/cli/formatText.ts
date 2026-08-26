import type { CheckResult } from './types';
import type { DiffEntry } from '../lib/types';

// Mirrors the presentation in src/components/SimulationResult.tsx and
// src/components/StorageDiff.tsx, adapted to plain text for a terminal.
function formatValue(value: unknown): string {
  if (value === null) return '(none)';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function formatDiffEntry(entry: DiffEntry): string {
  const lines = [`  [${entry.status}] ${entry.key}`];
  if (entry.status === 'changed' || entry.status === 'removed') {
    lines.push(`    before: ${formatValue(entry.before)}`);
  }
  if (entry.status === 'changed' || entry.status === 'added') {
    lines.push(`    after: ${formatValue(entry.after)}`);
  }
  if (entry.status === 'unchanged') {
    lines.push(`    value: ${formatValue(entry.before)}`);
  }
  return lines.join('\n');
}

function formatErrorText(result: Extract<CheckResult, { ok: false }>): string {
  const { error } = result;
  switch (error.kind) {
    case 'contract-not-found':
      return `Contract not found: no contract found with ID ${error.contractId}. Check the address and network.`;
    case 'sac-not-supported':
      return `SAC not supported: ${error.contractId} is a Stellar Asset Contract, which isn't supported yet.`;
    case 'no-embedded-spec':
      return `No embedded spec: contract ${error.contractId} does not include an embedded spec (contractspecv0).`;
    case 'malformed-spec':
      return `Malformed contract spec: ${error.reason}`;
    case 'simulation-failed':
      return `Simulation failed: ${error.reason}`;
    case 'rpc-unreachable':
      return `RPC unreachable: could not reach ${error.url}. Check the URL and network connection.`;
    case 'rpc-error':
      return `RPC error (code ${error.code}): ${error.message}`;
    case 'invalid-argument':
      return `Invalid argument: ${error.field} expected ${error.expected}.`;
  }
}

export function formatText(result: CheckResult): string {
  if (!result.ok) {
    return `Error: ${formatErrorText(result)}`;
  }

  const lines: string[] = [];
  lines.push(`Contract: ${result.contractId}`);
  lines.push(`Function: ${result.functionName}`);
  lines.push(`Network: ${result.network}`);

  if (result.restoreRequired) {
    lines.push('');
    lines.push('Restore required: this contract data has expired and needs to be restored before it can be used.');
    return lines.join('\n');
  }

  lines.push(`Cost: ${result.minResourceFee ?? 'unknown'}`);
  if (result.returnValue !== null) {
    lines.push(`Return value: ${formatValue(result.returnValue)}`);
  }
  lines.push(`Ledger: ${result.latestLedger}`);
  lines.push('');

  if (result.diff.length === 0) {
    lines.push('No storage entries were touched by this call.');
    return lines.join('\n');
  }

  const changedCount = result.diff.filter((e) => e.status !== 'unchanged').length;
  lines.push(`Storage diff (${changedCount} changed of ${result.diff.length} total):`);
  for (const entry of result.diff) {
    lines.push(formatDiffEntry(entry));
  }

  return lines.join('\n');
}
