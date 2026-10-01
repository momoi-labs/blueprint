import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/table-presentation.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, ...options });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.getByRole('table', { name: 'comfortable' }).waitFor();
  return page;
}
for (const theme of ['light', 'dark']) test(`Table densities and inline details in ${theme}`, async () => {
  const page = await open(`theme=${theme}`);
  try {
    const measurements = [];
    for (const density of ['compact', 'comfortable', 'spacious']) {
      measurements.push(await page.locator(`#${density} tbody tr`).first().evaluate(el => ({ height: el.getBoundingClientRect().height, font: getComputedStyle(el.firstElementChild).fontSize })));
    }
    assert(measurements[0].height < measurements[1].height && measurements[1].height < measurements[2].height);
    assert.equal(measurements[1].height, 40);
    assert.equal(new Set(measurements.map(m => m.font)).size, 1);
    const toggle = page.locator('#compact').getByRole('button', { name: 'work_mem' });
    await toggle.focus(); await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert(await toggle.evaluate(el => el === document.activeElement));
    const padding = await page.locator('.table-detail > td').evaluateAll(cells => cells.map(el => getComputedStyle(el).padding));
    assert.deepEqual(padding, ['16px', '16px', '16px']);
    await page.keyboard.press('Space');
    assert.equal(await page.getByRole('link', { name: 'Read documentation' }).count(), 0);
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/table-densities-${theme}.png`, fullPage: true });
  } finally { await page.close(); }
});
for (const border of ['square', 'round', 'double', 'offset']) test(`Frameless tables suppress ${border} decorations and retain dividers`, async () => {
  const page = await open(`border=${border}&frameless&plain`);
  try {
    const style = await page.locator('#comfortable').evaluate(el => ({ border: getComputedStyle(el).borderTopWidth, background: getComputedStyle(el).backgroundColor, before: getComputedStyle(el, '::before').content, after: getComputedStyle(el, '::after').content }));
    assert.deepEqual(style, { border: '0px', background: 'rgba(0, 0, 0, 0)', before: 'none', after: 'none' });
    assert.equal(await page.locator('#comfortable tbody tr:first-child td').first().evaluate(el => getComputedStyle(el).borderBottomWidth), '1px');
    const plain = await page.locator('#comfortable th').first().evaluate(el => getComputedStyle(el).backgroundColor);
    await page.locator('#comfortable table').evaluate(el => el.dataset.header = 'tinted');
    assert.notEqual(await page.locator('#comfortable th').first().evaluate(el => getComputedStyle(el).backgroundColor), plain);
    if (process.env.SCREENSHOT_DIR && border === 'square') await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/table-frameless.png`, fullPage: true });
  } finally { await page.close(); }
});
test('Plain headers preserve product-specific selected column colors', async () => {
  const page = await open('plain&selected');
  try {
    const cells = page.locator('#comfortable thead th');
    const colors = await cells.evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
    assert.notEqual(colors[0], colors[1]);
    await cells.nth(1).evaluate(el => el.removeAttribute('data-selected'));
    assert.equal(await cells.nth(1).evaluate(el => getComputedStyle(el).backgroundColor), colors[0]);
  } finally { await page.close(); }
});
for (const width of [320, 390]) test(`Table scroll and controls remain reachable at ${width}px`, async () => {
  const page = await open('frameless', { viewport: { width, height: 850 }, hasTouch: true });
  try {
    await page.locator('table').evaluateAll(tables => tables.forEach(el => el.style.minWidth = '40rem'));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const scroller = page.locator('#compact .table-scroll');
    assert(await scroller.evaluate(el => el.scrollWidth > el.clientWidth));
    const target = await page.locator('#compact button').boundingBox();
    assert(target.height >= 44);
  } finally { await page.close(); }
});
