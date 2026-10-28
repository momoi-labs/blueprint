import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const axeSource = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/scope-switcher.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
 const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, ...options });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.getByRole('navigation', { name: 'Scope' }).waitFor();
 return page;
}
const focusName = page => page.evaluate(() => { const el = document.activeElement; return el?.getAttribute('aria-label') || el?.textContent?.trim() || el?.tagName; });
// Radix returns focus after a popup unmounts, a frame or two later, and a
// nested close passes through the level trigger first. Wait for the expected
// element, then report what actually holds focus.
async function focused(page, expected) {
 let name;
 for (let i = 0; i < 40; i++) {
  name = await focusName(page);
  if (expected === undefined || (expected instanceof RegExp ? expected.test(name) : name === expected)) return name;
  await page.waitForTimeout(25);
 }
 return name;
}
const scope = page => page.getByRole('status', { name: 'Scope' }).or(page.locator('output[aria-label="Scope"]')).first().textContent();
async function axe(page, label) {
 if (!await page.evaluate(() => 'axe' in window)) await page.addScriptTag({ content: axeSource });
 const result = await page.evaluate(() => window.axe.run(document, { resultTypes: ['violations'] }));
 assert.deepEqual(result.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`), [], `axe violations (${label})`);
}

test('Segments are named triggers, the current choice is selected, separators are hidden', async () => {
 const page = await open();
 try {
  const nav = page.getByRole('navigation', { name: 'Scope' });
  const triggers = nav.getByRole('button');
  assert.deepEqual(await triggers.evaluateAll(els => els.map(el => el.getAttribute('aria-label'))), ['Organization Acme', 'Project Checkout', 'Server db-prod-01']);
  for (const t of await triggers.all()) {
   assert.equal(await t.getAttribute('aria-haspopup'), 'dialog');
   assert.equal(await t.getAttribute('aria-expanded'), 'false');
  }
  assert.equal(await nav.locator('[aria-hidden="true"]').filter({ hasText: '/' }).count(), 2);
  assert.equal(await page.locator('[aria-current]').count(), 0);
  await axe(page, 'closed');
  await triggers.nth(1).click();
  const dialog = page.getByRole('dialog', { name: 'Switch project' });
  const list = dialog.getByRole('listbox', { name: 'Projects' });
  assert.deepEqual(await list.getByRole('option').allTextContents(), ['All projects', 'Checkout', 'Billing', 'Analytics']);
  assert.equal(await list.getByRole('option', { name: 'Checkout' }).getAttribute('aria-selected'), 'true');
  assert.equal(await list.getByRole('option', { name: 'All projects' }).getAttribute('aria-selected'), 'false');
  assert.equal(await page.locator('[aria-current]').count(), 0);
  const link = dialog.getByRole('link', { name: 'Manage projects' });
  assert.equal(await link.getAttribute('href'), '#projects');
  assert.equal(await list.getByRole('link').count(), 0, 'destinations sit outside the listbox');
  await axe(page, 'project open');
 } finally { await page.close(); }
});

test('Keyboard: Tab order, open keys, active option, typeahead, choose and Escape return focus', async () => {
 const page = await open();
 try {
  await page.getByRole('link', { name: 'pg-yard' }).focus();
  const order = [];
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); order.push(await focused(page)); }
  assert.deepEqual(order, ['Organization Acme', 'Project Checkout', 'Server db-prod-01', 'Account']);
  await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
  assert.equal(await focused(page, 'Project Checkout'), 'Project Checkout');
  await page.keyboard.press('ArrowDown');
  const list = page.getByRole('listbox', { name: 'Projects' });
  assert(await list.evaluate(el => el === document.activeElement), 'listbox takes focus');
  assert.equal(await list.getAttribute('tabindex'), '0');
  const activeLabel = async () => page.evaluate(() => document.getElementById(document.activeElement.getAttribute('aria-activedescendant'))?.textContent);
  assert.equal(await activeLabel(), 'Checkout');
  await page.keyboard.press('ArrowDown'); assert.equal(await activeLabel(), 'Billing');
  await page.keyboard.press('End'); assert.equal(await activeLabel(), 'Analytics');
  await page.keyboard.press('ArrowDown'); assert.equal(await activeLabel(), 'All projects', 'wraps');
  await page.keyboard.press('Home'); assert.equal(await activeLabel(), 'All projects');
  await page.keyboard.press('b'); assert.equal(await activeLabel(), 'Billing', 'typeahead');
  await page.keyboard.press('Escape');
  assert.equal(await focused(page, 'Project Checkout'), 'Project Checkout');
  assert.equal(await scope(page), 'acme/checkout/s0', 'Escape does not choose');
  await page.keyboard.press('Enter');
  await page.keyboard.press('a'); await page.keyboard.press('n');
  assert.equal(await activeLabel(), 'Analytics');
  await page.keyboard.press('Enter');
  assert.equal(await scope(page), 'acme/analytics/all');
  assert.equal(await focused(page, 'Project Analytics'), 'Project Analytics');
  await page.keyboard.press('Space');
  await page.getByRole('listbox', { name: 'Projects' }).waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await focused(page, 'Manage projects'), 'Manage projects');
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('dialog').count(), 0, 'Tab past the last control closes');
  assert.equal(await focused(page, 'Server All servers'), 'Server All servers', 'and moves on from the trigger');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.getByRole('dialog').count(), 0, 'Shift+Tab before the first control closes');
  assert.equal(await focused(page, 'Project Analytics'), 'Project Analytics');
 } finally { await page.close(); }
});

test('Filter is a named combobox with no-matches state, and All hides while filtering', async () => {
 const page = await open();
 try {
  await page.getByRole('button', { name: 'Server db-prod-01' }).click();
  const input = page.getByRole('combobox', { name: 'Filter servers' });
  assert(await input.evaluate(el => el === document.activeElement));
  const list = page.getByRole('listbox', { name: 'Servers' });
  assert.equal(await input.getAttribute('aria-expanded'), 'true');
  assert.equal(await input.getAttribute('aria-autocomplete'), 'list');
  assert.equal(await input.getAttribute('aria-controls'), await list.getAttribute('id'));
  const active = () => input.evaluate(el => document.getElementById(el.getAttribute('aria-activedescendant'))?.textContent ?? null);
  assert.equal(await active(), 'db-prod-01');
  await page.keyboard.press('ArrowDown');
  assert.equal(await active(), 'db-replica-01', 'keyboard follows the rendered group order');
  await page.keyboard.press('ArrowUp');
  assert.equal(await list.getByRole('group', { name: 'Checkout' }).getByRole('option').count(), 2);
  await axe(page, 'server open');
  await input.fill('replica');
  assert.deepEqual(await list.getByRole('option').allTextContents(), ['db-replica-01']);
  assert.equal(await active(), 'db-replica-01');
  await input.fill('zzz');
  assert.equal(await list.getByRole('option').count(), 0);
  assert.equal(await input.getAttribute('aria-activedescendant'), null);
  const status = page.getByRole('dialog').getByRole('status');
  assert.equal(await status.textContent(), 'No servers match "zzz"');
  await page.keyboard.press('Enter');
  assert.equal(await scope(page), 'acme/checkout/s0');
  await axe(page, 'no matches');
  await input.fill('');
  assert.equal(await list.getByRole('option').first().textContent(), 'All servers');
  await input.fill('cache'); await page.keyboard.press('Enter');
  assert.equal(await scope(page), 'acme/checkout/s3');
  assert.equal(await focused(page, 'Server cache-01'), 'Server cache-01');
  await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('combobox').inputValue(), '', 'query clears on close');
 } finally { await page.close(); }
});

test('Loading, error with Retry and empty states keep focus and stay usable', async () => {
 const page = await open('state=error');
 try {
  const trigger = page.getByRole('button', { name: 'Server db-prod-01' });
  assert(await trigger.isEnabled());
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Switch server' });
  assert.equal(await dialog.getByRole('status').textContent(), "Couldn't load servers.");
  assert(await dialog.getByRole('link', { name: 'Open server details' }).isVisible());
  await axe(page, 'error');
  await page.keyboard.press('Tab');
  assert.equal(await focused(page, 'Retry'), 'Retry');
  await page.keyboard.press('Enter');
  assert.equal(await focused(page, 'Filter servers'), 'Filter servers', 'Retry hands focus to the filter');
  assert.equal(await dialog.getByRole('listbox').getAttribute('aria-busy'), 'true');
  assert.equal(await dialog.getByRole('status').textContent(), 'Loading servers');
  await dialog.getByRole('option', { name: 'db-prod-01' }).waitFor();
  assert.equal(await focused(page, 'Filter servers'), 'Filter servers');
 } finally { await page.close(); }
 const unknown = await open('state=loading&unknown');
 try {
  const trigger = unknown.getByRole('button', { name: 'Server, loading' });
  assert(await trigger.isEnabled());
  await axe(unknown, 'loading unknown');
 } finally { await unknown.close(); }
 const empty = await open('empty');
 try {
  await empty.getByRole('button', { name: 'Server No servers in Checkout.' }).click();
  const dialog = empty.getByRole('dialog', { name: 'Switch server' });
  assert.equal(await dialog.getByRole('option').count(), 0, 'no All choice for an empty level');
  assert.equal(await dialog.getByRole('status').textContent(), 'No servers in Checkout.');
  await axe(empty, 'empty');
 } finally { await empty.close(); }
});

test('Long names truncate on the trigger, keep the full accessible name, and wrap in the list', async () => {
 const page = await open('long');
 try {
  const trigger = page.getByRole('button', { name: 'Organization Acme Industrial Holdings International Limited' });
  const name = trigger.locator('.scope-name');
  assert(await name.evaluate(el => el.scrollWidth > el.clientWidth), 'trigger name is truncated');
  await trigger.click();
  const option = page.getByRole('option', { name: 'Acme Industrial Holdings International Limited' });
  assert(await option.evaluate(el => el.scrollWidth <= el.clientWidth), 'option is not truncated');
 } finally { await page.close(); }
});

test('Long lists scroll inside a bounded popup; first, last and destinations stay reachable', async () => {
 const page = await open('servers=60', { viewport: { width: 1280, height: 420 } });
 try {
  await page.getByRole('button', { name: 'Server db-prod-01' }).click();
  const dialog = page.getByRole('dialog');
  const box = await dialog.boundingBox();
  assert(box.y + box.height <= 420, `popup bottom ${box.y + box.height}`);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
  const last = page.getByRole('option').last();
  assert.equal(await last.getAttribute('data-active'), '');
  assert(await last.evaluate(el => { const r = el.getBoundingClientRect(), l = el.closest('[role="listbox"]').getBoundingClientRect(); return r.top >= l.top && r.bottom <= l.bottom + 1; }), 'active option scrolled into view');
  assert(await dialog.getByRole('link', { name: 'Open server details' }).isVisible());
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.getByRole('option').first().getAttribute('data-active'), '');
 } finally { await page.close(); }
});

for (const [width, label] of [[390, 'phone'], [640, '200% zoom']]) test(`Every level is reachable at ${width}px (${label}) in one Header row`, async () => {
 const page = await open('long', { viewport: { width, height: 760 }, hasTouch: width < 500 });
 try {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');
  const compact = page.getByRole('button', { name: /^Scope: / });
  assert.equal(await compact.getAttribute('aria-label'), 'Scope: Acme Industrial Holdings International Limited / Checkout and payments platform for Europe / db-prod-01');
  const header = await page.locator('header').first().boundingBox();
  const account = await page.getByRole('button', { name: 'Account' }).boundingBox();
  const cbox = await compact.boundingBox();
  assert(Math.abs((account.y + account.height / 2) - (cbox.y + cbox.height / 2)) < 4, 'one row');
  assert(cbox.y + cbox.height <= header.y + header.height);
  if (width < 500) assert(cbox.height >= 44 && cbox.width >= 44, 'touch target');
  await page.getByRole('link', { name: 'pg-yard' }).focus();
  const order = [];
  for (let i = 0; i < 2; i++) { await page.keyboard.press('Tab'); order.push(await focused(page)); }
  assert.deepEqual(order, [await compact.getAttribute('aria-label'), 'Account'], 'focus order matches visual order');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  const levels = page.getByRole('dialog', { name: 'Scope' });
  assert.deepEqual(await levels.getByRole('button').evaluateAll(els => els.map(el => el.getAttribute('aria-label').split(' ')[0])), ['Organization', 'Project', 'Server']);
  assert.equal(await focused(page, 'Organization Acme Industrial Holdings International Limited'), 'Organization Acme Industrial Holdings International Limited');
  await axe(page, `compact ${width}`);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.getByRole('listbox', { name: 'Projects' }).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await focused(page, 'Project Checkout and payments platform for Europe'), 'Project Checkout and payments platform for Europe');
  await page.keyboard.press('Escape');
  assert.equal(await focused(page, await compact.getAttribute('aria-label')), await compact.getAttribute('aria-label'));
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.getByRole('listbox', { name: 'Projects' }).waitFor();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.equal(await focused(page, 'Server db-prod-01'), 'Server db-prod-01', 'Tab past a level list moves to the next level');
  await page.keyboard.press('Enter');
  await page.getByRole('combobox', { name: 'Filter servers' }).waitFor();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.equal(await focused(page, 'Account'), 'Account');
  assert.equal(await page.getByRole('dialog').count(), 0, 'Tab past the last level leaves the compact popup');
  await compact.click();
  await levels.getByRole('button', { name: /^Server/ }).click();
  const option = page.getByRole('option', { name: 'db-prod-02' });
  if (width < 500) assert((await option.boundingBox()).height >= 44);
  if (width < 500) assert((await page.getByRole('combobox', { name: 'Filter servers' }).boundingBox()).height >= 44, 'filter touch target');
  await option.click();
  assert.equal(await page.getByRole('dialog').count(), 0, 'choosing closes both popups');
  assert.equal(await scope(page), 'acme/checkout/s1');
  assert.match(await focused(page, /^Scope: .* \/ db-prod-02$/), /^Scope: .* \/ db-prod-02$/);
 } finally { await page.close(); }
});

test('Contrast of trigger, active and selected option, and no motion', async () => {
 for (const theme of ['light', 'dark']) {
  const page = await open(`theme=${theme}`, { reducedMotion: 'reduce' });
  try {
   await page.getByRole('button', { name: 'Project Checkout' }).click();
   await page.keyboard.press('ArrowDown');
   const ratios = await page.evaluate(() => {
    const parse = c => { const p = document.createElement('canvas').getContext('2d'); p.fillStyle = c; p.fillRect(0, 0, 1, 1); const [r, g, b, a] = p.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; };
    const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bg = el => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0.99) return c; if (c[3] > 0) { const below = bg(n.parentElement) ?? [255, 255, 255, 1]; return c.map((v, i) => i < 3 ? v * c[3] + below[i] * (1 - c[3]) : 1); } } return [255, 255, 255, 1]; };
    const ratio = el => { const a = lum(parse(getComputedStyle(el).color)), b = lum(bg(el)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
    const q = s => document.querySelector(s);
    return { trigger: ratio(q('.scope-trigger')), active: ratio(q('.scope-option[data-active]')), selected: ratio(q('.scope-option[aria-selected="true"]')), check: ratio(q('.scope-option[aria-selected="true"] .scope-check')), sep: ratio(q('.scope-sep')),
     animation: getComputedStyle(q('.scope-popover')).animationName };
   });
   for (const key of ['trigger', 'active', 'selected']) assert(ratios[key] >= 4.5, `${theme} ${key} contrast ${ratios[key].toFixed(2)}`);
   assert(ratios.check >= 3, `${theme} check contrast ${ratios.check.toFixed(2)}`);
   assert(ratios.sep >= 3, `${theme} separator contrast ${ratios.sep.toFixed(2)}`);
   assert.equal(ratios.animation, 'none');
   await axe(page, `${theme} open`);
  } finally { await page.close(); }
 }
});

test('Static block opens on the selected option and passes axe', async () => {
 const page = await browser.newPage({ viewport: { width: 1280, height: 420 } });
 try {
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(url.replace('scripts/fixtures/scope-switcher.html', 'kiso/blocks/scope.html') + '?page=logs&project=analytics&server=metrics-14');
  await page.getByRole('navigation', { name: 'Scope' }).getByRole('button', { name: 'Server metrics-14' }).click();
  const selected = page.getByRole('option', { name: 'metrics-14' });
  assert.equal(await selected.getAttribute('aria-selected'), 'true');
  assert(await selected.evaluate(el => { const r = el.getBoundingClientRect(), l = el.closest('[role="listbox"]').getBoundingClientRect(); return r.top >= l.top && r.bottom <= l.bottom + 1; }), 'selected option scrolled into view');
  await axe(page, 'block open');
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
  assert.match(await page.evaluate(() => location.search), /page=logs&.*server=metrics-13/, 'switch keeps the page');
 } finally { await page.close(); }
});

test('Forced colors keep a visible focus on the list and the active option', async () => {
 const page = await open('', { forcedColors: 'active' });
 try {
  await page.getByRole('button', { name: 'Project Checkout' }).focus();
  await page.keyboard.press('Enter');
  const list = page.getByRole('listbox', { name: 'Projects' });
  await list.waitFor();
  assert(await list.evaluate(el => el === document.activeElement));
  const style = el => { const s = getComputedStyle(el); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; };
  const active = await page.locator('.scope-option[data-active]').evaluate(style);
  assert(active.style !== 'none' && active.width >= 2, `active option outline ${JSON.stringify(active)}`);
  const ring = await list.evaluate(style);
  assert(ring.style !== 'none' && ring.width >= 2, `list outline ${JSON.stringify(ring)}`);
 } finally { await page.close(); }
});

test('Forced colors keep the filter focus visible with no matches, loading and error', async () => {
 const outline = el => { const s = getComputedStyle(el.closest('.scope-filter')); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; };
 for (const [query, typed] of [['', 'zzzz'], ['state=loading', ''], ['state=error', '']]) {
  const page = await open(query, { forcedColors: 'active' });
  try {
   await page.getByRole('button', { name: 'Server db-prod-01' }).focus();
   await page.keyboard.press('Enter');
   const input = page.getByRole('combobox', { name: 'Filter servers' });
   await input.waitFor();
   if (typed) await page.keyboard.type(typed);
   assert(await input.evaluate(el => el === document.activeElement));
   assert.equal(await page.locator('.scope-option[data-active]').count(), 0, 'no active option');
   const ring = await input.evaluate(outline);
   assert(ring.style !== 'none' && ring.width >= 2, `${query || typed} filter outline ${JSON.stringify(ring)}`);
  } finally { await page.close(); }
 }
});
