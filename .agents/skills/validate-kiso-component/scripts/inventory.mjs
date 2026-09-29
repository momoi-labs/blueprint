import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Run from the repository root after building packages. Inventory is evidence
// of membership, not evidence that an export satisfies its contract.
const root = resolve(process.argv[2] ?? '.');
const read = file => readFile(resolve(root, file), 'utf8');
const directory = 'kiso/docs/components';
const catalogSource = await read(`${directory}/README.md`);
const catalog = [...new Set([...catalogSource.matchAll(/\]\(([^/)]+\.md)\)/g)]
  .map(match => match[1]))].sort();
const contracts = (await readdir(resolve(root, directory)))
  .filter(file => file.endsWith('.md') && file !== 'README.md').sort();
const entry = 'packages/kiso-react/dist/index.js';
const runtime = await import(pathToFileURL(resolve(root, entry)));
const modules = {};
for (const [, file] of (await read(entry)).matchAll(/export \* from "\.\/(.+?)"/g)) {
  const exports = await import(pathToFileURL(resolve(root, 'packages/kiso-react/dist', file)));
  modules[file.replace(/\.js$/, '')] = Object.keys(exports).filter(name => name in runtime).sort();
}
const mapped = new Set(Object.values(modules).flat());
const versions = {};
for (const name of ['kiso', 'kiso-react']) {
  const manifest = JSON.parse(await read(`packages/${name}/package.json`));
  versions[manifest.name] = manifest.version;
}
console.log(JSON.stringify({ versions, catalog, contracts,
  contractsOutsideCatalog: contracts.filter(file => !catalog.includes(file)),
  catalogWithoutContract: catalog.filter(file => !contracts.includes(file)),
  modules, runtimeExports: Object.keys(runtime).sort(),
  unmappedExports: Object.keys(runtime).filter(name => !mapped.has(name)),
}, null, 2));
