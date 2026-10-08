import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/pane-grid.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, ...options });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.getByRole('separator', { name: 'Resize Public URL' }).or(page.getByRole('button', { name: 'Move Public URL' })).first().waitFor();
  return page;
}
const rows = page => page.evaluate(() => window.paneLayout?.rows ?? null);
const size = (page, id) => page.locator(`[data-pane-id="${id}"]`).evaluate(el => parseInt(el.style.getPropertyValue('--s'), 10));
const line = (page, id) => page.locator(`[data-pane-id="${id}"]`).evaluate(el => parseInt(el.style.getPropertyValue('--r'), 10));
async function drag(page, locator, dx, dy = 0) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + Math.min(20, box.width / 2), box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 20 + dx / 2, box.y + box.height / 2 + dy / 2, { steps: 4 });
  await page.mouse.move(box.x + 20 + dx, box.y + box.height / 2 + dy, { steps: 4 });
  await page.mouse.up();
}
async function dragTo(page, locator, x, y) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + 20, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move((box.x + x) / 2, (box.y + y) / 2, { steps: 4 });
  await page.mouse.move(x, y, { steps: 4 });
  await page.mouse.up();
}

test('Rows come from newRow and a pane grows into the free columns only', async () => {
  const page = await open();
  try {
    const separator = page.getByRole('separator', { name: 'Resize Public URL' });
    assert.deepEqual(await separator.evaluate(el => [el.getAttribute('aria-valuemin'), el.getAttribute('aria-valuenow'), el.getAttribute('aria-valuemax')]), ['3', '6', '8']);
    await drag(page, separator, 900);
    assert.equal(await size(page, 'url'), 8);
    await drag(page, separator, -2000);
    assert.equal(await size(page, 'url'), 3);
    await separator.focus();
    await page.keyboard.press('End');
    assert.equal(await size(page, 'url'), 8);
    await page.keyboard.press('ArrowLeft');
    assert.equal(await size(page, 'url'), 7);
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start'], ['packages', 'variables'], ['health', 'routes']]);
    assert.equal(await page.evaluate(() => window.paneLayout.sizes.url), 7);
    assert.equal(await page.getByRole('separator', { name: 'Resize Start command' }).getAttribute('aria-disabled'), null);
    assert.equal(await page.getByRole('separator', { name: 'Resize Listener' }).getAttribute('aria-valuemax'), '5');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/pane-grid.png`, fullPage: true });
  } finally { await page.close(); }
});

test('Moving a pane into a row keeps every size and wraps the row onto a second line', async () => {
  const page = await open();
  try {
    const variables = await page.locator('[data-pane-id="variables"]').boundingBox();
    await dragTo(page, page.getByRole('button', { name: 'Move Health' }), variables.x + variables.width - 10, variables.y + 40);
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start'], ['packages', 'variables', 'health'], ['routes']]);
    assert.deepEqual(await Promise.all(['packages', 'variables', 'health'].map(id => size(page, id))), [6, 6, 3]);
    assert.equal(await line(page, 'health'), await line(page, 'packages') + 1);
    const order = await page.locator('[data-pane-id]').evaluateAll(els => els.map(el => el.dataset.paneId));
    assert.deepEqual(order, ['url', 'listener', 'start', 'packages', 'variables', 'health', 'routes']);
    // The gap above a row starts a new row; a pane at a row's start rejoins the row above on Enter.
    const packages = await page.locator('[data-pane-id="packages"]').boundingBox();
    await dragTo(page, page.getByRole('button', { name: 'Move Routes' }), packages.x + 40, packages.y - 14);
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start'], ['routes'], ['packages', 'variables', 'health']]);
    await page.getByRole('button', { name: 'Move Routes' }).focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start', 'routes'], ['packages', 'variables', 'health']]);
    await page.keyboard.press('ArrowLeft');
    assert.deepEqual(await rows(page), [['url', 'listener'], ['routes', 'start'], ['packages', 'variables', 'health']]);
  } finally { await page.close(); }
});

test('Actions in a pane head click without starting a move', async () => {
  const page = await open();
  try {
    await page.getByRole('button', { name: 'Copy' }).click();
    assert.equal(await page.evaluate(() => window.copied), true);
    assert.equal(await rows(page), null);
  } finally { await page.close(); }
});

test('Scroll overflow keeps a wide row on one line, up to two screens', async () => {
  const page = await open('overflow=scroll');
  try {
    const variables = await page.locator('[data-pane-id="variables"]').boundingBox();
    await dragTo(page, page.getByRole('button', { name: 'Move Health' }), variables.x + variables.width - 10, variables.y + 40);
    await dragTo(page, page.getByRole('button', { name: 'Move Routes' }), variables.x + variables.width - 10, variables.y + 40);
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start'], ['packages', 'variables', 'routes', 'health']]);
    const scroller = page.locator('.pane-grid-scroll');
    assert.equal(await scroller.count(), 1);
    const metrics = await scroller.evaluate(el => ({ wide: el.scrollWidth > el.clientWidth, tall: el.scrollHeight > el.clientHeight }));
    assert.deepEqual(metrics, { wide: true, tall: false });
    assert.equal(await page.getByRole('separator', { name: 'Resize Health' }).getAttribute('aria-valuemax'), '9');
    await page.getByRole('separator', { name: 'Resize Health' }).focus();
    await page.keyboard.press('End');
    assert.equal(await size(page, 'health'), 9);
    await dragTo(page, page.getByRole('button', { name: 'Move Start command' }), variables.x + 40, variables.y + 40);
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start'], ['packages', 'variables', 'routes', 'health']]);
    const column = await page.locator('[data-pane-id="url"], .pane-grid-scroll > [data-pane-id="packages"]').evaluateAll(els => els.map(el => el.getBoundingClientRect().width));
    assert.equal(Math.round(column[0]), Math.round(column[1]));
  } finally { await page.close(); }
});

test('Pack puts the big panes first and fill spends the free columns', async () => {
  const page = await open('pack&fill');
  try {
    assert.deepEqual(await Promise.all(['url', 'listener'].map(id => size(page, id))), [7, 5]);
    assert.equal(await page.getByRole('separator', { name: 'Resize Public URL' }).getAttribute('aria-valuenow'), '6');
  } finally { await page.close(); }
});

for (const [width, columns] of [[900, 6], [390, 1]]) test(`At ${width}px the grid shows ${columns} columns and does not edit`, async () => {
  const page = await open('', { viewport: { width, height: 900 }, hasTouch: true });
  try {
    assert.equal(await page.locator('.pane-grid-body').getAttribute('data-columns'), String(columns));
    assert.equal(await page.getByRole('separator').count(), 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const spans = await page.locator('[data-pane-id]').evaluateAll(els => els.map(el => parseInt(el.style.getPropertyValue('--s'), 10)));
    assert(spans.every(span => span <= columns));
    if (columns === 1) assert(spans.every(span => span === 1));
    else assert.deepEqual(spans.slice(0, 3), [3, 2, 6]);
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/pane-grid-${width}.png`, fullPage: true });
  } finally { await page.close(); }
});
