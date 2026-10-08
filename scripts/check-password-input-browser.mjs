import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/password-input.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.getByRole('button', { name: 'Submit' }).waitFor();
 return page;
}
const state = input => input.evaluate(el => ({ type: el.type, value: el.value, size: getComputedStyle(el).fontSize, width: el.parentElement.getBoundingClientRect().width,
 start: el.selectionStart, end: el.selectionEnd }));
test('Reveal keeps value, size and caret, and works from the keyboard without submitting', async () => {
 const page = await open();
 try {
  const input = page.getByLabel('Password', { exact: true });
  assert.equal(await input.getAttribute('autocomplete'), 'current-password');
  assert.equal(await input.getAttribute('autocapitalize'), 'none');
  assert.equal(await input.getAttribute('autocorrect'), 'off');
  assert.equal(await input.getAttribute('spellcheck'), 'false');
  assert.match(await input.getAttribute('aria-describedby'), /-help/);
  await input.fill('Il1O0-secret'); await input.evaluate(el => el.setSelectionRange(2, 4));
  const masked = await state(input);
  assert.equal(masked.type, 'password');
  await page.keyboard.press('Tab');
  const toggle = page.getByRole('button', { name: 'Show password' }).first();
  assert(await toggle.evaluate(el => el === document.activeElement));
  assert.equal(await toggle.getAttribute('aria-controls'), await input.getAttribute('id'));
  await page.keyboard.press('Enter');
  const hide = page.getByRole('button', { name: 'Hide password' });
  assert(await hide.evaluate(el => el === document.activeElement));
  const revealed = await state(input);
  assert.deepEqual({ ...revealed, type: 'password' }, masked);
  assert.equal(revealed.type, 'text');
  assert.match(await input.evaluate(el => getComputedStyle(el).fontFamily), /mono/i);
  assert.equal(await page.locator('[aria-live="polite"]').first().textContent(), 'Your password is visible');
  assert.equal((await hide.boundingBox()).width, (await page.getByRole('button', { name: 'Show API key' }).boundingBox()).width);
  await page.keyboard.press('Space');
  assert.equal(await input.getAttribute('type'), 'password');
  assert.equal(await page.locator('[aria-live="polite"]').first().textContent(), 'Your password is hidden');
  assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '0');
 } finally { await page.close(); }
});
test('Submitting masks the value again and keeps it', async () => {
 const page = await open();
 try {
  const input = page.getByLabel('Password', { exact: true });
  await input.fill('kept'); await page.getByRole('button', { name: 'Show password' }).first().click();
  await input.press('Enter');
  assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '1');
  assert.equal(await input.getAttribute('type'), 'password');
  assert.equal(await input.inputValue(), 'kept');
 } finally { await page.close(); }
});
test('Paste, invalid and disabled states reach the control and its frame', async () => {
 const page = await open();
 try {
  const input = page.getByLabel('Password', { exact: true });
  const allowed = await input.evaluate(el => { const data = new DataTransfer(); data.setData('text/plain', 'pasted-secret'); return el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })); });
  assert(allowed, 'Paste must not be prevented');
  await input.fill('bad');
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  const frame = page.locator('.password-input').first();
  assert.equal(await frame.evaluate(el => getComputedStyle(el).borderTopColor), await page.evaluate(() => { const probe = document.createElement('i'); probe.style.color = 'var(--color-danger)'; document.body.append(probe); const color = getComputedStyle(probe).color; probe.remove(); return color; }));
  assert(await page.getByLabel('Disabled').isDisabled());
  assert(await page.getByRole('button', { name: 'Show password' }).last().isDisabled());
 } finally { await page.close(); }
});
for (const width of [320, 1280]) test(`Frame follows the field size and fits at ${width}px`, async () => {
 const page = await open('theme=dark', { viewport: { width, height: 900 }, hasTouch: width < 500 });
 try {
  const key = page.getByLabel('API key', { exact: true });
  const frame = await key.evaluate(el => el.parentElement.getBoundingClientRect().height);
  assert(frame >= 56, `xl frame is ${frame}px`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const toggle = await page.getByRole('button', { name: 'Show API key' }).boundingBox();
  const box = await key.evaluate(el => el.parentElement.getBoundingClientRect().toJSON());
  assert(toggle.x + toggle.width <= box.right && toggle.y >= box.top && toggle.y + toggle.height <= box.bottom);
  if (width < 500) assert(toggle.height >= 44, `toggle is ${toggle.height}px tall`);
 } finally { await page.close(); }
});
