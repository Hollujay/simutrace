import { rpc, xdr, scValToNative } from '@stellar/stellar-sdk';

// The contract instance's own ledger entry doesn't hold a plain ScVal: its
// value is an ScContractInstance struct bundling the executable plus every
// key this contract has written under instance storage. scValToNative can't
// decode that struct, so we unwrap it here and surface each of its storage
// entries individually, keyed the same way a persistent/temporary entry
// would be.
function contractInstanceStorageValues(instance: xdr.ScContractInstance): { key: string; value: unknown }[] {
  const storage = instance.storage() ?? [];
  return storage.map((entry) => ({
    key: JSON.stringify(scValToNative(entry.key())),
    value: scValToNative(entry.val()),
  }));
}

function ledgerEntryDataToStorageValues(data: xdr.LedgerEntryData): { key: string; value: unknown }[] {
  if (data.switch() !== xdr.LedgerEntryType.contractData()) return [];
  const contractData = data.contractData();
  const val = contractData.val();
  if (val.switch().value === xdr.ScValType.scvContractInstance().value) {
    return contractInstanceStorageValues(val.instance());
  }
  const key = scValToNative(contractData.key());
  const value = scValToNative(val);
  return [{ key: JSON.stringify(key), value }];
}

export function extractBeforeMap(
  stateChanges: rpc.Api.LedgerEntryChange[],
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const change of stateChanges) {
    if (!change.before) continue;
    for (const storage of ledgerEntryDataToStorageValues(change.before.data())) {
      map.set(storage.key, storage.value);
    }
  }
  return map;
}

export function extractAfterMap(
  stateChanges: rpc.Api.LedgerEntryChange[],
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const change of stateChanges) {
    if (!change.after) continue;
    for (const storage of ledgerEntryDataToStorageValues(change.after.data())) {
      map.set(storage.key, storage.value);
    }
  }
  return map;
}

export async function fetchBeforeFromLedger(
  server: rpc.Server,
  stateChanges: rpc.Api.LedgerEntryChange[],
): Promise<Map<string, unknown>> {
  const ledgerKeys: xdr.LedgerKey[] = [];
  for (const change of stateChanges) {
    if (change.key) ledgerKeys.push(change.key);
  }
  if (ledgerKeys.length === 0) return new Map();

  const response = await server.getLedgerEntries(...ledgerKeys);
  const map = new Map<string, unknown>();
  for (const entry of response.entries) {
    for (const storage of ledgerEntryDataToStorageValues(entry.val)) {
      map.set(storage.key, storage.value);
    }
  }
  return map;
}
