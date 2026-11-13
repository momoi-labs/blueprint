import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// Changesets versions each crate through its crates/<name>/package.json.
// Copy that version into the crate's Cargo.toml and Cargo.lock, which cargo
// publishes, and into every crate that depends on it, which fails to resolve
// a stale version.
// Usage: node scripts/sync-crate-version.mjs [--check]
const crates = ['kiso-tokens', 'kiso-core', 'tui-kiso'];

const stale = [];
for (const name of crates) {
  const { version } = JSON.parse(readFileSync(`crates/${name}/package.json`, 'utf8'));
  const lock = new RegExp(`(name = "${name}"\\nversion = ")[^"]+(")`);
  const dependency = new RegExp(`^(${name} = \\{ path = "\\.\\./${name}", version = ")[^"]+(")`, 'm');

  // The crate's own files must name it; the other crates only when they use it.
  const files = [
    [`crates/${name}/Cargo.toml`, /^(version = ")[^"]+(")/m, true],
    [`crates/${name}/Cargo.lock`, lock, true]
  ];
  for (const other of crates.filter(other => other !== name)) {
    files.push([`crates/${other}/Cargo.toml`, dependency, false]);
    if (existsSync(`crates/${other}/Cargo.lock`)) files.push([`crates/${other}/Cargo.lock`, lock, false]);
  }

  for (const [file, pattern, required] of files) {
    const text = readFileSync(file, 'utf8');
    if (!pattern.test(text)) {
      if (required) throw new Error(`No ${name} version found in ${file}.`);
      continue;
    }
    const synced = text.replace(pattern, `$1${version}$2`);
    if (synced === text) continue;
    if (process.argv.includes('--check')) stale.push(`${file} (${name} ${version})`);
    else writeFileSync(file, synced);
  }
}

if (stale.length) {
  console.error(`Stale crate versions in ${stale.join(', ')}. Run node scripts/sync-crate-version.mjs.`);
  process.exit(1);
}
