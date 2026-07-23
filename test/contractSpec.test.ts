import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchContractSpec } from '../src/lib/contractSpec';
import { contract, rpc } from '@stellar/stellar-sdk';

vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('@stellar/stellar-sdk');
  return {
    ...actual,
    contract: {
      ...actual.contract,
      Spec: {
        ...actual.contract.Spec,
        fromWasm: vi.fn(),
      },
    },
  };
});

function mockServer(): rpc.Server {
  return {
    getContractWasmByContractId: vi.fn(),
    serverURL: new URL('https://soroban-testnet.stellar.org'),
  } as unknown as rpc.Server;
}

describe('fetchContractSpec', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws contract-not-found when the RPC returns 404', async () => {
    const server = mockServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockRejectedValue({
      code: 404,
      message: 'Could not obtain contract hash from server',
    });

    await expect(fetchContractSpec(server, 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5'))
      .rejects.toMatchObject({ kind: 'contract-not-found' });
  });

  it('throws malformed-spec for Error instances from SDK response parsing (not network failures)', async () => {
    const server = mockServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Missing field: ledger entry data'),
    );

    await expect(fetchContractSpec(server, 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5'))
      .rejects.toMatchObject({ kind: 'malformed-spec', reason: 'Missing field: ledger entry data' });
  });

  it('throws rpc-unreachable for non-Error throws (true network-level failure)', async () => {
    const server = mockServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockRejectedValue(
      'string error that is not an Error object',
    );

    await expect(fetchContractSpec(server, 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5'))
      .rejects.toMatchObject({ kind: 'rpc-unreachable' });
  });

  it('throws no-embedded-spec when wasm has no contractspecv0 section', async () => {
    const server = mockServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockResolvedValue(
      Buffer.from('some wasm binary', 'utf-8'),
    );
    (contract.Spec.fromWasm as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Could not obtain contract spec from wasm');
    });

    await expect(fetchContractSpec(server, 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5'))
      .rejects.toMatchObject({ kind: 'no-embedded-spec' });
  });

  it('throws malformed-spec when spec parsing fails partway', async () => {
    const server = mockServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockResolvedValue(
      Buffer.from('valid-wasm-binary', 'utf-8'),
    );
    (contract.Spec.fromWasm as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Failed to read XDR: invalid data at offset 42');
    });

    await expect(fetchContractSpec(server, 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5'))
      .rejects.toMatchObject({ kind: 'malformed-spec' });
  });

  it('returns parsed functions for a well-formed spec', async () => {
    const server = mockServer();
    (server.getContractWasmByContractId as ReturnType<typeof vi.fn>).mockResolvedValue(
      Buffer.from('valid-wasm', 'utf-8'),
    );

    const mockInput = {
      name: () => ({ toString: () => 'to' }),
      doc: () => ({ toString: () => '' }),
      type: () => ({
        switch: () => ({ name: 'scSpecTypeAddress' }),
      }),
    } as unknown as import('@stellar/stellar-sdk').xdr.ScSpecFunctionInputV0;

    const mockOutput = {
      switch: () => ({ name: 'scSpecTypeVoid' }),
      option: () => null,
      result: () => null,
      vec: () => null,
      map: () => null,
      tuple: () => [],
      bytesN: () => 0,
      udt: () => null,
    } as unknown as import('@stellar/stellar-sdk').xdr.ScSpecTypeDef;

    const mockFunctionV0 = {
      name: () => ({ toString: () => 'hello' }),
      doc: () => ({ toString: () => 'Says hello' }),
      inputs: () => [mockInput],
      outputs: () => [mockOutput],
    } as unknown as import('@stellar/stellar-sdk').xdr.ScSpecFunctionV0;

    const mockSpec = {
      funcs: () => [mockFunctionV0],
    } as unknown as contract.Spec;

    (contract.Spec.fromWasm as ReturnType<typeof vi.fn>).mockReturnValue(mockSpec);

    const result = await fetchContractSpec(server, 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('hello');
    expect(result[0].docs).toBe('Says hello');
    expect(result[0].inputs).toHaveLength(1);
    expect(result[0].inputs[0].name).toBe('to');
    expect(result[0].outputs[0].type).toBe('void');
  });
});
