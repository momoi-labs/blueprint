import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile:false, logLevel:'error', server:{host:'127.0.0.1',port:0} });
let browser, page;
// Regressions found by the phone review: a 320px touch screen.
before(async () => {
  await server.listen(); browser=await chromium.launch();
  page=await browser.newPage({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/phone-components.html`);
  await page.getByRole('heading', { name: 'Your homelab' }).waitFor();
});
after(async () => { await browser?.close(); await server.close(); });
const style = (selector, property) => page.locator(selector).first().evaluate((el, property) => getComputedStyle(el)[property], property);

test('Fields are 16px on touch, so iOS does not zoom on focus', async () => {
  assert.equal(await style('input[aria-label="Name"]', 'fontSize'), '16px');
});
test('Page actions go under the title', async () => {
  const title=await page.getByRole('heading', { name: 'Your homelab' }).boundingBox();
  const action=await page.locator('#action').boundingBox();
  assert(action.y >= title.y + title.height - 1, 'The action starts below the title');
});
test('Tab labels keep their width and a disabled tab looks disabled', async () => {
  const squeezed=await page.locator('.tabs button').evaluateAll(tabs => tabs.filter(tab => tab.scrollWidth > tab.clientWidth + 1).length);
  assert.equal(squeezed, 0);
  assert.notEqual(await style('.tabs button:disabled', 'color'), await style('.tabs button:not(:disabled):not([aria-selected="true"])', 'color'));
});
test('A long breadcrumb wraps inside the screen', async () => {
  const right=await page.locator('#trail > *').evaluateAll(items => Math.max(...items.map(item => item.getBoundingClientRect().right)));
  assert(right <= 320, `The trail ends at ${right}`);
});
test('A number keeps its unit on the same line', async () => {
  assert.equal(await style('#num', 'whiteSpace'), 'nowrap');
});
test('A toast fits a 320px screen', async () => {
  await page.getByRole('button', { name: 'Notify' }).tap();
  const toast=page.locator('[data-slot="toast"]');
  await toast.waitFor();
  const box=await toast.boundingBox();
  assert(box.x >= 0 && box.x + box.width <= 320, `The toast spans ${box.x} to ${box.x + box.width}`);
});
test('A side drawer keeps a field under its label', async () => {
  await page.getByRole('button', { name: 'Open drawer' }).tap();
  const label=await page.getByText('Drawer name').boundingBox();
  const input=await page.getByRole('textbox', { name: 'Drawer name' }).boundingBox();
  assert(input.y - (label.y + label.height) < 24, `The field is ${input.y - label.y - label.height}px below its label`);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
});
test('A controlled command palette returns focus to the button that opened it', async () => {
  await page.locator('#palette').focus();
  await page.keyboard.press('Enter');
  await page.getByRole('combobox', { name: 'Search commands' }).or(page.getByRole('textbox', { name: 'Search commands' })).waitFor();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement?.id === 'palette');
});
