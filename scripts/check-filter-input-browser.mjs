import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/filter-input.html`);
  const input = page.getByRole('combobox', { name: 'Find replicas' });
  const root = page.locator('[data-slot="filter-input"]');
  const state = async () => JSON.parse(await page.getByRole('status', { name: 'Filter state' }).textContent());
  const clear = async () => { await page.getByRole('button', { name: 'Clear filters', exact: true }).click(); };
  await input.click();
  await input.pressSequentially('status=active ');
  assert.equal((await state())[0].value, 'active');
  assert.equal(await input.inputValue(), '');
  assert(await input.evaluate(element => element === document.activeElement));
  await input.pressSequentially('AND region IN (u');
  await input.press('Tab');
  await input.pressSequentially('e');
  await input.press('Tab');
  await input.pressSequentially(')');
  assert.deepEqual((await state())[1].value, ['us', 'eu']);
  assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '0');

  await root.getByRole('button', { name: 'Edit value in region IN (us, eu)', exact: true }).click();
  const editValue = root.getByRole('textbox', { name: 'Edit value in region IN (us, eu)' });
  await editValue.fill('us, ap,');
  await editValue.press('Enter');
  assert.deepEqual((await state())[1].value, ['us', 'ap']);
  await page.waitForFunction(() => document.activeElement.getAttribute('data-filter-control') === '1-value');

  await root.getByRole('button', { name: 'Edit expression', exact: true }).click();
  await input.fill('(status=active OR status=paused) AND (region=eu OR lag>=100)');
  await input.press('Enter');
  const saved = await state();
  assert.equal(saved[0].kind, 'group');
  assert.equal(saved[1].children[1].value, 100);
  assert.equal(await root.getByRole('group').count(), 2);
  await root.getByRole('button', { name: 'Edit expression', exact: true }).click();
  await input.fill('(status=failed');
  await input.press('Enter');
  assert.deepEqual(await state(), saved);
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  await input.press('Escape');
  assert.deepEqual(await state(), saved);
  assert.equal(await input.inputValue(), '');

  await root.getByRole('button', { name: 'Edit group (status = active OR status = paused)', exact: true }).click();
  const groupEdit = root.getByRole('textbox', { name: 'Edit group in (status = active OR status = paused)' });
  await groupEdit.fill('status=active OR (status=failed AND lag>=500)');
  await groupEdit.press('Enter');
  assert.equal((await state())[0].children[1].kind, 'group');
  assert.equal(await root.getByRole('group').count(), 3);
  if (screenshots) await root.screenshot({ path: `${screenshots}/filter-input-groups-desktop.png` });

  await input.click();
  await input.press('Backspace');
  assert.equal((await state()).length, 1);
  assert.match(await input.inputValue(), /^AND \(region = eu OR lag >= 100\)$/);
  await input.press('Enter');
  assert.equal((await state()).length, 2);

  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  assert(await input.isDisabled());
  assert.equal(await root.locator('button:enabled').count(), 0);
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  await clear();
  await input.fill('owner="Ana Silva"');
  await input.press('Enter');
  assert.equal((await state())[0].value, 'Ana Silva');
  await root.getByRole('button', { name: 'Edit operator in owner = "Ana Silva"', exact: true }).click();
  await root.getByRole('textbox').fill('IN');
  await root.getByRole('textbox').press('Enter');
  assert.deepEqual((await state())[0].value, ['Ana Silva']);

  await clear();
  await input.dispatchEvent('compositionstart');
  await input.fill('status=active ');
  assert.equal((await state()).length, 0);
  await input.dispatchEvent('compositionend');
  assert.equal((await state()).length, 1);

  for (const wholeExpression of [false, true]) {
    for (const prefix of ['status=active ', '(status=active OR status=paused) ']) {
      await clear();
      await input.fill('lag=10');
      await input.press('Enter');
      const confirmed = await state();
      if (wholeExpression) await root.getByRole('button', { name: 'Edit expression', exact: true }).click();
      await input.fill(`${prefix}region=unknown`);
      await input.press('Enter');
      assert.equal(await input.inputValue(), `${prefix}region=unknown`);
      assert.equal(await input.getAttribute('aria-invalid'), 'true');
      assert.match(await root.getByRole('alert').textContent(), /listed value for region/);
      assert.deepEqual(await state(), confirmed);
      await input.fill(`${prefix}region=e`);
      assert.equal(await page.getByRole('option').count(), 1);
      assert.match(await page.getByRole('option').textContent(), /^eu/);
      await input.press('Tab');
      if (wholeExpression) {
        assert.equal(await input.inputValue(), `${prefix}region = eu`);
        assert.deepEqual(await state(), confirmed);
        await input.press('Enter');
      }
      const completed = await state();
      assert.equal(completed.length, wholeExpression ? 2 : 3);
      assert.equal(completed.at(-1).field, 'region');
      assert.equal(completed.at(-1).value, 'eu');
      const preceding = completed.at(-2);
      if (prefix.startsWith('(')) {
        assert.equal(preceding.kind, 'group');
        assert.deepEqual(preceding.children.map(node => node.value), ['active', 'paused']);
      } else assert.equal(preceding.value, 'active');
      assert.equal(await input.inputValue(), '');
    }
  }
  await clear();
  await input.fill('(status=active region=e');
  await input.press('Tab');
  assert.equal(await input.inputValue(), '(status=active region = eu');
  assert.deepEqual(await state(), []);
  await input.pressSequentially(')');
  assert.deepEqual((await state())[0].children.map(node => node.value), ['active', 'eu']);

  await clear();
  await root.locator('.filter-status').evaluate(element => {
    window.filterAnnouncements = [];
    new MutationObserver(() => {
      if (element.textContent) window.filterAnnouncements.push(element.textContent);
    }).observe(element, { childList: true, characterData: true, subtree: true });
  });
  const announces = async (action, expected) => {
    const before = await page.evaluate(() => window.filterAnnouncements.length);
    await action();
    const announcements = await page.evaluate(() => window.filterAnnouncements);
    assert(announcements.length > before, `Expected a new announcement: ${expected}`);
    assert.match(announcements.at(-1), expected);
  };
  for (const value of ['active', 'paused']) {
    await announces(async () => {
      await input.fill(`status=${value}`);
      await input.press('Enter');
    }, /Filters updated/);
  }
  for (const value of ['paused', 'active']) {
    await announces(async () => {
      await root.getByRole('button', { name: `Edit value in status = ${value}`, exact: true }).click();
      await root.getByRole('textbox').fill('failed');
      await root.getByRole('textbox').press('Enter');
    }, /Filter updated/);
  }
  for (let index = 0; index < 2; index++) {
    await announces(() => root.getByRole('button', { name: 'Remove status = failed', exact: true }).first().click(), /Filter removed/);
  }
  console.log('Pasted adjacent conditions, group boundaries, whole-expression completion and consecutive accessible announcements passed.');

  await input.click();
  await input.press('Escape');
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
  await input.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Search', 'Tab leaves the filter when suggestions are dismissed');
  const legacy = page.getByRole('button', { name: 'Edit value, currently latest' });
  await legacy.click();
  await page.getByRole('textbox', { name: 'Edit value, currently latest' }).fill('22');
  await page.getByRole('textbox', { name: 'Edit value, currently latest' }).press('Enter');
  assert.equal(await page.getByRole('button', { name: 'Edit value, currently 22' }).count(), 1);
  assert.deepEqual(errors, []);
  console.log('Desktop: continuous typing, IN completion, segment/group editing, cancellation, IME, focus, disabled state and legacy ChipInput passed.');
  await page.close();

  for (const width of [320, 390]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width, height: 844 }, colorScheme });
      const mobile = await context.newPage();
      mobile.on('pageerror', error => errors.push(error.message));
      await mobile.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/filter-input.html`);
      const filter = mobile.locator('[data-slot="filter-input"]');
      const field = mobile.getByRole('combobox', { name: 'Find replicas' });
      await field.tap();
      await field.pressSequentially('reg');
      const suggestion = mobile.getByRole('option').filter({ hasText: 'region' });
      const contrast = await suggestion.evaluate(element => {
        const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
          .map(channel => channel / 255)
          .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
          .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
        const foreground = luminance(getComputedStyle(element.lastElementChild).color);
        const background = luminance(getComputedStyle(element).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      assert(contrast >= 4.5, `${width}/${colorScheme}: selected description contrast ${contrast.toFixed(2)}:1`);
      if (screenshots) await filter.screenshot({ path: `${screenshots}/filter-input-${width}-${colorScheme}-suggestions.png` });
      await suggestion.tap();
      assert.equal(await field.inputValue(), 'region ');
      await field.pressSequentially('IN (eu, us,)');
      assert.deepEqual(JSON.parse(await mobile.getByRole('status', { name: 'Filter state' }).textContent())[0].value, ['eu', 'us']);
      await mobile.getByRole('button', { name: 'Edit expression', exact: true }).tap();
      await field.fill('(status=active OR (status=paused AND region IN (eu, us,))) AND lag>=100');
      await field.press('Enter');
      assert.equal(await filter.getByRole('group').count(), 2);
      assert(await mobile.evaluate(width => document.documentElement.scrollWidth <= width, width), `${width}/${colorScheme}: page must not overflow`);
      for (const button of await filter.locator('button:enabled').all()) {
        const box = await button.boundingBox();
        assert(box.height >= 44, `${width}/${colorScheme}: touch target height ${box.height}`);
        assert(box.width >= 44, `${width}/${colorScheme}: touch target width ${box.width}`);
        assert(await button.evaluate(element => {
          const box = element.getBoundingClientRect();
          if (box.top < 0 || box.bottom > innerHeight) return true;
          return element.contains(document.elementFromPoint(box.x + box.width / 2, box.bottom - 2));
        }), 'Touch target must not be clipped');
      }
      if (screenshots) await filter.screenshot({ path: `${screenshots}/filter-input-${width}-${colorScheme}-groups.png` });
      await filter.getByRole('button', { name: 'Edit value in lag >= 100', exact: true }).tap();
      const editor = filter.getByRole('textbox', { name: 'Edit value in lag >= 100' });
      await editor.fill('invalid');
      await filter.getByRole('button', { name: 'Save', exact: true }).tap();
      assert.equal(await editor.getAttribute('aria-invalid'), 'true');
      assert.equal(JSON.parse(await mobile.getByRole('status', { name: 'Filter state' }).textContent())[1].value, 100);
      if (screenshots) await filter.screenshot({ path: `${screenshots}/filter-input-${width}-${colorScheme}-editing-error.png` });
      await editor.fill('250');
      await filter.getByRole('button', { name: 'Save', exact: true }).tap();
      assert.equal(JSON.parse(await mobile.getByRole('status', { name: 'Filter state' }).textContent())[1].value, 250);
      await mobile.waitForFunction(() => document.activeElement.getAttribute('data-filter-control') === '1-value');
      await mobile.getByRole('button', { name: 'Toggle disabled' }).tap();
      assert(await field.isDisabled());
      assert.equal(await filter.locator('button:enabled').count(), 0);
      if (screenshots) await filter.screenshot({ path: `${screenshots}/filter-input-${width}-${colorScheme}-disabled.png` });
      await mobile.getByRole('button', { name: 'Toggle disabled' }).tap();
      await filter.getByRole('button', { name: 'Clear filters', exact: true }).tap();
      await field.fill(`owner=${'long'.repeat(30)}`);
      await field.press('Enter');
      assert.equal(JSON.parse(await mobile.getByRole('status', { name: 'Filter state' }).textContent())[0].value, 'long'.repeat(30));
      assert(await mobile.evaluate(width => document.documentElement.scrollWidth <= width, width), 'Long values must wrap on mobile');
      assert.deepEqual(errors, []);
      console.log(`${width}/${colorScheme}: mobile suggestions, IN, nested groups, touch targets, editing, disabled state and overflow passed.`);
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
