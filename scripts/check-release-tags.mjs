// A green release run must leave a git tag and a GitHub release for every
// published package version. The Changesets action only warns when it cannot
// read the CLI's tag events, which once let releases ship without either.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const run = (command, args) => execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// The registry can lag behind a publish from this run, so a missing version is
// retried for a minute. Any other registry answer fails the check.
async function published(name, version) {
  for (let attempt = 0; attempt < 7; attempt++) {
    if (attempt) await sleep(10_000);
    const response = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}/${version}`);
    if (response.ok) return true;
    if (response.status !== 404) throw new Error(`The npm registry answered ${response.status} for ${name}@${version}.`);
  }
  return false;
}

const missing = [];
for (const dir of readdirSync('packages')) {
  const { name, version, private: isPrivate } = JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8'));
  if (isPrivate || !(await published(name, version))) continue;
  const tag = `${name}@${version}`;
  if (!run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])) missing.push(`git tag ${tag}`);
  try {
    run('gh', ['release', 'view', tag, '--json', 'tagName']);
  } catch (error) {
    missing.push(`GitHub release ${tag}: ${error.stderr.trim().split('\n')[0]}`);
  }
}

if (missing.length) {
  console.error(`Published versions are missing:\n- ${missing.join('\n- ')}`);
  process.exit(1);
}
console.log('Every published version has its git tag and GitHub release.');
