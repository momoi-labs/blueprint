import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/print.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(media) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(url);
  await page.locator('.chart-plot svg').first().waitFor();
  await page.emulateMedia({ media });
  return page;
}
const style = (page, selector, property, pseudo = null) =>
  page.locator(selector).first().evaluate((el, [property, pseudo]) => getComputedStyle(el, pseudo).getPropertyValue(property), [property, pseudo]);

test('A static DashboardGrid is one column with nothing to move or resize', async () => {
  const page = await open('screen');
  try {
    assert.equal(await page.locator('.pane-grid-body').getAttribute('data-static'), 'true');
    assert.equal(await page.getByRole('button', { name: /^Move / }).count(), 0);
    assert.equal(await page.getByRole('separator').count(), 0);
    assert.equal(await page.locator('.pane-grid-rule, .grid-pane-grip').count(), 0);
    const [cpu, projects] = await Promise.all(['cpu', 'projects'].map(id => page.locator(`[data-pane-id="${id}"]`).boundingBox()));
    assert.equal(Math.round(cpu.width), Math.round(projects.width));
    assert(projects.y > cpu.y + cpu.height, 'The second pane sits below the first');
    assert.equal(await style(page, '.grid-pane-head', 'cursor'), 'auto');
    // The pane title names the chart, even when the chart is wrapped.
    assert.equal(await style(page, '.framed-chart > figcaption', 'width'), '1px');
  } finally { await page.close(); }
});

test('Print is light, block, unframed and does not scroll', async () => {
  const page = await open('print');
  try {
    assert.equal(await style(page, 'html', 'color-scheme'), 'light');
    assert.equal(await style(page, 'html', 'print-color-adjust'), 'exact');
    for (const selector of ['.page', '.report', '.pane-grid', '.pane-grid-body', '.grid-pane', '.grid-pane-body'])
      assert.equal(await style(page, selector, 'display'), 'block', selector);
    for (const selector of ['.topbar', '[data-slot="page-header-actions"]', '.grid-pane-actions button', '.chart-values'])
      assert.equal(await style(page, selector, 'display'), 'none', selector);
    assert.equal(await style(page, '.app-shell', 'background-image'), 'none');
    assert.equal(await style(page, '.app-shell', 'padding-top'), '0px');
    assert.equal(await style(page, '.app-shell', 'content', '::before'), 'none');
    assert.equal(await style(page, '.grid-pane', 'border-top-width'), '0px');
    assert.equal(await style(page, '.grid-pane-head', 'padding-top'), '0px');
    assert.equal(await style(page, '.grid-pane-body', 'overflow-y'), 'visible');
    assert.equal(await style(page, '.table-scroll', 'overflow-x'), 'visible');
    assert.equal(await style(page, '.table-scroll', 'mask-image'), 'none');
    assert.equal(await style(page, '.chart-table-scroll', 'mask-image'), 'none');
    assert.equal(await style(page, '.table td', 'white-space'), 'normal');
  } finally { await page.close(); }
});

test('A report starts each section on a page and prints closed Disclosures open', async () => {
  const page = await open('print');
  try {
    assert.equal(await style(page, 'html', 'page'), 'report');
    assert.equal(await style(page, '.report > section', 'break-before'), 'page');
    assert.equal(await style(page, '.report > .disclosure', 'break-before'), 'page');
    assert.equal(await style(page, '.report > .disclosure > summary', 'list-style-type'), 'none');
    assert.equal(await style(page, '.report > section > h2', 'border-top-width'), '2px');
    assert.equal(await page.locator('.report > .disclosure').evaluate(el => el.open), false);
    assert(await page.getByText('Counts come from the tracker.').isVisible(), 'Closed content prints');
  } finally { await page.close(); }
});
