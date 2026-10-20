import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, page;
before(async () => {
  await server.listen();
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/chart-range.html`);
  await page.locator('.chart-plot svg').first().waitFor();
});
after(async () => { await browser?.close(); await server.close(); });
const plot = () => page.locator('.chart-plot').first();
const selections = () => page.evaluate(() => window.selections);
async function drag(from, to, beforeUp) {
  const box = await plot().boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * from, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to, y, { steps: 8 });
  await beforeUp?.();
  await page.mouse.up();
}

test('dragging across the plot selects the samples between both ends', async () => {
  await page.evaluate(() => { window.selections = []; });
  await drag(0.6, 0.3, async () => assert.equal(await plot().locator('.chart-range-band:not([hidden])').count(), 1));
  const [range, ...rest] = await selections();
  assert.equal(rest.length, 0);
  assert.ok(range.from < range.to, 'the range is ordered whichever way the drag went');
  assert.equal(range.from % 1000, 0, 'both ends are sample timestamps');
  assert.equal(range.to % 1000, 0);
  assert.equal(await plot().locator('.chart-range-band:not([hidden])').count(), 0);
});

test('Escape cancels a drag, and a click selects nothing', async () => {
  await page.evaluate(() => { window.selections = []; });
  await drag(0.2, 0.7, () => page.keyboard.press('Escape'));
  assert.equal(await plot().locator('.chart-range-band:not([hidden])').count(), 0);
  const box = await plot().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.deepEqual(await selections(), []);
});

test('only a chart with onRangeSelect selects on drag', async () => {
  assert.equal(await plot().getAttribute('data-range-select'), '');
  assert.equal(await page.locator('.chart-plot').nth(1).getAttribute('data-range-select'), null);
});
