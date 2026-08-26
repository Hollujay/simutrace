import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rpc, xdr } from '@stellar/stellar-sdk';
import { fetchContractSpec } from '../src/lib/contractSpec';
import { simulateCall, DEFAULT_SOURCE_ACCOUNT } from '../src/lib/simulateCall';
import { getServer } from '../src/lib/rpc';
import { extractBeforeMap, extractAfterMap } from '../src/lib/storageSnapshot';
import { diffStorage } from '../src/lib/diff';
import { runCheck } from '../src/cli/runCheck';
import {
  FIXTURE_CONTRACT_ID,
  FIXTURE_FUNCTION_NAME,
  installFixtureSpec,
  fixtureSimulationSuccess,
  mockFixtureServer,
} from './fixtures/cliFixture';

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('@stellar/stellar-sdk');
  return {
    ...actual,
    contract: {
      ...actual.contract,
      Spec: { ...actual.contract.Spec, fromWasm: vi.fn() },
    },
    scValToNative: vi.fn((value: unknown) => value),
  };
});

// runCheck resolves its own server from the RPC URL, the same way App.tsx
// does through NetworkSelector; the fixture injects a mock server there
// instead of threading one through runCheck's own signature.
vi.mock('../src/lib/rpc', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../src/lib/rpc');
  return { ...actual, getServer: vi.fn() };
});

describe('CLI reuses the exact same simulation/diff logic as the web app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installFixtureSpec();
  });

  it('produces the same diff as calling simulateCall/diffStorage directly for an identical fixture call', async () => {
    const cliServer = mockFixtureServer();
    (cliServer.simulateTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(
      fixtureSimulationSuccess(0, 5),
    );
    (getServer as ReturnType<typeof vi.fn>).mockReturnValue(cliServer);

    const cliResult = await runCheck({
      contract: FIXTURE_CONTRACT_ID,
      function: FIXTURE_FUNCTION_NAME,
      network: 'testnet',
      args: { amount: '5' },
      json: false,
    });

    // Independently drives the same steps the web app's App.tsx takes
    // (fetchContractSpec -> simulateCall -> extractBeforeMap/extractAfterMap
    // -> diffStorage), against a fresh mock of the identical fixture, to
    // confirm the CLI is not running a second, separately written pipeline.
    const webAppServer = mockFixtureServer();
    (webAppServer.simulateTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(
      fixtureSimulationSuccess(0, 5),
    );

    await fetchContractSpec(webAppServer, FIXTURE_CONTRACT_ID);
    const args = [xdr.ScVal.scvU32(5)];
    const simResult = await simulateCall(
      webAppServer,
      FIXTURE_CONTRACT_ID,
      FIXTURE_FUNCTION_NAME,
      args,
      DEFAULT_SOURCE_ACCOUNT,
    );

    expect(rpc.Api.isSimulationSuccess(simResult)).toBe(true);
    if (!rpc.Api.isSimulationSuccess(simResult) || !simResult.stateChanges) {
      throw new Error('fixture simulation did not return stateChanges');
    }
    const before = extractBeforeMap(simResult.stateChanges);
    const after = extractAfterMap(simResult.stateChanges);
    const webAppDiff = diffStorage(before, after);

    expect(cliResult.ok).toBe(true);
    if (!cliResult.ok) throw new Error('expected CLI result to be ok');
    expect(cliResult.diff).toEqual(webAppDiff);
    expect(cliResult.diff).toEqual([
      { key: JSON.stringify('counter'), before: 0, after: 5, status: 'changed' },
    ]);
  });
});
