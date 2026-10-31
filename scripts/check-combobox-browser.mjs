import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
const shots = process.env.KISO_SHOTS;
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/combobox.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.getByRole('button', { name: 'Check Setting' }).waitFor();
 return page;
}
const activeText = page => page.evaluate(() => { const id = document.activeElement.getAttribute('aria-activedescendant'); return id ? document.getElementById(id).querySelector('.combobox-option-label').textContent : null; });
const color = (page, token) => page.evaluate(token => { const probe = document.createElement('i'); probe.style.color = `var(${token})`; document.body.append(probe); const value = getComputedStyle(probe).color; probe.remove(); return value; }, token);

test('Keyboard only: focus opens, typing filters, arrows move, Enter picks, Escape keeps the text', async () => {
 const page = await open();
 try {
  await page.keyboard.press('Tab');
  const input = page.getByRole('combobox', { name: 'Setting', exact: true });
  assert(await input.evaluate(el => el === document.activeElement));
  assert.equal(await input.getAttribute('aria-expanded'), 'true');
  assert.equal(await input.getAttribute('aria-autocomplete'), 'list');
  const list = page.getByRole('listbox');
  assert.equal(await input.getAttribute('aria-controls'), await list.getAttribute('id'));
  assert.equal(await list.getByRole('option').count(), 8);
  assert.deepEqual(await list.getByRole('group').evaluateAll(groups => groups.map(g => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby')).textContent)), ['Memory', 'Connections', 'Write-ahead log', 'PgBouncer']);
  await page.keyboard.type('timeout');
  assert.deepEqual(await list.locator('.combobox-option-label').allTextContents(), ['statement_timeout', 'checkpoint_timeout']);
  await page.keyboard.type(' ');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('ArrowDown');
  assert.equal(await activeText(page), 'checkpoint_timeout');
  await page.keyboard.press('Home');
  assert.equal(await activeText(page), 'statement_timeout');
  await page.keyboard.press('End');
  assert.equal(await activeText(page), 'checkpoint_timeout');
  assert.equal(await list.getByRole('option', { selected: true }).count(), 1);
  if (shots) await page.screenshot({ path: `${shots}/combobox-light-filter.png` });
  await page.keyboard.press('Enter');
  assert.equal(await input.inputValue(), 'checkpoint_timeout');
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
  assert.equal(await page.getByRole('status', { name: 'Setting value', exact: true }).textContent(), 'checkpoint_timeout');
  await page.keyboard.press('ArrowDown');
  assert.equal(await list.getByRole('option').count(), 8, 'A picked value reopens on the full list');
  assert.equal(await activeText(page), 'checkpoint_timeout');
  await page.keyboard.press('Escape');
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
  assert.equal(await input.inputValue(), 'checkpoint_timeout');
  await page.keyboard.press('Tab');
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
 } finally { await page.close(); }
});

test('No match and free text: muted line, value cleared, invalid on submit', async () => {
 const page = await open();
 try {
  const input = page.getByRole('combobox', { name: 'Setting', exact: true });
  await input.click(); await input.fill('nope');
  assert.equal(await page.getByRole('listbox').textContent(), 'No setting matches "nope".');
  assert.equal(await input.getAttribute('aria-activedescendant'), null);
  await page.keyboard.press('Escape');
  assert.equal(await input.inputValue(), 'nope');
  await page.getByRole('button', { name: 'Check Setting' }).click();
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  assert.match(await input.evaluate(el => el.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id)?.textContent).join(' | ')), /nope is not a setting of this node\. Pick one from the list\./);
  await page.waitForTimeout(400); // let the border transition finish
  assert.equal(await input.evaluate(el => getComputedStyle(el).borderTopColor), await color(page, '--color-danger'));
  await input.fill('work_mem');
  assert.equal(await page.getByRole('status', { name: 'Setting value', exact: true }).textContent(), 'work_mem', 'Typing an exact label picks it');
 } finally { await page.close(); }
});

test('Mouse picks without taking focus from the input', async () => {
 const page = await open();
 try {
  const input = page.getByRole('combobox', { name: 'Setting', exact: true });
  await input.click();
  await page.getByRole('option', { name: /^max_connections/ }).click();
  assert.equal(await input.inputValue(), 'max_connections');
  assert(await input.evaluate(el => el === document.activeElement));
  await input.click();
  assert.equal(await input.getAttribute('aria-expanded'), 'true', 'Click opens the list again');
 } finally { await page.close(); }
});

test('Loading and disabled states', async () => {
 const page = await open();
 try {
  const remote = page.getByRole('combobox', { name: 'Remote' });
  await remote.click();
  assert.equal(await remote.getAttribute('aria-busy'), 'true');
  assert.equal(await page.getByRole('listbox').getByRole('status').textContent(), 'Loading settings');
  assert.equal(await page.getByRole('option').count(), 0);
  assert.equal(await page.getByRole('combobox', { name: 'Preset' }).inputValue(), 'wal_level', 'A controlled initial value shows its label');
  const disabled = page.getByRole('combobox', { name: 'Disabled' });
  assert(await disabled.isDisabled());
  assert.equal(await disabled.inputValue(), 'work_mem');
 } finally { await page.close(); }
});

test('Inside a Dialog the list is portalled, and Escape closes the list before the dialog', async () => {
 const page = await open();
 try {
  await page.getByRole('button', { name: 'Open dialog' }).click();
  const dialog = page.getByRole('dialog');
  const input = dialog.getByRole('combobox', { name: 'Dialog setting' });
  await input.click();
  const list = page.getByRole('listbox');
  assert.equal(await list.evaluate(el => !!el.closest('[role=dialog]')), false);
  const [box, field] = [await list.boundingBox(), await input.boundingBox()];
  assert(box.y >= field.y + field.height, 'The list sits under the input');
  assert(box.height > 100);
  await page.keyboard.press('Escape');
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
  assert(await dialog.isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await dialog.count(), 0);
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Phone at 390px in ${theme}: list fits the input width, flips above near the bottom`, async () => {
 const page = await open(`theme=${theme}&spacer=200px`, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
 try {
  const input = page.getByRole('combobox', { name: 'Setting', exact: true });
  await input.click(); await page.keyboard.press('ArrowDown');
  const list = page.locator('[data-slot=combobox-content]');
  const [box, field] = [await list.boundingBox(), await input.boundingBox()];
  assert(Math.abs(box.x - field.x) <= 1 && box.x + box.width <= 390, `list ${JSON.stringify(box)} input ${JSON.stringify(field)}`);
  const active = page.getByRole('option', { selected: true });
  assert.equal(await active.evaluate(el => getComputedStyle(el).backgroundColor), await page.evaluate(() => { const p = document.createElement('i'); p.style.backgroundColor = 'var(--color-selected)'; document.body.append(p); const v = getComputedStyle(p).backgroundColor; p.remove(); return v; }));
  assert((await active.boundingBox()).height >= 44, 'Touch target');
  if (shots) await page.screenshot({ path: `${shots}/combobox-${theme}-390-open.png` });
  await page.keyboard.press('Escape');
  const bottom = page.getByRole('combobox', { name: 'Bottom setting' });
  await bottom.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await bottom.click();
  const [up, field2] = [await page.locator('[data-slot=combobox-content]').boundingBox(), await bottom.boundingBox()];
  if (shots) await page.screenshot({ path: `${shots}/combobox-${theme}-390-above.png` });
  assert(up.y + up.height <= field2.y + 1, `Near the bottom the list opens above: list ${JSON.stringify(up)} input ${JSON.stringify(field2)}`);
 } finally { await page.close(); }
});
