// Runs scripts/check-*-browser.mjs in parallel and prints a duration summary.
// Usage: node scripts/run-browser-checks.mjs [--shard=i/n] [script ...]
// KISO_BROWSER_CONCURRENCY overrides the default of 4. A check, or a test in it,
// fails by name after 7 minutes, or KISO_TEST_TIMEOUT ms.
import { spawn } from 'node:child_process';
import { glob } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lockBrowser } from './lock.mjs';
import { report, track } from './test-events.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const shard = args.find(arg => arg.startsWith('--shard='))?.slice(8);
const named = args.filter(arg => !arg.startsWith('--'));

let scripts = named;
if (!named.length) {
  scripts = [];
  for await (const file of glob('scripts/check-*-browser.mjs', { cwd: root })) scripts.push(file);
  scripts.sort();
}
if (shard) {
  const [index, total] = shard.split('/').map(Number);
  if (!(index >= 1 && index <= total)) throw new Error(`Invalid --shard=${shard}, expected i/n with 1 <= i <= n`);
  scripts = scripts.filter((_, position) => position % total === index - 1);
}
if (!scripts.length) {
  if (shard) { report('No browser check in this shard', [`--shard=${shard} selected none of the checks`]); process.exit(1); }
  console.log('No browser checks to run.');
  process.exit(0);
}

const limit = Math.max(1, Number(process.env.KISO_BROWSER_CONCURRENCY) || 4);
const timeout = Number(process.env.KISO_TEST_TIMEOUT) || 420000;
const label = file => basename(file).replace(/^check-|-browser\.mjs$/g, '');
const width = Math.max(...scripts.map(file => label(file).length));
const results = [];
const started = Date.now();
const running = new Set();

function prefix(name, stream, out, seen = () => {}) {
  let rest = '';
  const write = line => { seen(line); out.write(`[${name.padEnd(width)}] ${line}\n`); };
  stream.setEncoding('utf8');
  stream.on('data', chunk => {
    const lines = (rest + chunk).split('\n');
    rest = lines.pop();
    lines.forEach(write);
  });
  stream.on('end', () => { if (rest) write(rest); });
}

function signal(child, name) {
  try { process.kill(-child.pid, name); } catch {}
}

function run(file) {
  const name = label(file);
  const begin = Date.now();
  return new Promise(resolve => {
    const progress = track(root);
    const child = spawn(process.execPath, [`--test-timeout=${timeout}`, '--test-force-exit', ...progress.args, file], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    running.add(child);
    prefix(name, child.stdout, process.stdout);
    let thrown;
    prefix(name, child.stderr, process.stderr, line => { if (!thrown && /^\w*Error\b.*: /.test(line)) thrown = line; });
    let stuck;
    const timer = setTimeout(() => {
      progress.read();
      stuck = progress.stuck();
      signal(child, 'SIGTERM');
      setTimeout(() => signal(child, 'SIGKILL'), 10000).unref();
    }, timeout + 30000);
    child.on('error', error => { console.error(`[${name}] ${error.message}`); resolve({ name, code: 1, seconds: 0, failures: [error.message] }); });
    child.on('close', code => {
      clearTimeout(timer);
      running.delete(child);
      progress.close();
      const failures = stuck ? [`timed out after ${Math.round((timeout + 30000) / 1000)}s${stuck.length ? ` in ${stuck.join(', ')}` : ''}`] : progress.failures();
      if (!failures.length && code && thrown) failures.push(thrown);
      resolve({ name, code: stuck ? 1 : code ?? 1, seconds: (Date.now() - begin) / 1000, failures });
    });
  });
}

await lockBrowser();
const queue = [...scripts];
// A signal stops the queue and the running checks; the lock goes on exit.
for (const name of ['SIGINT', 'SIGTERM']) process.on(name, () => {
  queue.length = 0;
  if (!running.size) process.exit(130);
  for (const child of running) signal(child, name);
});
console.log(`Running ${scripts.length} browser checks, ${limit} at a time`);
await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => {
  while (queue.length) results.push(await run(queue.shift()));
}));

console.log('\nBrowser check durations');
for (const { name, code, seconds } of results.sort((a, b) => b.seconds - a.seconds)) {
  console.log(`${code === 0 ? 'ok  ' : 'FAIL'} ${name.padEnd(width)} ${seconds.toFixed(1)}s`);
}
const failed = results.filter(result => result.code !== 0);
console.log(`\n${results.length - failed.length}/${results.length} passed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (failed.length) {
  report('Failed browser checks', failed.flatMap(({ name, code, failures }) => (failures.length ? failures.map(failure => `${name}: ${failure}`) : [`${name}: exit code ${code}`])));
  process.exit(1);
}
