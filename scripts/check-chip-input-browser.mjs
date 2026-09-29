import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browserType = playwright[process.env.BROWSER || 'chromium'];
const screenshots = process.env.SCREENSHOT_DIR;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/chip-input.html`;
  browser = await browserType.launch();
  console.log(`${browserType.name()} ${browser.version()}`);
});
after(async () => { await browser?.close(); await server.close(); });

test('Shift+Tab navigates backward; Tab and Enter select only enabled suggestions', async () => {
  const page = await browser.newPage();
    page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  try {
    for (const mode of ['normal', 'disabled', 'empty']) {
      await page.goto(`${url}?mode=${mode}`);
      const input = page.getByRole('combobox', { name: 'Dependencies' });
      await input.fill('py');
      if (mode === 'normal') await page.locator('[role="option"][aria-selected="true"]').waitFor();
      await input.press('Shift+Tab');
      if (screenshots && mode === 'normal') await page.screenshot({ path: `${screenshots}/chip-shift-tab.png` });
      assert.equal(await page.getByRole('status', { name: 'Selections' }).textContent(), '0', 'Shift+Tab must not add a dependency');
      assert(await page.getByRole('button', { name: 'Remove node' }).evaluate(element => element === document.activeElement));
      for (const key of ['Tab', 'Enter']) {
        await input.fill('py');
        await input.focus();
        if (mode === 'normal') await page.locator('[role="option"][aria-selected="true"]').waitFor();
        await input.press(key);
        assert.equal(await page.getByRole('status', { name: 'Selections' }).textContent(), mode === 'normal' ? (key === 'Tab' ? '1' : '2') : '0');
        if (mode === 'normal') assert(await input.evaluate(element => element === document.activeElement));
        else if (key === 'Tab') assert(await page.getByRole('button', { name: 'Continue' }).evaluate(element => element === document.activeElement));
      }
    }
  } finally { await page.close(); }
});

for (const target of ['field', 'value', 'option', 'add', 'command']) {
  test(`IME composition does not activate ${target} shortcuts`, async () => {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      for (const signal of ['native', 'composition', 'legacy']) {
        await page.goto(url);
        let input;
        const counter = page.locator(`output[aria-label="${target === 'field' ? 'Selections' : target === 'command' ? 'Commands run' : 'Commits'}"]`);
        if (target === 'field') {
          input = page.getByRole('combobox', { name: 'Dependencies' });
          await input.fill('py');
        } else if (target === 'command') {
          await page.getByRole('button', { name: 'Open commands' }).click();
          input = page.getByRole('combobox', { name: 'Commands', exact: true });
          await input.fill('de');
        } else {
          const label = { value: 'Edit version', option: 'Edit option', add: 'Add option' }[target];
          await page.getByRole('button', { name: label, exact: true }).click();
          input = page.getByRole('textbox', { name: label, exact: true });
          await input.fill('22');
        }
        if (target === 'field' || target === 'command') {
          await page.locator('[role="option"][aria-selected="true"]').waitFor();
        }
        const active = await input.getAttribute('aria-activedescendant');
        if (signal !== 'legacy') await input.dispatchEvent('compositionstart');
        for (const key of ['Enter', 'ArrowDown', 'ArrowUp', 'Escape', 'Tab', 'Backspace']) {
          await input.dispatchEvent('keydown', { key, code: key, isComposing: signal === 'native', keyCode: signal === 'legacy' ? 229 : 0 });
          if (screenshots && signal === 'native' && key === 'Enter') await page.screenshot({ path: `${screenshots}/ime-${target}.png` });
          assert.equal(await counter.textContent(), '0', `${signal}/${key}: IME must not activate ${target}`);
          assert(await input.isVisible(), `${signal}/${key}: editor must remain open`);
          assert.equal(await input.getAttribute('aria-activedescendant'), active, `${signal}/${key}: highlight must stay put`);
        }
        if (target === 'field') {
          await input.fill('');
          await input.dispatchEvent('keydown', { key: 'Backspace', isComposing: signal === 'native', keyCode: signal === 'legacy' ? 229 : 0 });
          assert(await page.getByRole('button', { name: 'Remove node' }).isVisible());
          await input.fill('py');
          // Recreating the list also recreates its option IDs. Wait for the
          // highlight effect before testing confirmation of that suggestion.
          await page.locator('[role="option"][aria-selected="true"]').waitFor();
        }
        if (signal !== 'legacy') await input.dispatchEvent('compositionend');
        await input.press('Enter');
        assert.equal(await counter.textContent(), '1', 'Ordinary Enter runs exactly once after composition');
      }
    } finally { await page.close(); }
  });
}

for (const label of ['Edit version', 'Edit option', 'Add option']) {
  test(`${label} restores focus after confirm and cancel with a controlled parent`, async () => {
    const page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      for (const action of ['Enter', 'Escape', 'confirm', 'blur']) {
        await page.goto(url);
        const trigger = page.getByRole('button', { name: label, exact: true });
        await trigger.click();
        const editor = page.getByRole('textbox', { name: label, exact: true });
        await editor.fill('22');
        if (action === 'confirm') await page.getByRole('button', { name: /^Confirm/ }).click();
        else if (action === 'blur') await page.getByRole('button', { name: 'Continue', exact: true }).click();
        else await editor.press(action);
        if (screenshots && action === 'Enter') await page.screenshot({ path: `${screenshots}/focus-${label.replaceAll(' ', '-')}.png` });
        const destination = action === 'blur' ? page.getByRole('button', { name: 'Continue', exact: true })
          : label === 'Add option' && action !== 'Escape' ? page.getByRole('button', { name: 'Edit added option', exact: true }) : trigger;
        await page.waitForFunction(label => document.activeElement?.getAttribute('aria-label') === label || (label === 'Continue' && document.activeElement?.textContent === label), action === 'blur' ? 'Continue' : label === 'Add option' && action !== 'Escape' ? 'Edit added option' : label);
        assert(await destination.evaluate(element => element === document.activeElement), `${label}/${action}: focus must return to a surviving control`);
        assert.equal(await page.getByRole('status', { name: 'Commits' }).textContent(), action === 'Escape' ? '0' : '1');
        if (action === 'Escape' && label === 'Edit version') assert.equal(await trigger.textContent(), 'latest');
      }
    } finally { await page.close(); }
  });
}

test('Removing a controlled chip returns focus to the field', async () => {
  const page = await browser.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  try {
    for (const action of ['Enter', 'Space', 'click']) {
      await page.goto(url);
      const remove = page.getByRole('button', { name: 'Remove node' });
      if (action === 'click') await remove.click();
      else await remove.press(action);
      if (screenshots && action === 'Enter') await page.screenshot({ path: `${screenshots}/focus-removal.png` });
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-slot') === 'chip-input-field');
      assert.equal(await page.getByRole('button', { name: 'Remove node' }).count(), 0);
      assert(await page.getByRole('combobox', { name: 'Dependencies' }).evaluate(element => element === document.activeElement));
    }
  } finally { await page.close(); }
});

for (const colorScheme of ['light', 'dark']) {
  test(`Selected ChipInput descriptions meet 4.5:1 contrast in ${colorScheme}`, async () => {
    const page = await browser.newPage({ colorScheme, viewport: { width: Number(process.env.VIEWPORT_WIDTH || 390), height: 844 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(url);
      await page.getByRole('combobox', { name: 'Dependencies' }).fill('py');
      const selected = page.locator('[data-slot="chip-input-option"][aria-selected="true"]');
      await selected.waitFor();
      const contrast = await selected.evaluate(element => {
        const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number)
          .map(channel => channel / 255)
          .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
          .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
        const foreground = luminance(getComputedStyle(element.querySelector('.muted')).color);
        const background = luminance(getComputedStyle(element).backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      if (screenshots) await page.screenshot({ path: `${screenshots}/chip-contrast-${colorScheme}.png` });
      assert(contrast >= 4.5, `${colorScheme}: selected description contrast ${contrast.toFixed(2)}:1`);
      console.log(`${colorScheme}: selected ChipInput description contrast ${contrast.toFixed(2)}:1`);
    } finally { await page.close(); }
  });
}

for (const colorScheme of ['light', 'dark']) {
  test(`Empty Enter keeps the form open in ${colorScheme}`, async () => {
    const page = await browser.newPage({ colorScheme, viewport: { width: Number(process.env.VIEWPORT_WIDTH || 390), height: 844 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      for (const mode of ['keyboard', 'always']) {
        await page.goto(`${url}?mode=${mode}`);
        const input = page.getByRole('combobox', { name: 'Packages' });
        await input.focus();
        await input.press('Enter');
        if (screenshots) await page.screenshot({ path: `${screenshots}/empty-enter-${mode}-${colorScheme}.png` });
        assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '0');
        assert(await input.evaluate(element => element === document.activeElement));
        await page.getByRole('button', { name: 'Save', exact: true }).press('Enter');
        assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '1');
      }
    } finally { await page.close(); }
  });

  test(`Escape dismisses suggestions and typing or arrows reopen in ${colorScheme}`, async () => {
    const page = await browser.newPage({ colorScheme, viewport: { width: Number(process.env.VIEWPORT_WIDTH || 390), height: 844 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      for (const reopen of ['typing', 'ArrowDown', 'ArrowUp']) {
        await page.goto(`${url}?mode=keyboard`);
        const input = page.getByRole('combobox', { name: 'Packages' });
        await input.fill('p');
        await page.locator('[role="option"][aria-selected="true"]').waitFor();
        await input.press('Escape');
        if (screenshots) await page.screenshot({ path: `${screenshots}/escape-${colorScheme}.png` });
        assert.equal(await page.getByRole('listbox').count(), 0);
        assert.equal(await input.getAttribute('aria-expanded'), 'false');
        assert.equal(await input.getAttribute('aria-activedescendant'), null);
        assert.equal(await input.inputValue(), 'p');
        assert(await input.evaluate(element => element === document.activeElement));
        await input.press('Enter');
        assert.equal(await page.getByRole('status', { name: 'Selections' }).textContent(), '0', 'Hidden suggestions must not be selected');
        if (reopen === 'typing') await input.press('a');
        else await input.press(reopen);
        await page.getByRole('listbox').waitFor();
        await page.locator('[role="option"][aria-selected="true"]').waitFor();
        assert.equal(await input.getAttribute('aria-expanded'), 'true');
        await input.press(reopen === 'typing' ? 'Enter' : 'Tab');
        assert.equal(await page.getByRole('status', { name: 'Selections' }).textContent(), '1');
      }
      await page.goto(`${url}?mode=free-text`);
      const input = page.getByRole('combobox', { name: 'Packages' });
      await input.fill('custom');
      await input.press('Enter');
      assert.equal(await page.getByRole('status', { name: 'Selections' }).textContent(), '1');
      assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '0');
      assert.equal(await input.inputValue(), '');
      assert.match(await page.locator('main').textContent(), /Values: node, custom/);
    } finally { await page.close(); }
  });
}

for (const colorScheme of ['light', 'dark']) {
  test(`Reopening a long suggestion list scrolls its highlight into view in ${colorScheme}`, async () => {
    const page = await browser.newPage({ colorScheme, viewport: { width: 390, height: 844 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(`${url}?mode=keyboard-long`);
      const input = page.getByRole('combobox', { name: 'Packages' });
      await input.fill('p');
      await page.locator('[role="option"][aria-selected="true"]').waitFor();
      await input.press('Escape');
      await input.press('ArrowUp');
      const last = page.getByRole('option', { name: 'Package 20', exact: true });
      assert.equal(await last.getAttribute('aria-selected'), 'true');
      const list = await page.getByRole('listbox').boundingBox();
      const selected = await last.boundingBox();
      if (screenshots) await page.screenshot({ path: `${screenshots}/reopen-long-${colorScheme}.png` });
      assert(selected.y >= list.y && selected.y + selected.height <= list.y + list.height, 'The reopened last highlight must be visible');
      await input.press('Enter');
      assert.equal(await page.getByRole('status', { name: 'Selections' }).textContent(), '1');
    } finally { await page.close(); }
  });
}

for (const colorScheme of ['light', 'dark']) {
  for (const width of [320, 390]) {
    test(`Coarse chip segments have separate 44px targets at ${width}px in ${colorScheme}`, async () => {
      const page = await browser.newPage({ colorScheme, hasTouch: true, viewport: { width, height: 844 } });
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      try {
        await page.goto(`${url}?mode=touch`);
        await page.waitForFunction(() => matchMedia('(pointer: coarse)').matches && getComputedStyle(document.querySelector('.chip')).minHeight === '44px');
        if (screenshots) await page.screenshot({ path: `${screenshots}/touch-${width}-${colorScheme}.png` });
        for (const label of ['Edit version', 'Edit option', 'Add option', 'Remove node']) {
          const target = page.getByRole('button', { name: label, exact: true });
          for (const [dx, dy] of [[-21, 0], [21, 0], [0, -21], [0, 21]]) {
            const box = await target.boundingBox();
            assert(box.width >= 44 && box.height >= 44, `${label}: ${box.width} by ${box.height}`);
            const point = { x: box.x + box.width / 2 + dx, y: box.y + box.height / 2 + dy };
            assert(await target.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), point), `${label}: edge must hit its own target`);
            if (label === 'Remove node') continue;
            // Native touch dispatch can adjust fractional edge coordinates to
            // a neighbor. Tap the nearest whole pixel inside the tested edge.
            const tap = {
              x: dx > 0 ? Math.floor(point.x) : dx < 0 ? Math.ceil(point.x) : Math.round(point.x),
              y: dy > 0 ? Math.floor(point.y) : dy < 0 ? Math.ceil(point.y) : Math.round(point.y),
            };
            assert(await target.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), tap), `${label}: integer edge must hit its own target`);
            await page.touchscreen.tap(tap.x, tap.y);
            const editor = page.getByRole('textbox', { name: label, exact: true });
            await editor.waitFor({ timeout: 5000 });
            assert.equal(await page.getByRole('textbox').count(), 1, 'Only the intended editor opens');
            if (screenshots && width === 320 && dx === -21) await page.screenshot({ path: `${screenshots}/touch-edit-${label.replaceAll(' ', '-')}-${colorScheme}.png` });
            await editor.press('Escape');
            await page.waitForFunction(label => document.activeElement?.getAttribute('aria-label') === label && document.activeElement?.tagName === 'BUTTON', label);
          }
        }
      } finally { await page.close(); }
    });
  }
}

test('Fine pointer chip segments retain dense sizing', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  try {
    await page.goto(`${url}?mode=touch`);
    await page.waitForFunction(() => matchMedia('(pointer: fine)').matches && getComputedStyle(document.querySelector('.chip')).minHeight === '32px');
    for (const label of ['Edit version', 'Edit option', 'Add option']) {
      const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
      assert(box.width < 44 && box.height < 44, `${label}: retain compact fine-pointer dimensions`);
    }
  } finally { await page.close(); }
});
