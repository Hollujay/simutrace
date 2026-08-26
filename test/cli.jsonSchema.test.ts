import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServer } from '../src/lib/rpc';
import { runCheck } from '../src/cli/runCheck';
import { toJsonOutput } from '../src/cli/formatJson';
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

vi.mock('../src/lib/rpc', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../src/lib/rpc');
  return { ...actual, getServer: vi.fn() };
});

describe('--json output matches its documented schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installFixtureSpec();
  });

  it('matches the documented success schema', async () => {
    const server = mockFixtureServer();
    (server.simulateTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(
      fixtureSimulationSuccess(0, 5),
    );
    (getServer as ReturnType<typeof vi.fn>).mockReturnValue(server);

    const result = await runCheck({
      contract: FIXTURE_CONTRACT_ID,
      function: FIXTURE_FUNCTION_NAME,
      network: 'testnet',
      args: { amount: '5' },
      json: true,
    });

    const json = toJsonOutput(result);

    expect(json).toEqual({
      ok: true,
      contract: FIXTURE_CONTRACT_ID,
      function: FIXTURE_FUNCTION_NAME,
      network: 'testnet',
      restoreRequired: false,
      returnValue: null,
      minResourceFee: '100',
      latestLedger: 12345,
      diff: [
        {
          key: JSON.stringify('counter'),
          status: 'changed',
          before: 0,
          after: 5,
        },
      ],
    });

    // Field presence and types per README's documented schema.
    expect(typeof json.ok).toBe('boolean');
    if (json.ok) {
      expect(typeof json.contract).toBe('string');
      expect(typeof json.function).toBe('string');
      expect(typeof json.network).toBe('string');
      expect(typeof json.restoreRequired).toBe('boolean');
      expect(typeof json.latestLedger).toBe('number');
      expect(Array.isArray(json.diff)).toBe(true);
      for (const entry of json.diff) {
        expect(typeof entry.key).toBe('string');
        expect(['added', 'changed', 'removed', 'unchanged']).toContain(entry.status);
        expect(entry).toHaveProperty('before');
        expect(entry).toHaveProperty('after');
      }
    }
  });

  it('matches the documented failure schema', async () => {
    const server = mockFixtureServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: 404,
      message: 'Could not obtain contract instance from server',
    });
    (getServer as ReturnType<typeof vi.fn>).mockReturnValue(server);

    const result = await runCheck({
      contract: FIXTURE_CONTRACT_ID,
      function: FIXTURE_FUNCTION_NAME,
      network: 'testnet',
      args: {},
      json: true,
    });

    const json = toJsonOutput(result);

    expect(json.ok).toBe(false);
    if (json.ok) throw new Error('expected failure json');
    expect(json).toEqual({
      ok: false,
      contract: FIXTURE_CONTRACT_ID,
      function: FIXTURE_FUNCTION_NAME,
      network: 'testnet',
      error: {
        kind: 'contract-not-found',
        message: expect.any(String),
        details: { contractId: FIXTURE_CONTRACT_ID },
      },
    });
    expect(json).not.toHaveProperty('diff');
  });
});
