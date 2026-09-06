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
  const css = await readFile(path.join(fixture, 'node_modules/@momoi-labs/kiso/kiso/ui.css'), 'utf8');
  assert.equal(css, await readFile(path.join(root, 'kiso/ui.css'), 'utf8'));
  const iconRule = css.match(/\.icon \{([^}]+)\}/)[1];
  for (const declaration of ['stroke: currentColor', 'fill: none', 'stroke-width: 1.75',
    'stroke-linecap: round', 'stroke-linejoin: round']) {
    assert(iconRule.includes(declaration));
  }
  const brandRule = css.match(/\.brand-mark \{([^}]+)\}/)[1];
  assert(brandRule.includes('font-weight: var(--type-weight-bold)'));
  assert(brandRule.includes('font-size: var(--type-size-label)'));
  await writeFile(path.join(fixture, 'verify.mjs'), `
    import assert from 'node:assert/strict';
    import { createElement as h } from 'react';
    import { renderToStaticMarkup as render } from 'react-dom/server';
    import { Button, FormField, Checkbox, AlertDialog, Table, ThemeSelector, BrandMark, TerminalIcon,
      Alert, AlertTitle, AlertDescription, Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage,
      CommandPalette, Drawer, DropdownMenu, EmptyState, Header, Link, Navigation, NavigationList,
      NavigationItem, NavigationLink, PageHeader, PageHeaderTitle, Pagination, PaginationPage, Popover,
      Search, Select, Sidebar, Skeleton, Spinner, Switch, Tabs, Textarea, Toast, Tooltip,
      ValidationMessage } from '@momoi-labs/kiso-react';
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
    const letter = render(h(BrandMark, { id: 'brand', className: 'custom', 'aria-hidden': false }, 'S'));
    assert.match(letter, /^<span /);
    assert.match(letter, /data-slot="brand-mark"/);
    assert.match(letter, /class="brand-mark custom"/);
    assert.match(letter, /id="brand"/);
    assert.match(letter, /aria-hidden="true">S<[/]span>$/);
    const customIcon = render(h(BrandMark, null,
      h('svg', { className: 'custom-icon', viewBox: '0 0 16 16' }, h('path', { d: 'M1 1L2 2' }))));
    assert.match(customIcon, /aria-hidden="true"><svg /);
    assert.match(customIcon, /class="icon icon-sm custom-icon"/);
    assert.match(customIcon, /viewBox="0 0 16 16"/);
    assert.match(customIcon, /d="M1 1L2 2"/);
    const logo = render(h(BrandMark, null, h(TerminalIcon)));
    assert.match(logo, /aria-hidden="true"><svg /);
    assert.match(logo, /class="[^"]*icon-sm[^"]*"/);
    assert.match(logo, /viewBox="0 0 16 16"/);
    assert.match(logo, /focusable="false"/);
    assert.match(logo, /d="M4 4.5L8 8l-4 3.5"/);
    assert.match(logo, /d="M9.5 11.5H13"/);
    const alert = render(h(Alert, { variant: 'error' }, h(AlertTitle, null, 'Could not deploy')));
    assert.match(alert, /class="alert alert-danger"/);
    assert.match(alert, /role="alert"/);
    assert.match(render(h(Alert, { variant: 'info' })), /role="status"/);
    const crumbs = render(h(Breadcrumb, null, h(BreadcrumbList, null,
      h(BreadcrumbItem, null, h(BreadcrumbPage, null, 'paperless')))));
    assert.match(crumbs, /aria-label="Breadcrumb"/);
    assert.match(crumbs, /<ol[^>]*class="breadcrumb"/);
    assert.match(crumbs, /aria-current="page"/);
    const nav = render(h(Navigation, { 'aria-label': 'Primary' }, h(NavigationList, null,
      h(NavigationItem, null, h(NavigationLink, { href: '/overview', active: true }, 'Overview')))));
    assert.match(nav, /<nav [^>]*aria-label="Primary"/);
    assert.match(nav, /<a [^>]*aria-current="page" class="nav-item" href="\\/overview"/);
    assert.match(render(h(Search, { 'aria-label': 'Find' })), /class="input-group"/);
    assert.match(render(h(Spinner, { label: 'Deploying' })), /role="status"/);
    assert.match(render(h(Spinner)), /aria-hidden="true"/);
    assert.match(render(h(Skeleton, { variant: 'circle' })), /class="skeleton skeleton-circle"/);
    assert.match(render(h(Textarea, { rows: 3 })), /class="textarea"/);
    assert.match(render(h(ValidationMessage, { id: 'e' }, 'Use lowercase letters.')), /class="field-error"/);
    assert.match(render(h(PageHeader, { actions: h(Button, null, 'Deploy') },
      h(PageHeaderTitle, null, 'Applications'))), /class="between"/);
    assert.match(render(h(Pagination, null, h(PaginationPage, { active: true }, '2'))), /aria-label="Pagination"/);
    assert.match(render(h(Header, null, 'chrome')), /class="topbar"/);
    assert.match(render(h(Sidebar, null, 'nav')), /class="sidebar"/);
    assert.match(render(h(EmptyState, { size: 'sm' })), /class="empty empty-sm"/);
    assert.match(render(h(Link, { href: '/x', variant: 'standalone', active: true }, 'x')), /class="nav-item"/);
    for (const part of [CommandPalette, Drawer, DropdownMenu, Popover, Select, Switch, Tabs, Toast, Tooltip]) {
      assert.equal(typeof part, 'function');
    }
    const terminal = render(h(TerminalIcon, { className: 'custom', id: 'terminal' }));
    assert.match(terminal, /class="icon custom"/);
    assert.match(terminal, /id="terminal"/);
    assert.match(terminal, /aria-hidden="true"/);
  `);
  run(process.execPath, ['verify.mjs']);
  await writeFile(path.join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="/main.tsx"></script>');
  await writeFile(path.join(fixture, 'main.tsx'), `
    import { createRoot } from 'react-dom/client';
    import { Button, FormField, BrandMark, TerminalIcon } from '@momoi-labs/kiso-react';
    import '@momoi-labs/kiso-react/styles.css';
    createRoot(document.getElementById('root')!).render(<>
      <Button variant="primary">Save</Button><FormField label="Name" hint="Required" />
      <BrandMark className="custom">S</BrandMark>
      <BrandMark><TerminalIcon /></BrandMark>
      <BrandMark><svg viewBox="0 0 16 16"><path d="M1 1L2 2" /></svg></BrandMark>
    </>);
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
