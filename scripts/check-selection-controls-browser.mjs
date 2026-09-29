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
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/selection-controls.html`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server.close(); });

for (const width of [320, 390]) for (const colorScheme of ['light', 'dark']) {
  test(`Long Select at ${width}/${colorScheme} scrolls to both ends and preserves keyboard behavior`, async () => {
    const context = await browser.newContext({ hasTouch: true, viewport: { width, height: 844 }, colorScheme });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(url);
      const trigger = page.getByRole('combobox', { name: 'Container', exact: true });
      await trigger.tap();
      const content = page.locator('[data-slot="select-content"]');
      await content.waitFor();
      if (screenshots) await page.screenshot({ path: `${screenshots}/select-${width}-${colorScheme}.png` });
      const box = await content.boundingBox();
      assert(box.y >= 0 && box.y + box.height <= 844, `Popup must fit the viewport: ${JSON.stringify(box)}`);
      const viewport = page.locator('[data-slot="select-viewport"]');
      assert(await viewport.evaluate(element => element.scrollHeight > element.clientHeight), 'Long list needs a real scroll range');
      const session = await context.newCDPSession(page);
      for (const edge of ['last', 'first']) {
        if (edge === 'first') await trigger.tap();
        const bounds = await viewport.boundingBox();
        // Real touch gestures must scroll the list while body scrolling is locked.
        for (let attempt = 0; attempt < 8; attempt++) {
          const reached = await viewport.evaluate((element, edge) => edge === 'first' ? element.scrollTop <= 1 : element.scrollTop + element.clientHeight >= element.scrollHeight - 1, edge);
          if (reached) break;
          const x = bounds.x + bounds.width / 2;
          const start = edge === 'last' ? bounds.y + bounds.height - 30 : bounds.y + 30;
          const end = edge === 'last' ? bounds.y + 30 : bounds.y + bounds.height - 30;
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
          for (let step = 1; step <= 8; step++) {
            await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * step / 8 }] });
            await page.evaluate(() => new Promise(requestAnimationFrame));
          }
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        }
        const option = page.getByRole('option', { name: `Container ${edge === 'first' ? 1 : 22}`, exact: true });
        // Check visibility before Playwright can auto-scroll the tap target.
        assert(await option.evaluate(element => {
          const box = element.getBoundingClientRect();
          return box.top >= 0 && box.bottom <= innerHeight;
        }), `${edge} option must be reachable by touch scrolling`);
        await option.tap();
        await page.waitForFunction(() => document.activeElement?.getAttribute('data-slot') === 'select-trigger');
        assert.equal(await page.getByRole('status', { name: 'Selected container' }).textContent(), edge === 'first' ? '1' : '22');
      }
      await trigger.press('Enter');
      await page.getByRole('option', { name: 'Container 1', exact: true }).press('ArrowDown');
      await page.waitForFunction(() => document.activeElement?.textContent === 'Container 3');
      assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Container 3', 'Keyboard navigation skips disabled Container 2');
      await page.keyboard.press('Enter');
      assert.equal(await page.getByRole('status', { name: 'Selected container' }).textContent(), '3');
      await trigger.press('Enter');
      await page.keyboard.press('End');
      await page.waitForFunction(() => document.activeElement?.textContent === 'Container 22');
      await page.keyboard.press('Home');
      await page.waitForFunction(() => document.activeElement?.textContent === 'Container 1');
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('status', { name: 'Selected container' }).textContent(), '3', 'Navigation and dismissal do not commit');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-slot') === 'select-trigger');
    } finally { await context.close(); }
  });
}

for (const width of [320, 390]) for (const hasTouch of [true, false]) for (const compact of [false, true]) {
  test(`Pagination at ${width}/${hasTouch ? 'touch' : 'desktop'}/${compact ? 'compact' : 'full'} has usable targets`, async () => {
    const page = await browser.newPage({ hasTouch, viewport: { width, height: 844 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(`${url}?pagination${compact ? '&compact' : ''}`);
      const navigation = page.getByRole('navigation', { name: 'Pagination' });
      await navigation.waitFor();
      if (screenshots) await navigation.screenshot({ path: `${screenshots}/pagination-${width}-${hasTouch ? 'touch' : 'desktop'}-${compact ? 'compact' : 'full'}.png` });
      const pages = navigation.locator('[data-slot="pagination-page"]');
      for (const control of await pages.all()) {
        const box = await control.boundingBox();
        assert.equal(box.height, hasTouch ? 44 : 32);
        if (hasTouch) {
          assert(box.width >= 44, `Page targets must be 44px wide, got ${box.width}`);
          for (const [dx, dy] of [[-21, 0], [21, 0], [0, -21], [0, 21]]) {
            assert(await control.evaluate((element, [dx, dy]) => {
              const box = element.getBoundingClientRect();
              return element.contains(document.elementFromPoint(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy));
            }, [dx, dy]), `Page target overlaps or misses (${dx}, ${dy})`);
          }
          await page.touchscreen.tap(box.x + box.width / 2 + 21, box.y + box.height / 2);
        } else {
          assert(box.width < 44, 'Keep desktop pages compact');
          await control.click();
        }
        assert.equal(await control.getAttribute('aria-current'), 'page');
        assert.equal(await page.getByRole('status', { name: 'Current page' }).textContent(), await control.textContent());
      }
      if (hasTouch) assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Pagination must fit a narrow page');
      assert.equal(await navigation.locator('[data-slot="pagination-ellipsis"][tabindex]').count(), 0);
      await pages.first().focus();
      await page.keyboard.press('Tab');
      assert(await pages.nth(1).evaluate(element => element === document.activeElement));
      await page.keyboard.press('Enter');
      assert.equal(await page.getByRole('status', { name: 'Current page' }).textContent(), '2');
    } finally { await page.close(); }
  });
}
