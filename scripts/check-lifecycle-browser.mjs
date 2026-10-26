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
    for (const width of [768, 1280]) {
      for (const colorScheme of ['light', 'dark']) {
        const context = await browser.newContext({ hasTouch, viewport: { width, height: 600 }, colorScheme });
        const page = await context.newPage();
        await page.goto(url);
        const stop = page.getByRole('button', { name: 'Stop', exact: true });
        await stop.waitFor();
        // A late web font moves the buttons after they are measured.
        await page.evaluate(() => document.fonts.ready);
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

  // A phone keeps the status and moves every action into a sheet.
  for (const hasTouch of [true, false]) {
    const context = await browser.newContext({ hasTouch, viewport: { width: 390, height: 700 } });
    const page = await context.newPage();
    await page.goto(url);
    const label = `${hasTouch ? 'touch' : 'desktop'}-390`;
    const more = page.getByRole('button', { name: 'More actions' });
    await more.waitFor();
    assert.equal(await page.getByRole('button', { name: 'Stop', exact: true }).isVisible(), false, `${label}: actions leave the row`);
    assert(await page.getByRole('group', { name: 'Status' }).isVisible(), `${label}: status stays`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: no sideways scroll`);
    const activate = locator => hasTouch ? locator.tap() : locator.click();
    await activate(more);
    const sheet = page.getByRole('dialog', { name: 'Actions' });
    await sheet.waitFor();
    if (screenshots) await page.screenshot({ path: `${screenshots}/${label}-sheet.png` });
    assert(await sheet.getByRole('button', { name: 'Start', exact: true }).isDisabled());
    assert(await sheet.getByRole('button', { name: 'Remove', exact: true }).isVisible(), `${label}: destructive action in the sheet`);
    const stop = sheet.getByRole('button', { name: 'Stop', exact: true });
    const sheetBox = await sheet.boundingBox();
    assert((await stop.boundingBox()).width > sheetBox.width / 2, `${label}: full-width action`);
    await activate(stop);
    await sheet.waitFor({ state: 'detached' });
    assert.equal(await page.locator('output').textContent(), 'Stop', `${label}: the action runs and the sheet closes`);
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'More actions', null, { timeout: 2000 })
      .catch(() => assert.fail(`${label}: focus returns to the trigger`));

    // An action that owns its confirmation keeps it: the dialog opens over the sheet.
    await page.goto(`${url}?confirm`);
    await activate(more);
    await activate(sheet.getByRole('button', { name: 'Remove', exact: true }));
    const confirm = page.getByRole('alertdialog', { name: 'Remove it?' });
    await confirm.waitFor();
    await page.waitForTimeout(100);
    assert(await confirm.isVisible(), `${label}: the confirmation survives the sheet`);
    if (hasTouch) await page.touchscreen.tap(4, 4); else await page.mouse.click(4, 4);
    assert(await confirm.isVisible(), `${label}: a backdrop tap keeps the confirmation open`);
    assert(await confirm.evaluate(element => element.contains(document.activeElement)), `${label}: a backdrop tap keeps focus in the confirmation`);
    await activate(confirm.getByRole('button', { name: 'Confirm remove' }));
    await confirm.waitFor({ state: 'detached' });
    assert.equal(await page.locator('output').textContent(), 'Removed', `${label}: the confirmation runs`);
    console.log(`${label}: actions sheet passed.`);
    await context.close();
  }

  // On a phone the status badges wrap as separate shapes, so the cluster keeps
  // no clip or contour of its own and each badge shows all four borders.
  const appearances = [
    { cornerStyle: 'pixel', borderStyle: 'solid' },
    { cornerStyle: 'pixel', borderStyle: 'double' },
    { cornerStyle: 'pixel', borderStyle: 'bevel' },
    { cornerStyle: 'rounded', borderStyle: 'solid' },
    { cornerStyle: 'square', borderStyle: 'manga' },
    { cornerStyle: 'square', borderStyle: 'brush' },
  ];
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 700 }, colorScheme });
    const page = await context.newPage();
    await page.goto(url);
    await page.getByRole('group', { name: 'Status' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const { cornerStyle, borderStyle } of appearances) {
      const label = `${colorScheme}-390-${cornerStyle}-${borderStyle}`;
      await page.evaluate(({ cornerStyle, borderStyle }) => {
        Object.assign(document.documentElement.dataset, {
          cornerStyle, cornerSize: 'small', borderStyle, panelFill: 'translucent', frameScope: 'all',
        });
      }, { cornerStyle, borderStyle });
      const cluster = page.getByRole('group', { name: 'Status' });
      assert.deepEqual(await cluster.evaluate(element => {
        const style = getComputedStyle(element);
        return [style.clipPath, getComputedStyle(element, '::after').content, style.borderTopWidth];
      }), ['none', 'none', '0px'], `${label}: the cluster carries no clip, contour, or frame`);
      const badges = cluster.locator('.badge');
      assert.equal(await badges.count(), 2);
      assert(await badges.evaluateAll(items => items.every(item => {
        const style = getComputedStyle(item);
        const rect = item.getBoundingClientRect();
        return ['Top', 'Right', 'Bottom', 'Left'].every(side => parseFloat(style[`border${side}Width`]) >= 1)
          && item === document.elementFromPoint(rect.right - 2, rect.top + rect.height / 2);
      })), `${label}: every badge shows all four borders`);
      // A neutral badge shows the standard border, in the wrapped cluster and alone.
      const borders = element => {
        const style = getComputedStyle(element);
        return ['Top', 'Right', 'Bottom', 'Left'].map(side => [style[`border${side}Width`], style[`border${side}Color`], style[`border${side}Style`]]);
      };
      const neutral = await cluster.locator('.badge', { hasText: 'Health unverified' }).evaluate(borders);
      assert(neutral.every(([width, color, style]) => parseFloat(width) >= 1 && style !== 'none' && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent'),
        `${label}: the neutral status badge shows a border on all four sides`);
      const standardBorder = await page.evaluate(() => {
        const probe = document.body.appendChild(document.createElement('div'));
        probe.style.borderColor = 'var(--color-border)';
        const color = getComputedStyle(probe).borderTopColor;
        probe.remove();
        return color;
      });
      assert((await page.locator('#standalone').evaluate(borders)).every(([width, color, style]) => parseFloat(width) >= 1 && style !== 'none' && color === standardBorder),
        `${label}: a standalone neutral badge shows the standard border color`);
      if (screenshots) await page.screenshot({ path: `${screenshots}/${label}.png`, clip: { x: 0, y: 0, width: 390, height: 140 } });
    }
    console.log(`${colorScheme}-390: wrapped status badges keep their own borders.`);
    await context.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
