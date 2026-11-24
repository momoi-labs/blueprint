// Runs the gallery tests under the machine's browser lock (see lock.mjs).
// Usage: node scripts/run-gallery-tests.mjs [test file ...]
// KISO_TEST_SHARD and KISO_FULL_SWEEP pass through to the tests.
import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockBrowser } from './lock.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = process.argv.slice(2);
if (!files.length) files.push(...globSync('apps/kiso-gallery/tests/*.test.mjs', { cwd: root }).sort());

const isSweep = file => basename(file) === 'generator-browser.test.mjs';
const batches = [files.filter(file => !isSweep(file)), files.filter(isSweep)].filter(batch => batch.length);

await lockBrowser();

let child;
let stopped = false;
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    stopped = true;
    child?.kill(signal);
  });

let status = 0;
for (const batch of batches) {
  if (stopped) break;
  child = spawn(process.execPath, ['--test', ...batch], { cwd: root, stdio: 'inherit' });
  const code = await new Promise(resolve => child.on('close', code => resolve(code ?? 1)));
  status ||= code;
}
process.exit(stopped ? 1 : status);
