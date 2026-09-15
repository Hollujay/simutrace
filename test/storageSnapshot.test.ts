import { describe, it, expect } from 'vitest';
import { xdr, nativeToScVal, StrKey } from '@stellar/stellar-sdk';
import { extractBeforeMap, extractAfterMap } from '../src/lib/storageSnapshot';
import type { rpc } from '@stellar/stellar-sdk';

function contractInstanceEntry(storage: { key: string; value: number }[]): xdr.LedgerEntry {
  const instance = new xdr.ScContractInstance({
    executable: xdr.ContractExecutable.contractExecutableStellarAsset(),
    storage:
      storage.length === 0
        ? null
        : storage.map(
            (entry) =>
              new xdr.ScMapEntry({
                key: nativeToScVal(entry.key, { type: 'symbol' }),
                val: nativeToScVal(entry.value, { type: 'u32' }),
              }),
          ),
  });

  const contractData = new xdr.ContractDataEntry({
    ext: new xdr.ExtensionPoint(0),
    contract: nativeToScVal(StrKey.encodeContract(Buffer.alloc(32)), {
      type: 'address',
    }),
    key: xdr.ScVal.scvLedgerKeyContractInstance(),
    durability: xdr.ContractDataDurability.persistent(),
    val: xdr.ScVal.scvContractInstance(instance),
  });

  return new xdr.LedgerEntry({
    lastModifiedLedgerSeq: 0,
    data: xdr.LedgerEntryData.contractData(contractData),
    ext: new xdr.LedgerEntryExt(0),
  });
}

describe('extractBeforeMap / extractAfterMap with instance storage', () => {
  it('unwraps the ScContractInstance struct into its individual storage keys', () => {
    const before = contractInstanceEntry([]);
    const after = contractInstanceEntry([{ key: 'COUNTER', value: 1 }]);

    const stateChanges = [{ before, after } as unknown as rpc.Api.LedgerEntryChange];

    const beforeMap = extractBeforeMap(stateChanges);
    const afterMap = extractAfterMap(stateChanges);

    expect(beforeMap.size).toBe(0);
    expect(afterMap.get('"COUNTER"')).toBe(1);
  });
});
