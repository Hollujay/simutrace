import { describe, it, expect } from 'vitest';
import { diffStorage } from '../src/lib/diff';

describe('diffStorage', () => {
  it('detects added keys', () => {
    const before = new Map<string, unknown>();
    const after = new Map<string, unknown>([['key1', 'value1']]);

    const result = diffStorage(before, after);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: 'key1', before: null, after: 'value1', status: 'added' });
  });

  it('detects removed keys', () => {
    const before = new Map<string, unknown>([['key1', 'value1']]);
    const after = new Map<string, unknown>();

    const result = diffStorage(before, after);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: 'key1', before: 'value1', after: null, status: 'removed' });
  });

  it('detects changed keys', () => {
    const before = new Map<string, unknown>([['key1', 'oldValue']]);
    const after = new Map<string, unknown>([['key1', 'newValue']]);

    const result = diffStorage(before, after);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: 'key1', before: 'oldValue', after: 'newValue', status: 'changed' });
  });

  it('detects unchanged keys', () => {
    const before = new Map<string, unknown>([['key1', 'sameValue']]);
    const after = new Map<string, unknown>([['key1', 'sameValue']]);

    const result = diffStorage(before, after);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: 'key1', before: 'sameValue', after: 'sameValue', status: 'unchanged' });
  });

  it('handles mixed changes simultaneously', () => {
    const before = new Map<string, unknown>([
      ['a', 'old'],
      ['b', 'same'],
      ['c', 'toRemove'],
    ]);
    const after = new Map<string, unknown>([
      ['a', 'new'],
      ['b', 'same'],
      ['d', 'added'],
    ]);

    const result = diffStorage(before, after);
    const statuses = result.map((e) => ({ key: e.key, status: e.status }));

    expect(statuses).toContainEqual({ key: 'a', status: 'changed' });
    expect(statuses).toContainEqual({ key: 'b', status: 'unchanged' });
    expect(statuses).toContainEqual({ key: 'c', status: 'removed' });
    expect(statuses).toContainEqual({ key: 'd', status: 'added' });
  });

  it('returns results sorted by key', () => {
    const before = new Map<string, unknown>([['z', 1]]);
    const after = new Map<string, unknown>([
      ['a', 2],
      ['m', 3],
      ['z', 1],
    ]);

    const result = diffStorage(before, after);
    expect(result.map((e) => e.key)).toEqual(['a', 'm', 'z']);
  });

  it('handles null values correctly', () => {
    const before = new Map<string, unknown>([['key1', null]]);
    const after = new Map<string, unknown>([['key1', 'notNull']]);

    const result = diffStorage(before, after);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('changed');
  });

  it('compares nested objects deeply', () => {
    const before = new Map<string, unknown>([['key', { a: 1, b: 2 }]]);
    const after = new Map<string, unknown>([['key', { a: 1, b: 2 }]]);

    const result = diffStorage(before, after);
    expect(result[0].status).toBe('unchanged');
  });

  it('detects deep object changes', () => {
    const before = new Map<string, unknown>([['key', { a: 1, b: 2 }]]);
    const after = new Map<string, unknown>([['key', { a: 1, b: 3 }]]);

    const result = diffStorage(before, after);
    expect(result[0].status).toBe('changed');
  });

  it('compares arrays deeply', () => {
    const before = new Map<string, unknown>([['key', [1, 2, 3]]]);
    const after = new Map<string, unknown>([['key', [1, 2, 3]]]);

    const result = diffStorage(before, after);
    expect(result[0].status).toBe('unchanged');
  });

  it('detects array changes', () => {
    const before = new Map<string, unknown>([['key', [1, 2, 3]]]);
    const after = new Map<string, unknown>([['key', [1, 2, 4]]]);

    const result = diffStorage(before, after);
    expect(result[0].status).toBe('changed');
  });

  it('compares Maps deeply', () => {
    const inner = new Map<string, number>([['x', 1]]);
    const before = new Map<string, unknown>([['key', inner]]);
    const after = new Map<string, unknown>([['key', new Map([['x', 1]])]]);

    const result = diffStorage(before, after);
    expect(result[0].status).toBe('unchanged');
  });
});
