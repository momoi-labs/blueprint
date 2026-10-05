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
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/theme-selector.html`;
  browser = await engines[engine].launch();
  console.log(`${engine} ${browser.version()}`);
});
after(async () => { await browser?.close(); await server.close(); });

for (const variant of ['compact', 'cards']) for (const width of [320, 390, 1280]) for (const colorScheme of ['light', 'dark']) {
  test(`ThemeSelector ${variant} keyboard and controlled state at ${width}/${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme });
    page.setDefaultTimeout(5000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(`${url}?variant=${variant}`);
      const group = page.getByRole('radiogroup', { name: 'Theme', exact: true });
      await group.waitFor();
      const radios = group.getByRole('radio');
      if (variant === 'cards') {
        const previews = await group.locator('.theme-card-scene').evaluateAll(elements => elements.map(element => ({
          scheme: getComputedStyle(element).colorScheme,
          background: getComputedStyle(element).backgroundColor,
        })));
        assert.deepEqual(previews.map(preview => preview.scheme), ['light', 'dark', 'light', 'dark']);
        assert.deepEqual(previews.slice(0, 2), previews.slice(2), 'System shows the same light and dark previews');
        assert.notEqual(previews[0].background, previews[1].background, 'Previews keep distinct colors in either system theme');
      }
      const changes = () => page.getByRole('status', { name: 'Theme changes' }).textContent().then(JSON.parse);
      const assertSelected = async name => {
        assert.equal(await group.getByRole('radio', { checked: true }).count(), 1);
        assert.equal(await group.getByRole('radio', { checked: true }).getAttribute('aria-label'), name);
        assert.equal(await radios.evaluateAll(elements => elements.filter(element => element.tabIndex === 0).length), 1);
        assert.equal(await group.locator('[tabindex="0"]').getAttribute('aria-label'), name);
        // With anchor positioning the track draws the chip; otherwise the selected option does.
        if (variant === 'compact') assert(await group.evaluate(element => {
          const chip = getComputedStyle(element, '::before');
          return (chip.content === 'none' ? getComputedStyle(element.querySelector('[aria-checked="true"]')) : chip).boxShadow !== 'none';
        }), 'The selected option retains its raised chip style');
        else {
          await group.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)));
          assert.notEqual(await group.getByRole('radio', { checked: true }).evaluate(element => getComputedStyle(element).backgroundColor), await group.getByRole('radio', { checked: false }).first().evaluate(element => getComputedStyle(element).backgroundColor), 'The selected card has a distinct surface');
        }
      };
      await assertSelected('Follow system');
      assert.equal(await group.locator('[aria-pressed]').count(), 0);
      await page.getByRole('textbox', { name: 'Before theme' }).focus();
      await page.keyboard.press('Tab');
      assert(await radios.first().evaluate(element => element === document.activeElement));
      for (const [key, name, value] of [
        ['ArrowRight', 'Light theme', 'light'],
        ['ArrowDown', 'Dark theme', 'dark'],
        ['ArrowRight', 'Follow system', 'system'],
        ['ArrowLeft', 'Dark theme', 'dark'],
        ['ArrowUp', 'Light theme', 'light'],
        ['ArrowLeft', 'Follow system', 'system'],
      ]) {
        const previous = await changes();
        await page.keyboard.press(key);
        await assertSelected(name);
        const selected = group.getByRole('radio', { name, exact: true });
        assert(await selected.evaluate(element => element === document.activeElement), `${key} moves focus`);
        assert.deepEqual(await changes(), [...previous, value], `${key} calls onChange once`);
        assert(await selected.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none' && parseFloat(getComputedStyle(element).outlineWidth) >= 2), 'Keyboard focus has a visible ring');
        if (screenshots && ['ArrowRight', 'ArrowDown'].includes(key)) await page.locator('[data-slot="theme-selector"]').screenshot({ path: `${screenshots}/theme-${variant}-${width}-${colorScheme}-${value}-focus.png` });
      }
      await page.keyboard.press('Tab');
      assert(await page.getByRole('textbox', { name: 'After theme' }).evaluate(element => element === document.activeElement), 'Tab leaves the whole group');
      await page.keyboard.press('Shift+Tab');
      assert(await radios.first().evaluate(element => element === document.activeElement), 'Shift+Tab returns to the selected option');
      for (const [action, name, value] of [['click', 'Dark theme', 'dark'], ['Enter', 'Light theme', 'light'], ['Space', 'Follow system', 'system']]) {
        const previous = await changes();
        const radio = group.getByRole('radio', { name, exact: true });
        if (action === 'click') await radio.click();
        else { await radio.focus(); await radio.press(action); }
        await assertSelected(name);
        assert.deepEqual(await changes(), [...previous, value], `${action} calls onChange once`);
      }
      // Re-activating the selected option must not duplicate the callback.
      const previous = await changes();
      await radios.first().press('Space');
      assert.deepEqual(await changes(), [...previous, 'system']);
      await page.getByRole('button', { name: 'Replace with light' }).click();
      await assertSelected('Light theme');
      assert.deepEqual(await changes(), [...previous, 'system'], 'Controlled replacement does not call onChange');
      assert.equal(await page.getByRole('status', { name: 'Form submissions' }).textContent(), '0');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'The row fits the viewport');
      if (variant === 'cards') {
        await page.evaluate(() => Object.assign(document.documentElement.dataset, { borderStyle: 'asym', cornerSize: 'medium' }));
        assert.equal(await radios.first().evaluate(element => getComputedStyle(element).borderRadius), '6px 2px', 'Card controls follow appearance corners');
        assert.equal(await group.locator('.theme-card-preview').first().evaluate(element => getComputedStyle(element).borderRadius), '12px 3px', 'Miniature frames follow appearance corners');
      }
    } finally { await page.close(); }
  });
}

for (const variant of ['compact', 'cards']) for (const colorScheme of ['light', 'dark']) {
  test(`ThemeSelector ${variant} coarse targets at 320/${colorScheme}`, async () => {
    const page = await browser.newPage({ hasTouch: true, viewport: { width: 320, height: 844 }, colorScheme });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(`${url}?variant=${variant}`);
      const group = page.getByRole('radiogroup', { name: 'Theme', exact: true });
      await group.waitFor();
      for (const radio of await group.getByRole('radio').all()) {
        const box = await radio.boundingBox();
        assert(box.width >= 44 && box.height >= 44, `Coarse target is at least 44px: ${JSON.stringify(box)}`);
        for (const [dx, dy] of [[-21, 0], [21, 0], [0, -21], [0, 21]]) {
          assert(await radio.evaluate((element, [dx, dy]) => {
            const box = element.getBoundingClientRect();
            return element.contains(document.elementFromPoint(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy));
          }, [dx, dy]), `Target edge ${dx}/${dy} belongs to this option`);
        }
        await page.touchscreen.tap(box.x + box.width / 2 + 21, box.y + box.height / 2);
        assert.equal(await radio.getAttribute('aria-checked'), 'true');
      }
      assert.deepEqual(JSON.parse(await page.getByRole('status', { name: 'Theme changes' }).textContent()), ['system', 'light', 'dark']);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (screenshots) await page.locator('[data-slot="theme-selector"]').screenshot({ path: `${screenshots}/theme-${variant}-320-${colorScheme}-touch.png` });
    } finally { await page.close(); }
  });
}
