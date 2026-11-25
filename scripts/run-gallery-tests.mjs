// Runs the gallery tests under the machine's browser lock (see lock.mjs).
// Usage: node scripts/run-gallery-tests.mjs [--test-name-pattern=regex ...] [test file ...]
// --test-name-pattern needs at least one test file. Each test times out after
// 7 minutes, or 15 with KISO_FULL_SWEEP=1, or KISO_TEST_TIMEOUT ms. A run with
// no test progress for that long stops and names what still runs. A run where
// no test passed fails. KISO_TEST_SHARD passes through.
// KISO_TEST_CONCURRENCY overrides the default of 4 files at a time.
import { spawn } from 'node:child_process';
import { globSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockBrowser } from './lock.mjs';
import { report, track } from './test-events.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
const patterns = [];
const argv = process.argv.slice(2);
for (let index = 0; index < argv.length; index++) {
  const arg = argv[index];
  if (arg === '--test-name-pattern') patterns.push(argv[++index] ?? '');
  else if (arg.startsWith('--test-name-pattern=')) patterns.push(arg.slice(20));
  else files.push(arg);
}
if (patterns.length && !files.length) {
  console.error('--test-name-pattern needs a test file, for example:\n  node scripts/run-gallery-tests.mjs --test-name-pattern="name" apps/kiso-gallery/tests/search-browser.test.mjs');
  process.exit(2);
}
if (!files.length) files.push(...globSync('apps/kiso-gallery/tests/*.test.mjs', { cwd: root }).sort());

const isSweep = file => basename(file) === 'generator-browser.test.mjs';
const batches = [files.filter(file => !isSweep(file)), files.filter(isSweep)].filter(batch => batch.length);

const timeout = Number(process.env.KISO_TEST_TIMEOUT) || (process.env.KISO_FULL_SWEEP === '1' ? 900000 : 420000);
const concurrency = Math.max(1, Number(process.env.KISO_TEST_CONCURRENCY) || 4);
const nodeArgs = ['--test', `--test-concurrency=${concurrency}`, `--test-timeout=${timeout}`, '--test-force-exit', ...patterns.map(pattern => `--test-name-pattern=${pattern}`)];

await lockBrowser();

let child;
let stopped = false;
const signalGroup = signal => { try { process.kill(-child.pid, signal); } catch {} };
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    stopped = true;
    if (child) signalGroup(signal);
  });

let status = 0;
let passed = 0;
const failures = [];
const stuck = [];
for (const batch of batches) {
  if (stopped) break;
  const progress = track(root);
  child = spawn(process.execPath, [...nodeArgs, ...progress.args, ...batch], { cwd: root, stdio: 'inherit', detached: true });
  const watchdog = setInterval(() => {
    progress.read();
    if (Date.now() - progress.last < timeout + 30000 || stuck.length) return;
    stuck.push(...progress.stuck());
    if (!stuck.length) stuck.push('no test reported progress');
    signalGroup('SIGTERM');
    setTimeout(() => signalGroup('SIGKILL'), 10000).unref();
  }, 5000);
  const code = await new Promise(resolve => child.on('close', code => resolve(code ?? 1)));
  clearInterval(watchdog);
  progress.close();
  passed += progress.passed;
  failures.push(...progress.failures());
  status ||= code;
  if (stuck.length) break;
}
report('Failed gallery tests', failures);
report(`No gallery test progress for ${Math.round((timeout + 30000) / 1000)}s, stopped`, stuck);
if (!stopped && !status && !passed) report('No gallery test ran', ['check the file list, --test-name-pattern and KISO_TEST_SHARD']);
if (!stopped && !passed) status ||= 1;
process.exit(stopped || stuck.length ? 1 : status);
