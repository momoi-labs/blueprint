// Runs the gallery tests under the machine's browser lock (see lock.mjs).
// Usage: node scripts/run-gallery-tests.mjs [test file ...]
// KISO_TEST_SHARD and KISO_FULL_SWEEP pass through to the tests.
import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lockBrowser } from './lock.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = process.argv.slice(2);
if (!files.length) files.push(...globSync('apps/kiso-gallery/tests/*.test.mjs', { cwd: root }).sort());

await lockBrowser();
const child = spawn(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('close', code => process.exit(code ?? 1));
