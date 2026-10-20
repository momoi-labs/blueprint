import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/dashboard-expand.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(viewport = { width: 1400, height: 900 }) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(url);
  await page.locator('[data-pane-id="cpu"] .chart-plot svg').waitFor();
  return page;
}
const dialog = page => page.getByRole('dialog');
// Radix restores focus a task after the dialog leaves the DOM.
const focusReturns = (page, label) => page.waitForFunction(name => document.activeElement?.getAttribute('aria-label') === name, label);
const plotHeight = page => page.locator('.dashboard-panel-dialog .chart-plot').evaluate(el => el.offsetHeight);

test('V on a focused pane opens it full viewport; Escape returns focus to the head', async () => {
  const page = await open();
  try {
    await page.getByRole('button', { name: 'Move CPU (%)' }).focus();
    await page.keyboard.press('v');
    await assert.doesNotReject(dialog(page).waitFor());
    assert.equal(await dialog(page).getByRole('heading').textContent(), 'CPU (%)');
    const bounds = await dialog(page).boundingBox();
    assert.ok(bounds.width > 1300 && bounds.height > 800, `dialog fills the viewport: ${JSON.stringify(bounds)}`);
    // The plot takes the room the dialog leaves, well beyond the compact 165px.
    await page.waitForFunction(() => document.querySelector('.dashboard-panel-dialog .chart-plot')?.offsetHeight > 500);
    assert.equal(await page.evaluate(() => document.activeElement?.closest('.chart-plot') !== null), true);
    await page.keyboard.press('Escape');
    await dialog(page).waitFor({ state: 'detached' });
    await focusReturns(page, 'Move CPU (%)');
    assert.equal(await page.evaluate(() => window.dashboardLayout ?? null), null);
  } finally { await page.close(); }
});

test('The Expand button opens the panel and V closes it, returning focus to the button', async () => {
  const page = await open();
  try {
    const expand = page.getByRole('button', { name: 'Expand Memory (%)' });
    assert.equal(await expand.getAttribute('aria-keyshortcuts'), 'v');
    await expand.click();
    await dialog(page).waitFor();
    await page.keyboard.press('v');
    await dialog(page).waitFor({ state: 'detached' });
    await focusReturns(page, 'Expand Memory (%)');
  } finally { await page.close(); }
});

test('V expands the pane under the pointer, and does nothing while typing or on a panel that is not expandable', async () => {
  const page = await open();
  try {
    await page.getByRole('textbox', { name: 'Filter' }).focus();
    await page.keyboard.press('v');
    assert.equal(await dialog(page).count(), 0);
    assert.equal(await page.getByRole('textbox', { name: 'Filter' }).inputValue(), 'v');
    await page.getByRole('textbox', { name: 'Filter' }).blur();
    await page.locator('[data-pane-id="connections"]').hover();
    await page.keyboard.press('v');
    assert.equal(await dialog(page).count(), 0);
    await page.locator('[data-pane-id="memory"] .chart-plot').hover();
    await page.keyboard.press('v');
    await dialog(page).waitFor();
    assert.equal(await dialog(page).getByRole('heading').textContent(), 'Memory (%)');
    await page.keyboard.press('Escape');
    await dialog(page).waitFor({ state: 'detached' });
    await focusReturns(page, 'Move Memory (%)');
  } finally { await page.close(); }
});

test('On a phone the dialog is edge to edge and the plot still grows', async () => {
  const page = await open({ width: 390, height: 844 });
  try {
    await page.getByRole('button', { name: 'Expand CPU (%)' }).click();
    await dialog(page).waitFor();
    assert.deepEqual(Object.values(await dialog(page).boundingBox()).map(Math.round), [0, 0, 390, 844]);
    await page.waitForFunction(() => document.querySelector('.dashboard-panel-dialog .chart-plot')?.offsetHeight > 400);
    assert.ok(await plotHeight(page) > 400);
  } finally { await page.close(); }
});
