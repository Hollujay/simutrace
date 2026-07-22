import type { DiffEntry } from './types';

export function diffStorage(
  before: Map<string, unknown>,
  after: Map<string, unknown>,
): DiffEntry[] {
  const allKeys = new Set([...before.keys(), ...after.keys()]);
  const result: DiffEntry[] = [];

  for (const key of allKeys) {
    const hasBefore = before.has(key);
    const hasAfter = after.has(key);
    const beforeVal = hasBefore ? before.get(key) ?? null : null;
    const afterVal = hasAfter ? after.get(key) ?? null : null;

    if (!hasBefore && hasAfter) {
      result.push({ key, before: null, after: afterVal, status: 'added' });
    } else if (hasBefore && !hasAfter) {
      result.push({ key, before: beforeVal, after: null, status: 'removed' });
    } else if (hasBefore && hasAfter) {
      if (deepEqual(beforeVal, afterVal)) {
        result.push({ key, before: beforeVal, after: afterVal, status: 'unchanged' });
      } else {
        result.push({ key, before: beforeVal, after: afterVal, status: 'changed' });
      }
    }
  }

  return result.sort((a, b) => a.key.localeCompare(b.key));
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key)) return false;
      if (!deepEqual(val, b.get(key))) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}
