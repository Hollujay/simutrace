#!/usr/bin/env node
import { parseCliOptions } from './options';
import { runCheck } from './runCheck';
import { formatText } from './formatText';

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const result = await runCheck(options);

  if (options.json) {
    // --json schema lands in a follow-up commit; for now this keeps the
    // machine path working with the full result shape.
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatText(result));
  }

  process.exitCode = result.ok ? 0 : 1;
}

main();
