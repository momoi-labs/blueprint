import { readFileSync, writeFileSync } from 'node:fs';

// Changesets versions kiso-tokens through crates/kiso-tokens/package.json.
// Copy that version into Cargo.toml and Cargo.lock, which cargo publishes,
// and into tui-kiso, which depends on it and fails to resolve a stale version.
// Usage: node scripts/sync-crate-version.mjs [--check]
const dir = 'crates/kiso-tokens';
const { name, version } = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));

const files = [
  [`${dir}/Cargo.toml`, /^(version = ")[^"]+(")/m],
  [`${dir}/Cargo.lock`, new RegExp(`(name = "${name}"\\nversion = ")[^"]+(")`)],
  ['crates/tui-kiso/Cargo.toml', new RegExp(`^(${name} = \\{ path = "\\.\\./${name}", version = ")[^"]+(")`, 'm')],
  ['crates/tui-kiso/Cargo.lock', new RegExp(`(name = "${name}"\\nversion = ")[^"]+(")`)]
];

const stale = [];
for (const [file, pattern] of files) {
  const text = readFileSync(file, 'utf8');
  if (!pattern.test(text)) throw new Error(`No ${name} version found in ${file}.`);
  const synced = text.replace(pattern, `$1${version}$2`);
  if (synced === text) continue;
  if (process.argv.includes('--check')) stale.push(file);
  else writeFileSync(file, synced);
}

if (stale.length) {
  console.error(`${stale.join(' and ')} must have version ${version}. Run node scripts/sync-crate-version.mjs.`);
  process.exit(1);
}
