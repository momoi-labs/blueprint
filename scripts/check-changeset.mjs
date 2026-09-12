import { execFileSync } from 'node:child_process';

// Fails when a change to published package sources lands without a changeset.
// Usage: node scripts/check-changeset.mjs [base-ref]  (default: origin/main)
const base = process.argv[2] ?? 'origin/main';
const files = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
  .split('\n').filter(Boolean);

const published = files.filter(file => (
  file.startsWith('packages/')
  || file.startsWith('tokens/')
  || (file.startsWith('kiso/') && !file.startsWith('kiso/blocks/'))
));
const changesets = files.filter(file => /^\.changeset\/(?!README\.md$).+\.md$/.test(file));

if (published.length > 0 && changesets.length === 0) {
  console.error('Published package sources changed without a changeset:');
  for (const file of published) console.error(`  ${file}`);
  console.error('\nRun `npm run changeset` and commit the generated file in .changeset/.');
  process.exit(1);
}
console.log(published.length > 0
  ? `Changeset present for ${published.length} published file(s).`
  : 'No published package sources changed.');
