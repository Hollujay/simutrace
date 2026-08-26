#!/usr/bin/env node
import { parseCliOptions } from './options';
import { runCheck } from './runCheck';

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const result = await runCheck(options);

  // Human-readable and --json formatting land in follow-up commits; this
  // wiring step only proves the CLI drives the same simulation and diff
  // logic the web app uses, end to end.
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}

main();
