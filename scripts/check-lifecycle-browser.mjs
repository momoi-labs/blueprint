import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const server = await createServer({
  root, configFile: false, logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/lifecycle.html`;
  browser = await chromium.launch();
  for (const hasTouch of [true, false]) {
    for (const width of [390, 1280]) {
      for (const colorScheme of ['light', 'dark']) {
        const context = await browser.newContext({ hasTouch, viewport: { width, height: 600 }, colorScheme });
        const page = await context.newPage();
        await page.goto(url);
        const stop = page.getByRole('button', { name: 'Stop', exact: true });
        await stop.waitFor();
        const label = `${hasTouch ? 'touch' : 'desktop'}-${width}-${colorScheme}`;
        assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), hasTouch);
        if (screenshots) await page.screenshot({ path: `${screenshots}/${label}.png` });

        const group = page.getByRole('group', { name: 'Actions', exact: true });
        const groupBox = await group.boundingBox();
        assert(await group.evaluate(element => {
          const style = getComputedStyle(element);
          return style.borderTopWidth === '1px' && style.borderBottomWidth === '1px'
            && style.overflow === 'hidden';
        }), `${label}: joined frame`);
        assert(await group.locator('.btn').evaluateAll(buttons => buttons.every((button, index) => {
          const style = getComputedStyle(button);
          return style.borderRadius === '0px' && style.borderInlineStartWidth === (index ? '1px' : '0px');
        })), `${label}: flat corners and single separators`);
        assert.equal((await page.getByRole('group', { name: 'Status' }).boundingBox()).height, 32);

        for (const name of ['Stop', 'Restart']) {
          const button = page.getByRole('button', { name, exact: true });
          const box = await button.boundingBox();
          assert.equal(box.height, hasTouch ? 44 : 32, `${label}: ${name} height`);
          const offsets = hasTouch ? [1, 28, 35, 42, box.height - 1] : [1, 28];
          for (const offset of offsets) {
            assert(await button.evaluate((element, offset) => {
              const rect = element.getBoundingClientRect();
              return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + offset));
            }, offset), `${label}: ${name} is clipped at offset ${offset}px`);
          }
          if (hasTouch) {
            assert(box.y >= groupBox.y + 1 && box.y + box.height <= groupBox.y + groupBox.height - 1,
              `${label}: ${name} must fit inside the cluster borders`);
            await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height - 1);
          } else {
            await button.click();
          }
        }
        assert.equal(groupBox.height, hasTouch ? 46 : 32, `${label}: cluster height including borders`);
        assert.equal(await page.locator('output').textContent(), 'Stop, Restart');

        const disabled = page.getByRole('button', { name: 'Start', exact: true });
        assert(await disabled.isDisabled());
        const disabledBox = await disabled.boundingBox();
        if (hasTouch) await page.touchscreen.tap(disabledBox.x + disabledBox.width / 2, disabledBox.y + disabledBox.height - 1);
        else await page.mouse.click(disabledBox.x + disabledBox.width / 2, disabledBox.y + 15);
        assert.equal(await page.locator('output').textContent(), 'Stop, Restart');
        assert(await disabled.evaluate(element => {
          const style = getComputedStyle(element);
          return style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.opacity === '0.5';
        }), `${label}: disabled surface`);

        await page.evaluate(() => document.activeElement.blur());
        await page.keyboard.press('Tab');
        assert(await stop.evaluate(element => element === document.activeElement), `${label}: skip disabled action`);
        assert(await stop.evaluate(element => {
          const style = getComputedStyle(element);
          return element.matches(':focus-visible') && style.outlineWidth === '2px' && style.outlineOffset === '-2px';
        }), `${label}: inset keyboard focus ring`);
        if (screenshots) await page.screenshot({ path: `${screenshots}/${label}-focus.png` });
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('output').textContent(), 'Stop, Restart, Stop');
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Restart');
        console.log(`${label}: sizing, hit-testing, activation, disabled state, and keyboard focus passed.`);
        await context.close();
      }
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
