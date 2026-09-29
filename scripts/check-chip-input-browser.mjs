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
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/chip-input.html`;
  browser = await chromium.launch();
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
