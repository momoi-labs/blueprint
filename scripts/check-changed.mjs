// Runs only the browser checks and gallery tests that relate to files changed
// against origin/main. Shared code (ui.css, packages, tokens, gallery sources)
// selects everything. Usage: npm run check:changed
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename } from 'node:path';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const base = git('merge-base', 'origin/main', 'HEAD');
const changed = new Set([
  ...git('diff', '--name-only', base).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean));

const shared = /^(kiso\/ui\.css|kiso\/assets\/|packages\/|tokens\/|package-lock\.json|package\.json|scripts\/run-browser-checks\.mjs|apps\/kiso-gallery\/(src|public|index\.html|package\.json|vite\.config))/;
const everything = [...changed].some(file => shared.test(file));

const checks = new Set();
const tests = new Set();
let allChecks = everything, allTests = everything;
for (const file of changed) {
  const name = basename(file).replace(/\.[^.]+$/, '');
  if (file.startsWith('scripts/fixtures/')) {
    const check = `scripts/check-${name}-browser.mjs`;
    if (existsSync(check)) checks.add(check); else allChecks = true;
  } else if (/^scripts\/check-.*-browser\.mjs$/.test(file) && existsSync(file)) checks.add(file);
  else if (/^apps\/kiso-gallery\/tests\/.*\.test\.mjs$/.test(file) && existsSync(file)) tests.add(file);
}

const run = (command, args, env = {}) => {
  const { status } = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  if (status !== 0) process.exit(status ?? 1);
};

if (!allChecks && !checks.size && !allTests && !tests.size) {
  console.log(`No browser checks relate to the ${changed.size} files changed against origin/main.`);
  process.exit(0);
}
if (allChecks || checks.size) {
  run('npm', ['run', 'build:packages']);
  run(process.execPath, ['scripts/run-browser-checks.mjs', ...(allChecks ? [] : [...checks])]);
}
if (allTests || tests.size) {
  run('npm', ['run', 'build:gallery']);
  run(process.execPath, ['--test', ...(allTests ? ['apps/kiso-gallery/tests/*.test.mjs'] : [...tests])]);
}
