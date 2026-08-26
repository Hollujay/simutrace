#!/usr/bin/env node
import { CommanderError } from 'commander';
import { parseCliOptions } from './options';
import { runCheck } from './runCheck';
import { formatText } from './formatText';
import { formatJson } from './formatJson';

export const EXIT_SUCCESS = 0;
export const EXIT_FAILURE = 1;

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const result = await runCheck(options);

  console.log(options.json ? formatJson(result) : formatText(result));

  // Success means the simulation ran, regardless of whether the diff is
  // empty or non-empty. Failure means the simulation itself did not
  // genuinely complete, never a stand-in for "no changes detected".
  process.exitCode = result.ok ? EXIT_SUCCESS : EXIT_FAILURE;
}

main().catch((err: unknown) => {
  if (err instanceof CommanderError) {
    // Argument parsing failure (missing/invalid flag, --help). Commander
    // already printed its own usage/error message to stderr.
    process.exitCode = err.exitCode || EXIT_FAILURE;
    return;
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error(`simutrace: ${message}`);
  process.exitCode = EXIT_FAILURE;
});
