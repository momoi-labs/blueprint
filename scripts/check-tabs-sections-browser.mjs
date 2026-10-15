import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) await mkdir(screenshots, { recursive: true });
const server = await createServer({ root, configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/tabs-sections.html`;
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await page.goto(url);
  const section = name => page.getByRole('button', { name, exact: true });
  const output = page.locator('output');
  await section('Summary').waitFor();

  // A phone: no strip of triggers, a header per panel, the selected one open.
  assert.equal(await page.getByRole('tablist').isVisible(), false);
  assert.equal(await section('Summary').getAttribute('aria-expanded'), 'true');
  assert.equal(await section('Logs').getAttribute('aria-expanded'), 'false', 'a trigger inside a fragment gets a section');
  assert(await section('Archive').isDisabled());
  assert(await page.getByText('Summary panel').isVisible());
  assert.equal(await page.getByText('Logs panel').isVisible(), false);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

  await section('Configuration').click();
  assert.equal(await output.textContent(), 'configuration');
  assert.equal(await section('Configuration').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.getByText('Summary panel').isVisible(), false);
  await page.getByRole('textbox', { name: 'Name' }).fill('kept');
  if (screenshots) await page.screenshot({ path: `${screenshots}/tabs-sections-390.png`, fullPage: true });

  // Closing the open section keeps the value, so a wider screen still has a panel.
  await section('Configuration').click();
  assert.equal(await section('Configuration').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.getByRole('textbox', { name: 'Name' }).isVisible(), false);
  assert.equal(await output.textContent(), 'configuration', 'collapsing is not a value change');
  await section('Configuration').click();
  assert(await page.getByRole('textbox', { name: 'Name' }).isVisible());

  // A section closed earlier opens again when it is picked again.
  await section('Configuration').click();
  await section('Summary').click();
  await section('Configuration').click();
  assert.equal(await section('Configuration').getAttribute('aria-expanded'), 'true', 'a stale collapse does not hide every panel');
  await page.getByRole('textbox', { name: 'Name' }).fill('kept');

  // Turning the phone sideways past the breakpoint keeps the panel and what it holds.
  await section('Configuration').click();
  await page.setViewportSize({ width: 1280, height: 800 });
  assert(await page.getByRole('tablist').isVisible());
  assert.equal(await section('Summary').isVisible(), false);
  assert.equal(await page.getByRole('tab', { name: 'Configuration' }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.getByRole('textbox', { name: 'Name' }).inputValue(), 'kept');
  assert(await page.getByRole('textbox', { name: 'Name' }).isVisible(), 'a collapsed section still shows its panel as a tab');
  await page.getByRole('tab', { name: 'Logs' }).click();
  assert(await page.getByText('Logs panel').isVisible());
  await page.setViewportSize({ width: 390, height: 800 });
  assert.equal(await section('Logs').getAttribute('aria-expanded'), 'true');
  console.log('Tabs as sections: layout, selection, collapse and breakpoint crossing passed.');
} finally {
  await browser?.close();
  await server.close();
}
