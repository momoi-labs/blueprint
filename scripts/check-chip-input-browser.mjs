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
