import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.BROWSER || 'chromium';
const screenshots = process.env.SCREENSHOT_DIR;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/metric-labels.html`;
  browser = await playwright[engine].launch();
  console.log(`${engine} ${browser.version()}; fallback fonts; CSS zoom for magnification`);
});
after(async () => { await browser?.close(); await server.close(); });

async function checkLabels({ component, width, colorScheme, zoom, long, panel = false }) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  try {
    await page.goto(`${url}?component=${component}${long ? '&long' : ''}${panel ? '&panel' : ''}`);
    await page.locator('.meter-label').first().waitFor();
    await page.evaluate(zoom => { document.documentElement.style.zoom = zoom; }, zoom);
    if (screenshots && width === 320 && zoom === 1 && long && !panel) {
      await page.screenshot({ path: `${screenshots}/${component}-${colorScheme}.png`, fullPage: true });
    }
    const layout = await page.locator('.meter-label').evaluateAll(labels => labels.map(row => {
      const [label, value] = row.children;
      const bounds = row.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const valueBox = value.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(label);
      const labelRects = [...range.getClientRects()];
      range.selectNodeContents(value);
      const valueRects = [...range.getClientRects()];
      return {
        value: value.textContent,
        right: valueBox.right,
        contained: [...labelRects, ...valueRects].every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
          && rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1),
        separated: labelBox.right < valueBox.left,
        wrapped: labelRects.length > 1,
        valueLines: valueRects.length,
      };
    }));
    const expectedValues = component === 'BarGauge' ? ['0', 'Not collected', '-5', '120']
      : ['0 / 100', component === 'Meter' ? 'Not collected' : 'In progress', '-5 / 100', '120 / 100'];
    assert.deepEqual(layout.map(row => row.value), expectedValues, 'Zero, missing, negative, and over-limit values stay visible');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Labels must not widen the document');
    for (const row of layout) {
      assert(row.contained, `All label and value text must fit inside the row: ${JSON.stringify(row)}`);
      assert(row.separated, 'Label and value must not overlap');
      if (zoom === 1) assert.equal(row.valueLines, 1, 'Long labels must leave room for the value');
      assert(Math.abs(row.right - layout[0].right) <= 1, 'Values must align at the end of each row');
      if (long && width <= 390) assert(row.wrapped, 'Long labels must wrap without truncation');
    }
  } finally { await page.close(); }
}

for (const component of ['Meter', 'Progress', 'BarGauge']) {
  for (const width of [320, 390, 1280]) for (const colorScheme of ['light', 'dark']) {
    for (const zoom of [1, 2]) for (const long of [false, true]) {
      test(`${component} ${long ? 'long' : 'short'} labels at ${width}/${colorScheme}/${zoom * 100}%`, () =>
        checkLabels({ component, width, colorScheme, zoom, long }));
    }
  }
  test(`${component} long labels inside a dashboard card at 320px/200%`, () =>
    checkLabels({ component, width: 320, colorScheme: 'light', zoom: 2, long: true, panel: true }));
}
