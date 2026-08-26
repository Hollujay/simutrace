import type { DiffEntry, SimuTraceError } from '../lib/types';

export type CliNetwork = 'testnet' | 'mainnet';

export interface CliOptions {
  contract: string;
  function: string;
  network: CliNetwork;
  args: Record<string, string>;
  rpcUrl?: string;
  json: boolean;
}

export interface CheckSuccess {
  ok: true;
  contractId: string;
  functionName: string;
  network: CliNetwork;
  rpcUrl: string;
  restoreRequired: boolean;
  returnValue: unknown;
  minResourceFee: string | undefined;
  latestLedger: number;
  diff: DiffEntry[];
}

export type CheckFailure = {
  ok: false;
  contractId: string;
  functionName: string;
  network: CliNetwork;
  error: SimuTraceError;
};

export type CheckResult = CheckSuccess | CheckFailure;
