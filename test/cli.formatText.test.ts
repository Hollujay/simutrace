import { describe, it, expect } from 'vitest';
import { formatText } from '../src/cli/formatText';
import type { CheckResult } from '../src/cli/types';

describe('human-readable output formatting for a known fixture', () => {
  it('formats a successful simulation with a changed storage entry', () => {
    const result: CheckResult = {
      ok: true,
      contractId: 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5',
      functionName: 'increment',
      network: 'testnet',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      restoreRequired: false,
      returnValue: 5,
      minResourceFee: '100',
      latestLedger: 12345,
      diff: [
        { key: '"counter"', before: 0, after: 5, status: 'changed' },
      ],
    };

    expect(formatText(result)).toBe(
      [
        'Contract: CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5',
        'Function: increment',
        'Network: testnet',
        'Cost: 100',
        'Return value: 5',
        'Ledger: 12345',
        '',
        'Storage diff (1 changed of 1 total):',
        '  [changed] "counter"',
        '    before: 0',
        '    after: 5',
      ].join('\n'),
    );
  });

  it('formats a successful simulation with no touched storage', () => {
    const result: CheckResult = {
      ok: true,
      contractId: 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5',
      functionName: 'read_only',
      network: 'testnet',
      rpcUrl: 'https://soroban-testnet.stellar.org',
      restoreRequired: false,
      returnValue: null,
      minResourceFee: '50',
      latestLedger: 12345,
      diff: [],
    };

    expect(formatText(result)).toBe(
      [
        'Contract: CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5',
        'Function: read_only',
        'Network: testnet',
        'Cost: 50',
        'Ledger: 12345',
        '',
        'No storage entries were touched by this call.',
      ].join('\n'),
    );
  });

  it('formats a genuine failure without any diff-shaped output', () => {
    const result: CheckResult = {
      ok: false,
      contractId: 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5',
      functionName: 'increment',
      network: 'testnet',
      error: { kind: 'contract-not-found', contractId: 'CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5' },
    };

    expect(formatText(result)).toBe(
      'Error: Contract not found: no contract found with ID CCJZ5DGASBWQXR5MPFCJXMBI333XE5U3FSJTNQU7RIKE3P5GN2K2WYD5. Check the address and network.',
    );
  });
});
