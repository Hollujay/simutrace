#!/usr/bin/env node
import { parseCliOptions } from './options';

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  // Simulation wiring lands in a follow-up commit; this scaffold only proves
  // out argument parsing end to end.
  console.error(`simutrace check: parsed options for ${options.function} on ${options.contract} (${options.network})`);
  process.exitCode = 1;
}

main();
