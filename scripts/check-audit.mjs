import { spawnSync } from 'node:child_process';

// Runs npm audit and fails on any advisory except the accepted ones below.
// Usage: node scripts/check-audit.mjs
const accepted = new Map([
  // deepmerge has no patched release. It reaches us only through
  // style-dictionary, which builds the tokens at development time.
  ['https://github.com/advisories/GHSA-gcqx-w48m-w2h4', 'deepmerge via style-dictionary'],
]);

const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8' });
const report = JSON.parse(result.stdout);
if (report.error) throw new Error(`npm audit failed: ${report.error.summary ?? JSON.stringify(report.error)}`);

const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vulnerability.via) {
    if (typeof via === 'object') advisories.set(via.url, via);
  }
}

const open = [...advisories.values()].filter(advisory => !accepted.has(advisory.url));
for (const advisory of advisories.values()) {
  if (accepted.has(advisory.url)) console.log(`accepted: ${advisory.name} ${advisory.url}`);
}
for (const advisory of open) console.error(`${advisory.severity}: ${advisory.name} ${advisory.title} ${advisory.url}`);
if (open.length) process.exit(1);
console.log('npm audit: no open advisories');
