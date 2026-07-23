export type SimuTraceError =
  | { kind: 'contract-not-found'; contractId: string }
  | { kind: 'sac-not-supported'; contractId: string }
  | { kind: 'no-embedded-spec'; contractId: string }
  | { kind: 'malformed-spec'; contractId: string; reason: string }
  | { kind: 'simulation-failed'; reason: string }
  | { kind: 'rpc-unreachable'; url: string; likelyCors: boolean }
  | { kind: 'rpc-error'; code: number; message: string }
  | { kind: 'invalid-argument'; field: string; expected: string };

export interface ParsedFunction {
  name: string;
  inputs: { name: string; type: string }[];
  outputs: { type: string }[];
  docs?: string;
}

export interface DiffEntry {
  key: string;
  before: unknown | null;
  after: unknown | null;
  status: 'added' | 'changed' | 'removed' | 'unchanged';
}
