import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => {
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/chart-sync.html`;
});
after(async () => { await browser?.close(); await server.close(); });
async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 1400 }, ...options });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(url);
  await page.locator('#alone .chart-plot svg').waitFor();
  return page;
}
// What each chart shows: the Recharts readout, marker lines, and pinned readouts.
const state = page => page.evaluate(() => Object.fromEntries(['first', 'second', 'alone'].map(id => {
  const chart = document.getElementById(id);
  return [id, {
    readout: chart.querySelectorAll('.chart-inspection:not(.chart-pin-readout)').length,
    markers: chart.querySelectorAll('.chart-sync-marker line').length,
    pinned: chart.querySelectorAll('.chart-pin-readout').length,
  }];
})));
const point = async (page, id, at) => {
  const box = await page.locator(`#${id} .chart-plot`).boundingBox();
  return { x: box.x + box.width * at, y: box.y + box.height / 2 };
};

test('hover shows the readout in one chart and a marker in the rest of its group', async () => {
  const page = await open();
  const { x, y } = await point(page, 'first', 0.5);
  await page.mouse.move(x, y);
  await page.locator('#second .chart-sync-marker line').waitFor({ state: 'attached' });
  assert.deepEqual(await state(page), {
    first: { readout: 1, markers: 0, pinned: 0 },
    second: { readout: 0, markers: 1, pinned: 0 },
    alone: { readout: 0, markers: 0, pinned: 0 },
  });
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => !document.querySelector('.chart-sync-marker line'));
  await page.context().close();
});

test('a click pins the timestamp across the group, and a second click clears it', async () => {
  const page = await open();
  const { x, y } = await point(page, 'first', 0.5);
  await page.mouse.click(x, y);
  await page.mouse.move(0, 0);
  await page.locator('#second .chart-pin-readout').waitFor();
  assert.deepEqual(await state(page), {
    first: { readout: 0, markers: 1, pinned: 1 },
    second: { readout: 0, markers: 1, pinned: 1 },
    alone: { readout: 0, markers: 0, pinned: 0 },
  });
  assert.equal(await page.locator('#first .chart-pin-readout strong').textContent(),
    await page.locator('#second .chart-pin-readout strong').textContent());
  assert.deepEqual(await page.evaluate(() => window.selections), [], 'a click selects no range');
  await page.mouse.click(x, y);
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => !document.querySelector('.chart-pin-readout'));
  await page.context().close();
});

test('a drag selects a range and pins nothing', async () => {
  const page = await open();
  const from = await point(page, 'first', 0.3), to = await point(page, 'first', 0.6);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
  await page.mouse.move(0, 0);
  assert.equal((await page.evaluate(() => window.selections)).length, 1);
  assert.equal(await page.locator('.chart-pin-readout').count(), 0);
  await page.context().close();
});

test('Enter pins the sample inspected with the keyboard, and Escape clears it', async () => {
  const page = await open();
  await page.locator('#second .recharts-surface').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.locator('#second .chart-inspection').waitFor();
  await page.keyboard.press('Enter');
  await page.locator('#first .chart-pin-readout').waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.chart-pin-readout'));
  await page.context().close();
});

test('a tap pins the timestamp on touch screens', async () => {
  const page = await open({ hasTouch: true });
  const { x, y } = await point(page, 'second', 0.5);
  await page.touchscreen.tap(x, y);
  await page.locator('#first .chart-pin-readout').waitFor();
  await page.context().close();
});
