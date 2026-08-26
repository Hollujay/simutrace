import { Command } from 'commander';
import { parseArgsFlag } from './parseArgValue';
import type { CliOptions, CliNetwork } from './types';

function isValidNetwork(value: string): value is CliNetwork {
  return value === 'testnet' || value === 'mainnet';
}

export function parseCliOptions(argv: string[]): CliOptions {
  const program = new Command();

  program
    .name('simutrace')
    .description('Simulate a Soroban contract call and diff the storage it touches');

  let parsed: {
    contract?: string;
    function?: string;
    network?: string;
    args?: string;
    rpcUrl?: string;
    json?: boolean;
  } = {};

  program
    .command('check')
    .description('Simulate a contract function call and show the storage diff')
    .requiredOption('--contract <id>', 'contract address to call')
    .requiredOption('--function <name>', 'function to simulate')
    .requiredOption('--network <network>', 'testnet or mainnet')
    .option('--args <key=value,...>', 'comma-separated function arguments')
    .option('--rpc-url <url>', 'RPC endpoint to use (required for mainnet)')
    .option('--json', 'output machine-readable JSON instead of text', false)
    .action((options) => {
      parsed = options;
    });

  program.exitOverride();
  program.parse(argv, { from: 'user' });

  if (!parsed.network || !isValidNetwork(parsed.network)) {
    throw new Error(`--network must be "testnet" or "mainnet", got "${parsed.network}"`);
  }

  return {
    contract: parsed.contract!,
    function: parsed.function!,
    network: parsed.network,
    args: parseArgsFlag(parsed.args),
    rpcUrl: parsed.rpcUrl,
    json: parsed.json ?? false,
  };
}
