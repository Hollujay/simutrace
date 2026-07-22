import { rpc, xdr, nativeToScVal, scValToNative } from '@stellar/stellar-sdk';

function ledgerEntryToStorageValue(entry: xdr.LedgerEntry): { key: string; value: unknown } | null {
  const data = entry.data();
  if (data.switch() !== xdr.LedgerEntryType.contractData()) return null;
  const contractData = data.contractData();
  const key = scValToNative(contractData.key());
  const value = scValToNative(contractData.val());
  return { key: JSON.stringify(key), value };
}

function ledgerEntryDataToStorageValue(data: xdr.LedgerEntryData): { key: string; value: unknown } | null {
  if (data.switch() !== xdr.LedgerEntryType.contractData()) return null;
  const contractData = data.contractData();
  const key = scValToNative(contractData.key());
  const value = scValToNative(contractData.val());
  return { key: JSON.stringify(key), value };
}

export function extractBeforeMap(
  stateChanges: rpc.Api.LedgerEntryChange[],
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const change of stateChanges) {
    if (!change.before) continue;
    const storage = ledgerEntryToStorageValue(change.before);
    if (storage) map.set(storage.key, storage.value);
  }
  return map;
}

export function extractAfterMap(
  stateChanges: rpc.Api.LedgerEntryChange[],
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const change of stateChanges) {
    if (!change.after) continue;
    const storage = ledgerEntryToStorageValue(change.after);
    if (storage) map.set(storage.key, storage.value);
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
    const storage = ledgerEntryDataToStorageValue(entry.val);
    if (storage) map.set(storage.key, storage.value);
  }
  return map;
}
