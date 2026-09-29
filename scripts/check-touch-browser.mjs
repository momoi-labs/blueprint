import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const server = await createServer({
  root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/touch-controls.html`;
  browser = await chromium.launch();
  for (const hasTouch of [true, false]) for (const width of [390, 1280]) for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ hasTouch, viewport: { width, height: 800 }, colorScheme });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.goto(url);
    await page.getByRole('checkbox', { name: 'First', exact: true }).waitFor();
    const label = `${hasTouch ? 'touch' : 'desktop'}-${width}-${colorScheme}`;
    assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), hasTouch);
    if (screenshots) {
      for (const id of ['checkboxes', 'switches', 'tabs', 'time-range']) {
        await page.locator(`#${id}`).screenshot({ path: `${screenshots}/${id}-${label}.png` });
      }
      assert.equal(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), hasTouch);
    }

    async function hitTarget(control) {
      await control.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'center' }));
      const box = await control.boundingBox();
      // Probe the effective target, including any invisible extension.
      const points = hasTouch ? [[0, 21], [0, -21], [-21, 0], [21, 0], [-21, -21], [21, 21]] : [[0, 0]];
      for (const [dx, dy] of points) {
        assert(await control.evaluate((element, { dx, dy }) => {
          const rect = element.getBoundingClientRect();
          return element.contains(document.elementFromPoint(rect.x + rect.width / 2 + dx, rect.y + rect.height / 2 + dy));
        }, { dx, dy }), `${await control.getAttribute('id') || await control.textContent()}: target misses (${dx}, ${dy})`);
      }
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2 + (hasTouch ? 21 : 0);
      if (hasTouch) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
    }

    const failures = [];
    for (const role of ['checkbox', 'switch', 'tab', 'range']) {
      try {
        if (role === 'checkbox' || role === 'switch') {
          const names = role === 'checkbox' ? ['First', 'Second', 'Left', 'Right'] : ['Notifications', 'Logging'];
          const controls = names.map(name => page.getByRole(role, { name, exact: true }));
          for (let index = 0; index < controls.length; index++) {
            const box = await controls[index].boundingBox();
            assert.equal(box.width, role === 'checkbox' ? 16 : 32, 'Keep the compact visual width');
            assert.equal(box.height, role === 'checkbox' ? 16 : 18, 'Keep the compact visual height');
            await hitTarget(controls[index]);
            for (let other = 0; other < controls.length; other++) {
              assert.equal(await controls[other].getAttribute('aria-checked'), other <= index ? 'true' : 'false', 'Only the intended control toggles');
            }
          }
          const disabled = page.getByRole(role, { name: role === 'checkbox' ? 'Disabled' : 'Disabled switch', exact: true });
          assert(await disabled.isDisabled());
          await hitTarget(disabled);
          assert.equal(await disabled.getAttribute('aria-checked'), 'false');
          await controls[0].focus();
          await page.keyboard.press('Space');
          assert.equal(await controls[0].getAttribute('aria-checked'), 'false');
          await page.keyboard.press('Tab');
          assert(await controls[1].evaluate(el => el === document.activeElement && el.matches(':focus-visible')));
        } else if (role === 'tab') {
          const logs = page.getByRole('tab', { name: 'Logs', exact: true });
          const box = await logs.boundingBox();
          assert.equal(box.height, hasTouch ? 44 : 40);
          if (hasTouch) assert(box.width >= 44, 'Short tabs also need 44px width');
          await hitTarget(logs);
          assert.equal(await logs.getAttribute('aria-selected'), 'true', 'Tapping Logs activates its panel');
          assert(await page.getByRole('tabpanel', { name: 'Logs' }).isVisible());
          await logs.press('ArrowLeft');
          await page.waitForFunction(() => document.querySelector('#tabs [role="tab"][aria-selected="true"]')?.textContent === 'Configuration');
          assert.equal(await page.getByRole('tab', { name: 'Configuration' }).getAttribute('aria-selected'), 'true', 'ArrowLeft activates Configuration');
          assert(await page.getByRole('tab', { name: 'Disabled tab' }).isDisabled());
        } else {
          const trigger = page.getByRole('button', { name: /^Time range:/ });
          const box = await trigger.boundingBox();
          assert.equal(box.height, hasTouch ? 44 : 36);
          await hitTarget(trigger);
          const preset = page.getByRole('button', { name: /Last 5 minutes/ });
          await preset.waitFor();
          await preset.click();
          assert.match(await trigger.getAttribute('aria-label'), /09:55:00/);
          assert(await page.getByRole('button', { name: /^Disabled range:/ }).isDisabled());
        }
      } catch (error) {
        failures.push(`${role}: ${error.message}`);
      }
    }
    await context.close();
    assert.deepEqual(failures, [], label);
    console.log(`${label}: checkbox, switch, tabs, and time range targets and interactions passed.`);
  }
} finally {
  await browser?.close();
  await server.close();
}
