// Runs scripts/check-*-browser.mjs in parallel and prints a duration summary.
// Usage: node scripts/run-browser-checks.mjs [--shard=i/n] [script ...]
// KISO_BROWSER_CONCURRENCY overrides the default of min(8, os.availableParallelism()).
import { spawn } from 'node:child_process';
import { glob } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

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
if (!scripts.length) { console.log('No browser checks to run.'); process.exit(0); }

// Capped at 8: more Chromium instances than that starve each other and trip timeouts.
const limit = Math.max(1, Number(process.env.KISO_BROWSER_CONCURRENCY) || Math.min(8, availableParallelism()));
const label = file => basename(file).replace(/^check-|-browser\.mjs$/g, '');
const width = Math.max(...scripts.map(file => label(file).length));
const results = [];
const started = Date.now();

function prefix(name, stream, out) {
  let rest = '';
  stream.setEncoding('utf8');
  stream.on('data', chunk => {
    const lines = (rest + chunk).split('\n');
    rest = lines.pop();
    for (const line of lines) out.write(`[${name.padEnd(width)}] ${line}\n`);
  });
  stream.on('end', () => { if (rest) out.write(`[${name.padEnd(width)}] ${rest}\n`); });
}

function run(file) {
  const name = label(file);
  const begin = Date.now();
  return new Promise(resolve => {
    const child = spawn(process.execPath, [file], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    prefix(name, child.stdout, process.stdout);
    prefix(name, child.stderr, process.stderr);
    child.on('error', error => { console.error(`[${name}] ${error.message}`); resolve({ name, code: 1, seconds: 0 }); });
    child.on('close', code => resolve({ name, code: code ?? 1, seconds: (Date.now() - begin) / 1000 }));
  });
}

const queue = [...scripts];
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
  console.error(`Failed: ${failed.map(result => result.name).join(', ')}`);
  process.exit(1);
}
