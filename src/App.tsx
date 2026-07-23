import { useState, useCallback, useRef } from 'react';
import { rpc, xdr } from '@stellar/stellar-sdk';
import { getServer, NETWORKS } from './lib/rpc';
import { fetchContractSpec } from './lib/contractSpec';
import { simulateCall } from './lib/simulateCall';
import { extractBeforeMap, extractAfterMap } from './lib/storageSnapshot';
import { diffStorage } from './lib/diff';
import { isLikelyCorsError } from './lib/corsDetection';
import { NetworkSelector } from './components/NetworkSelector';
import type { NetworkConfig } from './components/NetworkSelector';
import { ContractInput } from './components/ContractInput';
import { FunctionList } from './components/FunctionList';
import { CallBuilder } from './components/CallBuilder';
import { SimulationResult } from './components/SimulationResult';
import { StorageDiff } from './components/StorageDiff';
import { ErrorMessage } from './components/ErrorMessage';
import type { ParsedFunction, DiffEntry, SimuTraceError } from './lib/types';

type AppStatus =
  | { phase: 'idle' }
  | { phase: 'loading-spec'; contractId: string }
  | { phase: 'spec-loaded'; functions: ParsedFunction[] }
  | { phase: 'simulating' }
  | { phase: 'simulated'; result: rpc.Api.SimulateTransactionResponse; diff: DiffEntry[] }
  | { phase: 'error'; error: SimuTraceError };

function App() {
  const [server, setServer] = useState<rpc.Server>(() => getServer(NETWORKS.testnet));
  const [contractId, setContractId] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [status, setStatus] = useState<AppStatus>({ phase: 'idle' });
  const fetchingRef = useRef(false);

  const handleNetworkChange = useCallback((newServer: rpc.Server, _network: NetworkConfig) => {
    setServer(newServer);
    setContractId(null);
    setSelectedFunction(null);
    setStatus({ phase: 'idle' });
  }, []);

  const handleFetch = useCallback(async (id: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setContractId(id);
    setSelectedFunction(null);
    setStatus({ phase: 'loading-spec', contractId: id });

    try {
      const functions = await fetchContractSpec(server, id);
      setStatus({ phase: 'spec-loaded', functions });
    } catch (err: unknown) {
      const error = err as SimuTraceError;
      if (error.kind === 'rpc-unreachable') {
        error.likelyCors = isLikelyCorsError(err);
      }
      setStatus({ phase: 'error', error });
    } finally {
      fetchingRef.current = false;
    }
  }, [server]);

  const handleSimulate = useCallback(async (args: xdr.ScVal[]) => {
    if (!contractId || !selectedFunction) return;
    if (status.phase !== 'spec-loaded') return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setStatus({ phase: 'simulating' });

    try {
      const simResult = await simulateCall(
        server,
        contractId,
        selectedFunction,
        args,
        'GBPLQYVOHTZ4DBZN3IK26F3WA4Q4K7GYBVWKTHL6UZ75U7KJVGMCX2EM',
      );

      if (rpc.Api.isSimulationError(simResult)) {
        setStatus({
          phase: 'error',
          error: { kind: 'simulation-failed', reason: simResult.error },
        });
        return;
      }

      if (rpc.Api.isSimulationSuccess(simResult) && simResult.stateChanges) {
        const before = extractBeforeMap(simResult.stateChanges);
        const after = extractAfterMap(simResult.stateChanges);
        const diff = diffStorage(before, after);
        setStatus({ phase: 'simulated', result: simResult, diff });
      } else if (rpc.Api.isSimulationRestore(simResult)) {
        setStatus({ phase: 'simulated', result: simResult, diff: [] });
      } else {
        setStatus({
          phase: 'error',
          error: { kind: 'simulation-failed', reason: 'Unexpected simulation response' },
        });
      }
    } catch (err: unknown) {
      const error = err as SimuTraceError;
      if (error.kind === 'rpc-unreachable') {
        error.likelyCors = isLikelyCorsError(err);
      }
      setStatus({ phase: 'error', error });
    } finally {
      fetchingRef.current = false;
    }
  }, [server, contractId, selectedFunction, status]);

  const functions =
    status.phase === 'spec-loaded' || status.phase === 'simulating' || status.phase === 'simulated'
      ? (status as { functions?: ParsedFunction[] }).functions ?? []
      : [];

  const selectedFn = functions.find((f) => f.name === selectedFunction);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SimuTrace</h1>
            <p className="text-sm text-slate-400">
              Soroban contract storage diff — before you submit
            </p>
          </div>
          <NetworkSelector onNetworkChange={handleNetworkChange} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <ContractInput onFetch={handleFetch} loading={status.phase === 'loading-spec'} />

        {status.phase === 'error' && <ErrorMessage error={status.error} />}

        {(status.phase === 'spec-loaded' || status.phase === 'simulating' || status.phase === 'simulated') && (
          <>
            <FunctionList
              functions={functions}
              selectedName={selectedFunction}
              onSelect={(name) => {
                setSelectedFunction(name);
                if (status.phase === 'simulated') {
                  setStatus({ phase: 'spec-loaded', functions });
                }
              }}
            />

            {selectedFn && (
              <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <CallBuilder
                  fn={selectedFn}
                  onSimulate={handleSimulate}
                  simulating={status.phase === 'simulating'}
                />
              </section>
            )}

            {status.phase === 'simulating' && (
              <p className="text-sm text-slate-400 animate-pulse">Simulating transaction…</p>
            )}

            {status.phase === 'simulated' && (
              <>
                <SimulationResult result={status.result} />
                <StorageDiff entries={status.diff} />
              </>
            )}
          </>
        )}

        {status.phase === 'idle' && (
          <p className="text-sm text-slate-500">
            Enter a contract address above to inspect its functions and simulate a call.
          </p>
        )}
      </main>
    </div>
  );
}

export default App;
