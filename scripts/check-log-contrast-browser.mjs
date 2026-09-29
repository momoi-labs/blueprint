import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
const screenshots = process.env.SCREENSHOT_DIR;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/log-contrast.html`;
  browser = await engines[engine].launch();
  console.log(`${engine} ${browser.version()}`);
});
after(async () => { await browser?.close(); await server.close(); });
for (const colorScheme of ['light', 'dark']) for (const width of [320, 1280]) {
  test(`Log timestamps and levels at ${width}/${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(url);
      await page.locator('.log-time').first().waitFor();
      const results = await page.locator('.log-time, [data-slot="log-view-level"], [data-case="message"]').evaluateAll(elements => elements.map(element => {
        const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
          .map(channel => channel / 255)
          .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
          .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
        const foreground = getComputedStyle(element).color;
        const background = getComputedStyle(element.closest('.logview')).backgroundColor;
        const first = luminance(foreground);
        const second = luminance(background);
        return { text: element.textContent, composition: element.closest('.logview').getAttribute('aria-label'), foreground, background, ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05) };
      }));
      if (screenshots) await page.screenshot({ path: `${screenshots}/logs-${width}-${colorScheme}.png`, fullPage: true });
      console.log(JSON.stringify({ width, colorScheme, results }));
      for (const result of results) assert(result.ratio >= 4.5, `${result.composition} ${result.text}: ${result.ratio.toFixed(3)}:1`);
    } finally { await page.close(); }
  });
}
