import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(), 'kiso-consumer-'));
const run = (command, args, cwd = fixture) => execFileSync(command, args, {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'],
});
try {
  const tarballs = [];
  for (const name of ['kiso', 'kiso-react']) {
    const [packed] = JSON.parse(run('npm', ['pack', '--workspace', `@momoi-labs/${name}`,
      '--pack-destination', fixture, '--json'], root));
    assert(!packed.files.some(file => /node_modules|blocks\/|prototype/.test(file.path)));
    const files = new Set(packed.files.map(file => file.path));
    for (const file of name === 'kiso'
      ? ['tokens/build/tokens.css', 'kiso/ui.css', 'kiso/docs/components/button.md']
      : ['dist/index.js', 'dist/index.d.ts', 'dist/styles.css', 'SHADCN-LICENSE']) {
      assert(files.has(file), `${name} is missing ${file}`);
    }
    tarballs.push(path.join(fixture, packed.filename));
  }
  await writeFile(path.join(fixture, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs,
    'react@19.2.8', 'react-dom@19.2.8', '@types/react@19.2.18', '@types/react-dom@19.2.7']);
  const manifest = JSON.parse(await readFile(path.join(fixture, 'node_modules/@momoi-labs/kiso-react/package.json')));
  assert.match(manifest.dependencies['@momoi-labs/kiso'], /^\^\d+\.\d+\.\d+$/);
  assert(!manifest.dependencies.react);
  await writeFile(path.join(fixture, 'verify.mjs'), `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToStaticMarkup as render } from 'react-dom/server';
    import { Button, FormField, Checkbox, AlertDialog, Table, ThemeSelector } from '@momoi-labs/kiso-react';
    const field = render(h(FormField, { id: 'name', label: 'Name', hint: 'Required', 'aria-describedby': 'extra' }));
    assert.match(field, /for="name"/);
    assert.match(field, /aria-describedby="extra name-help"/);
    assert.match(field, /id="name-help"/);
    assert.match(render(h(Button, null, 'Save')), /type="button"/);
    assert(!render(h(Button, {asChild: true}, h('a', {href: '/next'}, 'Next'))).includes('type="button"'));
    assert.match(render(h(Checkbox, {defaultChecked: 'indeterminate', 'aria-label': 'All'})), /data-state="indeterminate"/);
    assert.equal(typeof AlertDialog, 'function');
    assert.equal(typeof Table, 'function');
    assert.equal(typeof ThemeSelector, 'function');
  `);
  run(process.execPath, ['verify.mjs']);
  await writeFile(path.join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>');
  await writeFile(path.join(fixture, 'main.tsx'), `
    import { createRoot } from 'react-dom/client';
    import { Button, FormField } from '@momoi-labs/kiso-react';
    import '@momoi-labs/kiso-react/styles.css';
    createRoot(document.getElementById('root')!).render(<><Button variant="primary">Save</Button><FormField label="Name" hint="Required" /></>);
  `);
  await writeFile(path.join(fixture, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler',
      jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true }, include: ['main.tsx'],
  }));
  run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json']);
  await writeFile(path.join(fixture, 'vite.config.mjs'), 'export default {}');
  run(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build']);
  console.log('Packed packages passed isolated installation, rendering, TypeScript, and CSS bundling checks.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
