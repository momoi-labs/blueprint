import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/alert-presentation.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
for (const theme of ['light', 'dark']) for (const width of [320, 390, 1200]) test(`Alert treatments, rich content and contrast at ${width}/${theme}`, async () => {
  const page = await browser.newPage({ viewport: { width, height: 1100 } });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  try {
    await page.goto(`${url}?theme=${theme}`);
    await page.locator('#documentation').waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.getByRole('alert').count(), 2);
    assert.equal(await page.getByRole('status').count(), 6);
    assert.equal(await page.locator('#documentation').getAttribute('role'), 'note');
    const bodySizes = await page.locator('.alert-body').evaluateAll(elements => elements.map(el => getComputedStyle(el).fontSize));
    assert(bodySizes.every(size => size === '14px'));
    for (const rail of await page.locator('.alert-rail').all()) {
      assert.equal(await rail.evaluate(el => getComputedStyle(el).borderInlineStartWidth), '4px');
      assert.equal(await rail.evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
    }
    const results = await page.locator('.alert-title, .alert-body').evaluateAll(elements => elements.map(element => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      const ancestors = []; for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
      for (const node of ancestors) { context.fillStyle = getComputedStyle(node).backgroundColor; context.fillRect(0, 0, 1, 1); }
      const background = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      context.fillStyle = getComputedStyle(element).color; context.fillRect(0, 0, 1, 1);
      const foreground = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
      const luminance = rgb => rgb.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
      const [a, b] = [luminance(foreground), luminance(background)];
      return { text: element.textContent.slice(0, 25), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
    }));
    for (const result of results) assert(result.ratio >= 4.5, `${result.text}: ${result.ratio}`);
    const link = page.getByRole('link', { name: 'Read documentation' });
    await link.focus(); assert(await link.evaluate(el => el === document.activeElement));
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/alert-${width}-${theme}.png`, fullPage: true });
  } finally { await page.close(); }
});
