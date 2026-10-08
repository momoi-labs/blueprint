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
    const [urlBox, listenerBox, startBox] = await Promise.all(['url', 'listener', 'start'].map(id => page.locator(`[data-pane-id="${id}"]`).boundingBox()));
    assert.equal(Math.round(startBox.y - listenerBox.y - listenerBox.height), Math.round(listenerBox.x - urlBox.x - urlBox.width));
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
    const start = await page.locator('[data-pane-id="start"]').boundingBox();
    await dragTo(page, page.getByRole('button', { name: 'Move Routes' }), packages.x + 40, (packages.y + start.y + start.height) / 2);
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

test('Rules stay quiet until a drag, and debug labels rows, free columns and bounds', async () => {
  const page = await open();
  try {
    const rule = page.locator('.pane-grid-rule').first();
    assert.equal(await rule.evaluate(el => getComputedStyle(el, '::after').borderTopColor), 'rgba(0, 0, 0, 0)');
    const head = await page.getByRole('button', { name: 'Move Health' }).boundingBox();
    await page.mouse.move(head.x + 20, head.y + 20); await page.mouse.down(); await page.mouse.move(head.x + 60, head.y + 20, { steps: 3 });
    assert.notEqual(await rule.evaluate(el => getComputedStyle(el, '::after').borderTopColor), 'rgba(0, 0, 0, 0)');
    await page.mouse.up();
    assert.equal(await page.locator('.grid-pane-meta').count(), 0);
    await page.goto(`${url}?debug`);
    await page.locator('.grid-pane-meta').first().waitFor();
    assert.equal(await page.locator('.grid-pane-meta').first().textContent(), 'size=6 · min=3 · max=8');
    assert.deepEqual(await page.locator('.pane-grid-rule').evaluateAll(els => els.map(el => el.textContent)), ['row 1 · 10/12', 'row 2 · 12/12', 'row 3 · 12/12', 'row 4 · 6/12']);
    assert.deepEqual(await page.locator('.pane-grid-free').evaluateAll(els => els.map(el => el.textContent)), ['free 2', 'free 6']);
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

test('A finger moves a stacked pane up and down', async () => {
  const page = await open('', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const head = await page.getByRole('button', { name: 'Move Listener' }).boundingBox();
    const url = await page.locator('[data-pane-id="url"]').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', head.x + 20, head.y + 20);
    await touch('touchMove', head.x + 20, head.y - 40);
    await touch('touchMove', url.x + 20, url.y + 30);
    await touch('touchEnd');
    assert.deepEqual((await rows(page))[0], ['listener', 'url']);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

test('Masonry keeps natural heights, fills below shorter panes, and respects row boundaries', async () => {
  const page = await open('masonry&pack');
  try {
    const boxes = async () => Promise.all(['url', 'listener', 'packages', 'start'].map(id => page.locator(`[data-pane-id="${id}"]`).boundingBox()));
    await page.waitForFunction(() => document.querySelector('[data-pane-id="packages"]').getBoundingClientRect().top > document.querySelector('[data-pane-id="listener"]').getBoundingClientRect().top);
    let [tall, short, below, nextRow] = await boxes();
    assert.ok(tall.height > short.height + 200);
    assert.ok(Math.abs(below.x - short.x) < 1);
    assert.ok(below.y >= short.y + short.height);
    assert.ok(below.y < tall.y + tall.height);
    assert.ok(nextRow.y >= Math.max(tall.y + tall.height, below.y + below.height));
    await page.locator('[data-pane-id="listener"] p').evaluate(el => { el.style.height = '240px'; });
    await page.waitForFunction(() => {
      const a = document.querySelector('[data-pane-id="listener"]').getBoundingClientRect();
      const b = document.querySelector('[data-pane-id="packages"]').getBoundingClientRect();
      return b.top >= a.bottom;
    });
    [tall, short, below, nextRow] = await boxes();
    assert.ok(nextRow.y >= Math.max(tall.y + tall.height, below.y + below.height));
    const handle = page.getByRole('separator', { name: 'Resize Public URL' });
    assert.equal(await handle.getAttribute('aria-valuemax'), '12');
    await handle.focus();
    await page.keyboard.press('End');
    assert.equal(await size(page, 'url'), 12);
    await page.waitForFunction(() => document.querySelector('[data-pane-id="listener"]').getBoundingClientRect().top >= document.querySelector('[data-pane-id="url"]').getBoundingClientRect().bottom);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('.pane-grid-body').dataset.columns === '1');
    assert.equal(await page.getByRole('separator').count(), 0);
    assert.equal(await page.evaluate(() => window.paneLayout.sizes.url), 12);
  } finally { await page.close(); }
});

test('Masonry drag targets the short pane under the pointer and retains widths', async () => {
  const page = await open('masonry');
  try {
    const listener = await page.locator('[data-pane-id="listener"]').boundingBox();
    await dragTo(page, page.getByRole('button', { name: 'Move Start command' }), listener.x + listener.width - 10, listener.y + 40);
    assert.deepEqual(await rows(page), [['url', 'listener', 'start', 'packages']]);
    assert.equal(await size(page, 'start'), 12);
    await page.getByRole('button', { name: 'Move Start command' }).focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(await rows(page), [['url', 'listener'], ['start', 'packages']]);
  } finally { await page.close(); }
});

test('Masonry pack preserves DOM order, ignores fill, and scroll uses rows flow', async () => {
  const page = await open('masonry&pack&fill');
  try {
    const handle = page.getByRole('separator', { name: 'Resize Public URL' });
    await handle.focus();
    await page.keyboard.press('Home');
    assert.equal(await size(page, 'url'), 3);
    await page.waitForFunction(() => Number(document.querySelector('[data-pane-id="listener"]').style.getPropertyValue('--masonry-r')) < Number(document.querySelector('[data-pane-id="url"]').style.getPropertyValue('--masonry-r')));
    assert.deepEqual(await page.locator('[data-pane-id]').evaluateAll(nodes => nodes.map(node => node.dataset.paneId)), ['url', 'listener', 'packages', 'start']);
    await page.goto(`${url}?masonry&overflow=scroll`);
    await page.getByRole('separator', { name: 'Resize Public URL' }).waitFor();
    assert.equal(await page.locator('.pane-grid-body').getAttribute('data-flow'), 'rows');
  } finally { await page.close(); }
});
