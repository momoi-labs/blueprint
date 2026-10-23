import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/print.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(media, query = '') {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(url + query);
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

test('An ordinary dashboard prints its panes in order without overlap', async () => {
  const page = await open('print', '?case=dashboard');
  try {
    const boxes = await page.locator('.grid-pane').evaluateAll(panes => panes.map(pane => pane.getBoundingClientRect().toJSON()));
    assert.equal(boxes.length, 3);
    for (let i = 1; i < boxes.length; i++) assert(boxes[i].top >= boxes[i - 1].bottom - 0.5, `Pane ${i + 1} starts below pane ${i}`);
    for (const chart of await page.locator('.chart-plot svg').all()) assert((await chart.boundingBox()).height > 0, 'The chart prints');
  } finally { await page.close(); }
});

test('A bounded table prints all its rows above its footer', async () => {
  const page = await open('print', '?case=dashboard');
  try {
    const box = selector => page.locator(selector).evaluate(el => el.getBoundingClientRect().toJSON());
    assert.equal(await page.locator('#bounded tbody tr').count(), 35);
    const [frame, surface, last, footer, next] = await Promise.all(['#bounded', '#bounded .table-surface', '#bounded tbody tr:last-child',
      '#bounded .table-footer', '[data-pane-id="databases"]'].map(box));
    assert(last.bottom <= footer.top + 0.5, 'The last row ends above the footer');
    assert(surface.bottom >= footer.bottom - 0.5, 'The surface holds the footer');
    assert(frame.bottom >= footer.bottom - 0.5, 'The frame holds the footer');
    assert(next.top >= footer.bottom - 0.5, 'The next pane starts below the footer');
    assert.equal(await style(page, '#bounded .table-surface', 'overflow-y'), 'visible');
  } finally { await page.close(); }
});

test('A wide table with long headings and numbers fits an A4 sheet', async () => {
  const page = await open('print', '?case=dashboard');
  try {
    // A4 is 210mm wide; less 10mm margins it lays out at about 718px.
    await page.setViewportSize({ width: 718, height: 900 });
    for (const selector of ['#wide thead th', '#wide .num', '#wide .col-tight'])
      assert.equal(await style(page, selector, 'white-space'), 'normal', selector);
    const [frame, table] = await Promise.all(['#wide', '#wide table'].map(selector => page.locator(selector).evaluate(el => el.getBoundingClientRect().toJSON())));
    assert(table.right <= frame.right + 0.5, `The table is ${Math.round(table.width)}px wide in a ${Math.round(frame.width)}px frame`);
    // A tight column takes its longest word, not one letter per line.
    const lines = await page.locator('#wide tbody .col-tight').evaluate(cell => {
      const range = document.createRange(); range.selectNodeContents(cell);
      return new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size;
    });
    assert.equal(lines, 1);
  } finally { await page.close(); }
});
