import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/appearance-frames.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`); await page.locator('#sample, #solid-square').first().waitFor();
  return page;
}
const radii = el => { const s = getComputedStyle(el); return [s.borderTopLeftRadius, s.borderTopRightRadius].map(parseFloat); };
for (const [shape, panel, control] of [['square', [0, 0], [4, 4]], ['soft', [8, 8], [4, 4]], ['round', [16, 16], [8, 8]], ['asym', [12, 3], [6, 2]]]) test(`${shape} corners survive independent borders, sizes and nested scopes`, async () => {
  const page = await open(`corners=${shape}`);
  try {
    for (const [size, scale] of [['small', .5], ['medium', 1], ['large', 1.5], ['off', 0]]) {
      await page.evaluate(size => document.documentElement.dataset.cornerSize = size, size);
      for (const border of ['solid', 'none', 'rail', 'dash', 'bevel', 'double', 'base', 'offset']) {
        await page.evaluate(border => document.documentElement.dataset.borderStyle = border, border);
        const expectedPanel = panel.map(n => n * scale);
        const expectedControl = control.map(n => n * (shape === 'square' && scale !== 0 ? 1 : scale));
        for (const selector of ['#sample', '#sample .table-wrap', '#nested .card']) assert.deepEqual(await page.locator(selector).evaluate(radii), expectedPanel, `${selector}: ${border}/${size}`);
        assert.deepEqual(await page.locator('#sample .field-control').evaluate(radii), expectedControl);
        assert.deepEqual(await page.locator('#sample button').evaluate(radii), expectedControl);
      }
    }
    await page.evaluate(() => { document.documentElement.dataset.cornerSize = 'off'; document.querySelector('#nested').dataset.cornerSize = 'medium'; });
    assert.deepEqual(await page.locator('#nested .card').evaluate(radii), panel, 'A nested corner size can restore rounding');
  } finally { await page.close(); }
});

test('Legacy border presets preserve their radii without a corner override', async () => {
  const page = await open('border=square');
  try {
    for (const [border, panel, control] of [['square', [0, 0], [4, 4]], ['soft', [8, 8], [4, 4]], ['round', [16, 16], [8, 8]], ['asym', [12, 3], [6, 2]], ['rail', [6, 6], [3, 3]]]) {
      await page.evaluate(border => document.documentElement.dataset.borderStyle = border, border);
      assert.deepEqual(await page.locator('#sample').evaluate(radii), panel);
      assert.deepEqual(await page.locator('#sample .field-control').evaluate(radii), control);
    }
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Frameless surfaces keep separators, fields and modal focus in ${theme}`, async () => {
  const page = await open(`border=none&corners=round&theme=${theme}`);
  const frameless = async locator => {
    const style = await locator.evaluate(el => { const s = getComputedStyle(el); return [s.borderTopWidth, s.boxShadow, getComputedStyle(el, '::before').content, getComputedStyle(el, '::after').content]; });
    assert.deepEqual(style, ['0px', 'none', 'none', 'none']);
  };
  try {
    for (const selector of ['#sample', '#sample .table-wrap', '#code', '#log', '#palette', '#inset']) await frameless(page.locator(selector));
    assert.equal(await page.locator('#sample .card-footer').evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
    assert.equal(await page.locator('#sample tr:first-child td').first().evaluate(el => getComputedStyle(el).borderBottomWidth), '1px');
    assert.equal(await page.locator('#sample .alert').evaluate(el => getComputedStyle(el).borderInlineStartWidth), '4px');
    const input = page.getByRole('spinbutton', { name: 'RAM' });
    await input.fill('16'); await input.focus();
    assert.equal(await input.evaluate(el => getComputedStyle(el.parentElement).outlineWidth), '2px');
    assert.equal(await input.evaluate(el => getComputedStyle(el.parentElement).borderTopWidth), '1px');
    assert.equal(await page.locator('#nested .card').evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
    assert.equal(await page.locator('#nested .card').evaluate(el => getComputedStyle(el, '::before').content), '""');
    for (const kind of ['dialog', 'drawer']) {
      const trigger = page.getByRole('button', { name: `Open ${kind}`, exact: true });
      await trigger.click();
      const modal = page.getByRole('dialog'); await modal.waitFor(); await frameless(modal);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/frameless-${kind}-${theme}.png` });
      await page.keyboard.press('Escape'); await modal.waitFor({ state: 'hidden' });
      await page.waitForFunction(name => document.activeElement?.textContent === name, `Open ${kind}`);
    }
    assert.equal(await input.inputValue(), '16');
  } finally { await page.close(); }
  if (process.env.SCREENSHOT_DIR) {
    const matrix = await open(`matrix&theme=${theme}`);
    try { await matrix.screenshot({ path: `${process.env.SCREENSHOT_DIR}/borders-and-corners-${theme}.png`, fullPage: true }); }
    finally { await matrix.close(); }
  }
});
