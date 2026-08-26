import { vi } from 'vitest';
import { xdr, rpc, contract } from '@stellar/stellar-sdk';
import { DEFAULT_SOURCE_ACCOUNT } from '../../src/lib/simulateCall';

export const FIXTURE_CONTRACT_ID = 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5';
export const FIXTURE_FUNCTION_NAME = 'increment';
export { DEFAULT_SOURCE_ACCOUNT as FIXTURE_SOURCE_ACCOUNT };

// A single-input "increment(amount: u32)" function, shaped the same way
// contractSpec.test.ts builds fixtures: the fake xdr.ScSpecTypeDef objects
// carry a `.switch()` that returns a plain object with the same `.name` a
// real xdr.ScSpecType enum member would have. specTypeToInner/specTypeToFull
// in src/lib/contractSpec.ts fall through to reading that `.name` for any
// type they don't special-case, which is enough to reproduce "u32" without
// needing a real xdr.ScSpecType instance.
function mockSpecFunction(name: string) {
  const mockInput = {
    name: () => ({ toString: () => 'amount' }),
    doc: () => ({ toString: () => '' }),
    type: () => ({ switch: () => ({ name: 'scSpecTypeU32' }) }),
  } as unknown as import('@stellar/stellar-sdk').xdr.ScSpecFunctionInputV0;

  const mockOutput = {
    switch: () => ({ name: 'scSpecTypeU32' }),
  } as unknown as import('@stellar/stellar-sdk').xdr.ScSpecTypeDef;

  return {
    name: () => ({ toString: () => name }),
    doc: () => ({ toString: () => 'Increments the counter' }),
    inputs: () => [mockInput],
    outputs: () => [mockOutput],
  } as unknown as import('@stellar/stellar-sdk').xdr.ScSpecFunctionV0;
}

export function installFixtureSpec() {
  const mockSpec = {
    funcs: () => [mockSpecFunction(FIXTURE_FUNCTION_NAME)],
  } as unknown as contract.Spec;
  (contract.Spec.fromWasm as ReturnType<typeof vi.fn>).mockReturnValue(mockSpec);
}

// A fake xdr.LedgerEntry whose contractData key/val are plain JS values
// rather than real ScVal instances. Pairs with the scValToNative mock in
// each test file, which must be set to an identity function for this to
// decode correctly.
function fakeLedgerEntry(key: string, value: unknown) {
  return {
    data: () => ({
      switch: () => xdr.LedgerEntryType.contractData(),
      contractData: () => ({
        key: () => key,
        val: () => value,
      }),
    }),
  } as unknown as xdr.LedgerEntry;
}

export const FIXTURE_STORAGE_KEY = 'counter';

export function fixtureStateChanges(beforeValue: number, afterValue: number): rpc.Api.LedgerEntryChange[] {
  return [
    {
      type: 'created',
      key: {} as xdr.LedgerKey,
      before: fakeLedgerEntry(FIXTURE_STORAGE_KEY, beforeValue),
      after: fakeLedgerEntry(FIXTURE_STORAGE_KEY, afterValue),
    } as unknown as rpc.Api.LedgerEntryChange,
  ];
}

export function fixtureSimulationSuccess(beforeValue: number, afterValue: number) {
  return {
    transactionData: {},
    stateChanges: fixtureStateChanges(beforeValue, afterValue),
    result: { retval: undefined },
    minResourceFee: '100',
    latestLedger: 12345,
    cost: { cpuInsns: '0', memBytes: '0' },
    latestLedgerCloseTime: 0,
  } as unknown as rpc.Api.SimulateTransactionSuccessResponse;
}

export function mockFixtureServer() {
  return {
    getContractWasmByContractId: vi.fn().mockResolvedValue(new Uint8Array([0, 1, 2])),
    getAccount: vi.fn().mockRejectedValue(new Error('account not found')),
    simulateTransaction: vi.fn(),
    serverURL: new URL('https://soroban-testnet.stellar.org'),
  } as unknown as rpc.Server;
}
