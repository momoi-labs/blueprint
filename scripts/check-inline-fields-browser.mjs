import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/inline-fields.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, ...options });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`); await page.getByRole('spinbutton', { name: 'RAM', exact: true }).waitFor();
  return page;
}
for (const theme of ['light', 'dark']) for (const [size, height] of [['sm', 32], ['md', 36], ['lg', 40]]) test(`Inline frame sizing and descriptions for ${size}/${theme}`, async () => {
  const page = await open(`theme=${theme}&size=${size}`);
  try {
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    const select = page.getByRole('combobox', { name: 'OS', exact: true });
    for (const control of [ram, select]) {
      assert.equal(await control.evaluate(el => el.parentElement.getBoundingClientRect().height), height);
      assert.equal(await control.evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
    }
    for (const role of ['textbox', 'combobox']) {
      const standalone = page.getByRole(role, { name: role === 'textbox' ? 'Standalone input' : 'Standalone select' });
      assert.equal((await standalone.boundingBox()).height, height);
      assert.equal(await standalone.evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
    }
    await page.locator('label').filter({ hasText: /^RAM$/ }).click();
    assert(await ram.evaluate(el => el === document.activeElement));
    assert.equal(await ram.evaluate(el => getComputedStyle(el.parentElement).outlineWidth), '2px');
    assert.equal(await ram.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    const described = await ram.evaluate(el => el.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent));
    assert.deepEqual(described, ['Total available memory.', 'GB']);
    const native = page.getByRole('textbox', { name: 'Native size', exact: true });
    assert.equal(await native.getAttribute('size'), '6');
    assert.equal(await native.getAttribute('data-control-size'), 'lg');
    const ids = (await native.getAttribute('aria-describedby')).split(' ');
    assert.equal(ids.filter(id => id === 'legacy-hint').length, 1);
    assert.equal(new Set(ids).size, ids.length);
    await page.getByRole('button', { name: 'Toggle error' }).click();
    assert.equal(await ram.getAttribute('aria-invalid'), 'true');
    assert(await ram.evaluate(el => el.getAttribute('aria-describedby').split(' ').some(id => document.getElementById(id).textContent.includes('at least 1 GB'))));
    await page.getByRole('button', { name: 'Toggle disabled' }).click();
    assert(await ram.isDisabled());
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/fields-${size}-${theme}.png`, fullPage: true });
  } finally { await page.close(); }
});
test('Controlled fields retain data and Select closes to its trigger without submitting', async () => {
  const page = await open();
  try {
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    await ram.fill('16');
    assert.equal(await page.getByRole('status', { name: 'Field changes' }).textContent(), '1');
    const os = page.getByRole('combobox', { name: 'OS', exact: true });
    await os.focus(); await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Windows', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'combobox');
    assert(await os.evaluate(el => el === document.activeElement));
    assert.equal(await os.textContent(), 'Windows');
    assert.equal(await page.getByRole('status', { name: 'Field changes' }).textContent(), '2');
    await page.keyboard.press('Enter');
    await page.getByRole('listbox').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'combobox');
    assert(await os.evaluate(el => el === document.activeElement));
    assert.equal(await ram.inputValue(), '16');
    assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '0');
  } finally { await page.close(); }
});
for (const width of [320, 390]) test(`Inline fields wrap without losing touch targets at ${width}px`, async () => {
  const page = await open('size=sm&long', { viewport: { width, height: 900 }, hasTouch: true });
  try {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const control of [page.getByRole('spinbutton', { name: 'RAM', exact: true }), page.getByRole('combobox', { name: 'OS', exact: true })]) {
      const rect = await control.boundingBox(); assert(rect.height >= 44 && rect.width >= 44);
      assert(await control.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    }
    const value = page.getByRole('combobox', { name: 'OS', exact: true }).locator('[data-slot="select-value"]');
    assert(await value.evaluate(el => {
      const trigger = el.parentElement;
      const end = trigger.getBoundingClientRect().right - parseFloat(getComputedStyle(trigger).paddingRight);
      return el.scrollWidth > el.clientWidth && el.getBoundingClientRect().right <= end && getComputedStyle(el).textOverflow === 'ellipsis';
    }), 'Long selected values stay outside the chevron padding');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/fields-${width}.png`, fullPage: true });
  } finally { await page.close(); }
});
