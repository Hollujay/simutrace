#!/usr/bin/env node
import { parseCliOptions } from './options';
import { runCheck } from './runCheck';
import { formatText } from './formatText';
import { formatJson } from './formatJson';

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const result = await runCheck(options);

  console.log(options.json ? formatJson(result) : formatText(result));

  process.exitCode = result.ok ? 0 : 1;
}

main();
