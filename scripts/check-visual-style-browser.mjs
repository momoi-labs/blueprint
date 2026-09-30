import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshots = process.env.SCREENSHOT_DIR;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/visual-style.html`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server.close(); });

async function open(query, width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 1100 } });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.getByRole('heading', { name: 'Your homelab' }).waitFor();
  return page;
}

const measure = locator => locator.evaluate(el => {
  const s = getComputedStyle(el);
  return Object.fromEntries(['fontSize', 'lineHeight', 'fontWeight', 'padding', 'paddingInlineStart', 'rowGap', 'height', 'borderRadius', 'borderStyle', 'color', 'backgroundColor'].map(key => [key, s[key]]));
});

for (const theme of ['light', 'dark']) {
  test(`Editorial shares hierarchy while retaining controls, tables, and local defaults in ${theme}`, async () => {
    const page = await open(`theme=${theme}`);
    try {
      const unchanged = ['#deploy', '#save', '#domain', '#status', '#table-cell', '#compact-region'];
      const baseline = await Promise.all(unchanged.map(selector => measure(page.locator(selector))));
      const compactMetric = await measure(page.locator('#compact-region .stat-value'));
      const compactPadding = await measure(page.locator('#compact-region .card-body'));
      const cardFrame = await measure(page.locator('#application-card'));
      assert.equal((await measure(page.locator('#section-title'))).fontSize, '18px');
      assert.equal((await measure(page.locator('#application-card .card-body'))).paddingInlineStart, '16px');
      if (screenshots) await page.screenshot({ path: `${screenshots}/style-default-${theme}.png`, fullPage: true });
      await page.locator('#domain').fill('new.home.lan');
      await page.evaluate(() => document.documentElement.dataset.visualStyle = 'editorial');
      assert.equal((await measure(page.locator('#section-title'))).fontSize, '22px');
      assert.equal((await measure(page.locator('#application-card [data-slot="card-title"]'))).fontSize, '18px');
      assert.equal((await measure(page.locator('#application-card .card-body'))).paddingInlineStart, '24px');
      assert.equal((await measure(page.locator('.page'))).rowGap, '32px');
      assert.equal((await measure(page.locator('.dashboard-grid'))).rowGap, '24px');
      assert(parseFloat((await measure(page.locator('#metric-card .stat-value'))).fontSize) > 30);
      assert.deepEqual(await Promise.all(unchanged.map(selector => measure(page.locator(selector)))), baseline);
      assert.deepEqual(await measure(page.locator('#compact-region .stat-value')), compactMetric);
      assert.deepEqual(await measure(page.locator('#compact-region .card-body')), compactPadding);
      const editorialFrame = await measure(page.locator('#application-card'));
      for (const property of ['borderRadius', 'borderStyle', 'color', 'backgroundColor']) assert.equal(editorialFrame[property], cardFrame[property]);
      assert.equal(await page.locator('#domain').inputValue(), 'new.home.lan');
      assert(await page.locator('#domain').evaluate(el => el === document.activeElement));
      if (screenshots) await page.screenshot({ path: `${screenshots}/style-editorial-${theme}.png`, fullPage: true });
      await page.evaluate(() => document.documentElement.dataset.visualStyle = 'default');
      assert.equal((await measure(page.locator('#application-card .card-body'))).paddingInlineStart, '16px');
      assert.equal((await measure(page.locator('#metric-card .stat-value'))).fontSize, '30px');
    } finally { await page.close(); }
  });
}

for (const width of [320, 390]) {
  test(`Editorial wraps long values without horizontal overflow at ${width}px`, async () => {
    const page = await open('style=editorial&long', width);
    try {
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const metric = page.locator('#metric-card .stat-value');
      assert(await metric.evaluate(el => el.scrollWidth <= el.clientWidth));
      await page.getByRole('button', { name: 'Save changes' }).focus();
      assert(await page.getByRole('button', { name: 'Save changes' }).evaluate(el => el === document.activeElement));
      if (screenshots) await page.screenshot({ path: `${screenshots}/style-editorial-${width}.png`, fullPage: true });
    } finally { await page.close(); }
  });
}
