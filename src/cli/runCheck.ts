import { rpc, scValToNative } from '@stellar/stellar-sdk';
import { getServer, NETWORKS, NETWORK_PASSPHRASES } from '../lib/rpc';
import { fetchContractSpec } from '../lib/contractSpec';
import { simulateCall, DEFAULT_SOURCE_ACCOUNT } from '../lib/simulateCall';
import { extractBeforeMap, extractAfterMap } from '../lib/storageSnapshot';
import { diffStorage } from '../lib/diff';
import { parseArgValue } from './parseArgValue';
import type { SimuTraceError } from '../lib/types';
import type { CliOptions, CheckResult } from './types';

function resolveRpcUrl(options: CliOptions): string | { error: SimuTraceError } {
  if (options.rpcUrl) return options.rpcUrl;
  if (options.network === 'testnet') return NETWORKS.testnet;
  return {
    error: {
      kind: 'invalid-argument',
      field: '--rpc-url',
      expected: 'a mainnet RPC endpoint URL (there is no default for mainnet)',
    },
  };
}

// Runs the same simulation and diff pipeline the web app uses (simulateCall,
// extractBeforeMap/extractAfterMap, diffStorage), given CLI-shaped input
// instead of React state. Never invents a result: every branch either
// reports a real SimuTraceError or returns a diff produced by an actual
// simulation response.
export async function runCheck(options: CliOptions): Promise<CheckResult> {
  const { contract: contractId, function: functionName, network } = options;

  const rpcUrlResult = resolveRpcUrl(options);
  if (typeof rpcUrlResult !== 'string') {
    return { ok: false, contractId, functionName, network, error: rpcUrlResult.error };
  }
  const rpcUrl = rpcUrlResult;

  const server = getServer(rpcUrl);

  let functions;
  try {
    functions = await fetchContractSpec(server, contractId);
  } catch (err: unknown) {
    return { ok: false, contractId, functionName, network, error: err as SimuTraceError };
  }

  const fn = functions.find((f) => f.name === functionName);
  if (!fn) {
    return {
      ok: false,
      contractId,
      functionName,
      network,
      error: {
        kind: 'invalid-argument',
        field: '--function',
        expected: `one of: ${functions.map((f) => f.name).join(', ') || '(no functions found in spec)'}`,
      },
    };
  }

  const parsedArgs = [];
  for (const input of fn.inputs) {
    const raw = options.args[input.name];
    if (raw === undefined || !raw.trim()) {
      return {
        ok: false,
        contractId,
        functionName,
        network,
        error: { kind: 'invalid-argument', field: input.name, expected: `a value of type ${input.type}` },
      };
    }
    const parsed = parseArgValue(raw, input.type);
    if (parsed === null) {
      return {
        ok: false,
        contractId,
        functionName,
        network,
        error: { kind: 'invalid-argument', field: input.name, expected: `a valid ${input.type}` },
      };
    }
    parsedArgs.push(parsed);
  }

  let simResult;
  try {
    simResult = await simulateCall(
      server,
      contractId,
      functionName,
      parsedArgs,
      DEFAULT_SOURCE_ACCOUNT,
      NETWORK_PASSPHRASES[network],
    );
  } catch (err: unknown) {
    const error = err as SimuTraceError;
    return { ok: false, contractId, functionName, network, error };
  }

  if (rpc.Api.isSimulationError(simResult)) {
    return {
      ok: false,
      contractId,
      functionName,
      network,
      error: { kind: 'simulation-failed', reason: simResult.error },
    };
  }

  if (rpc.Api.isSimulationSuccess(simResult) && simResult.stateChanges) {
    const before = extractBeforeMap(simResult.stateChanges);
    const after = extractAfterMap(simResult.stateChanges);
    const diff = diffStorage(before, after);

    let returnValue: unknown = null;
    try {
      if (simResult.result?.retval) {
        returnValue = scValToNative(simResult.result.retval);
      }
    } catch {
      returnValue = null;
    }

    return {
      ok: true,
      contractId,
      functionName,
      network,
      rpcUrl,
      restoreRequired: false,
      returnValue,
      minResourceFee: simResult.minResourceFee,
      latestLedger: simResult.latestLedger,
      diff,
    };
  }

  if (rpc.Api.isSimulationRestore(simResult)) {
    return {
      ok: true,
      contractId,
      functionName,
      network,
      rpcUrl,
      restoreRequired: true,
      returnValue: null,
      minResourceFee: undefined,
      latestLedger: simResult.latestLedger,
      diff: [],
    };
  }

  return {
    ok: false,
    contractId,
    functionName,
    network,
    error: { kind: 'simulation-failed', reason: 'Unexpected simulation response' },
  };
}
