import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServer } from '../src/lib/rpc';
import { runCheck } from '../src/cli/runCheck';
import { formatText } from '../src/cli/formatText';
import { toJsonOutput } from '../src/cli/formatJson';
import {
  FIXTURE_CONTRACT_ID,
  FIXTURE_FUNCTION_NAME,
  installFixtureSpec,
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

describe('a genuine RPC failure is reported clearly, never as an empty diff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installFixtureSpec();
  });

  it('reports rpc-unreachable and returns ok:false when simulateTransaction cannot reach the RPC', async () => {
    const server = mockFixtureServer();
    (server.simulateTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(
      new TypeError('fetch failed'),
    );
    (getServer as ReturnType<typeof vi.fn>).mockReturnValue(server);

    const result = await runCheck({
      contract: FIXTURE_CONTRACT_ID,
      function: FIXTURE_FUNCTION_NAME,
      network: 'testnet',
      args: { amount: '5' },
      json: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure result');
    expect(result.error.kind).toBe('rpc-unreachable');

    // The failure must never present itself as "no changes detected": no
    // result carries a `diff` field at all when ok is false.
    expect(result).not.toHaveProperty('diff');

    const text = formatText(result);
    expect(text).toMatch(/^Error: RPC unreachable/);
    expect(text).not.toMatch(/no storage entries/i);

    const json = toJsonOutput(result);
    expect(json.ok).toBe(false);
    if (json.ok) throw new Error('expected failure json');
    expect(json.error.kind).toBe('rpc-unreachable');
  });

  it('reports contract-not-found instead of an empty diff when the contract does not exist', async () => {
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
      json: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected failure result');
    expect(result.error.kind).toBe('contract-not-found');
    expect(result).not.toHaveProperty('diff');
  });
});
