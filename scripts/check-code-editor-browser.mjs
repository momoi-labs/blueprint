import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/code-editor.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.getByLabel('Disabled').waitFor();
 return page;
}
const token = (page, name) => page.evaluate(name => { const probe = document.createElement('i'); probe.style.color = `var(${name})`; document.body.append(probe); const color = getComputedStyle(probe).color; probe.remove(); return color; }, name);
// Where each layer puts line `n`, relative to the textarea's own text.
const lines = (textarea, n) => textarea.evaluate((el, n) => {
 const frame = el.closest('.code-editor'), style = getComputedStyle(el), line = parseFloat(style.lineHeight);
 const text = el.getBoundingClientRect().top + el.clientTop + parseFloat(style.paddingTop) - el.scrollTop + (n - 1) * line;
 const number = frame.querySelectorAll('.code-editor-gutter span')[n - 1]?.getBoundingClientRect().top;
 const layer = frame.querySelector('.code-editor-highlight > *');
 const painted = layer && layer.getBoundingClientRect().top + parseFloat(getComputedStyle(layer).paddingTop) + (n - 1) * line;
 const left = layer && Math.round(layer.getBoundingClientRect().left - (el.getBoundingClientRect().left - el.scrollLeft));
 return { text, number, painted, left, line };
}, n);

test('Label, hint, gutter and highlight are wired to one native textarea', async () => {
 const page = await open();
 try {
  const editor = page.getByLabel('Startup script');
  assert.equal(await editor.evaluate(el => el.tagName), 'TEXTAREA');
  assert.match(await editor.getAttribute('aria-describedby'), /script-help/);
  assert.equal(await editor.getAttribute('spellcheck'), 'false');
  assert.equal(await editor.getAttribute('wrap'), 'off');
  const frame = page.locator('.code-editor').first();
  assert.equal(await frame.locator('.code-editor-gutter').getAttribute('aria-hidden'), 'true');
  assert.equal(await frame.locator('.code-editor-highlight').getAttribute('aria-hidden'), 'true');
  assert.equal(await frame.locator('.code-editor-gutter span').count(), (await editor.inputValue()).split('\n').length);
  const height = await editor.evaluate(el => ({ frame: el.closest('.code-editor').clientHeight, textarea: el.offsetHeight, rows: Math.round((el.clientHeight - parseFloat(getComputedStyle(el).paddingTop) * 2) / parseFloat(getComputedStyle(el).lineHeight)) }));
  assert.equal(height.frame, height.textarea, 'the textarea, not the line count, sets the height');
  assert(height.rows >= 7 && height.rows <= 8, `${height.rows} rows are visible`);
  assert.equal(await frame.locator('.code-editor-highlight > *').textContent(), await editor.inputValue());
  assert.equal(await page.locator('.code-editor-highlight .sh-comment').first().textContent(), '#!/bin/sh');
  assert.equal(await page.locator('.code-editor').nth(1).locator('.code-editor-highlight .sh-comment').textContent(), '# comment');
  assert.equal(await page.locator('[data-slot="code-editor"]:has(#bare) .code-editor-gutter').count(), 0);
 } finally { await page.close(); }
});
test('Gutter, highlight and text share metrics and follow both scroll axes', async () => {
 const page = await open();
 try {
  const editor = page.getByLabel('Startup script');
  const fonts = await page.locator('.code-editor').first().evaluate(frame => ['.code-editor-gutter', '.code-editor-highlight > *', 'textarea']
   .map(part => { const s = getComputedStyle(frame.querySelector(part)); return [s.fontFamily, s.fontSize, s.lineHeight, s.letterSpacing, s.tabSize].join(); }));
  assert.equal(new Set(fonts).size, 1, fonts.join(' | '));
  for (const [top, left] of [[0, 0], [123, 57], [1e6, 1e6]]) {
   await editor.evaluate((el, [top, left]) => { el.scrollTop = top; el.scrollLeft = left; }, [top, left]);
   await page.waitForFunction(([top, left]) => { const el = document.getElementById('script'); return !top || el.scrollTop > 0 && (!left || el.scrollLeft > 0); }, [top, left]);
   await page.evaluate(() => new Promise(requestAnimationFrame));
   const scroll = await editor.evaluate(el => ({ top: el.scrollTop, left: el.scrollLeft }));
   if (top) assert(scroll.top > 0 && (!left || scroll.left > 0), 'the sample must scroll both ways');
   for (const n of [1, 6, 25]) {
    const at = await lines(editor, n);
    assert(Math.abs(at.number - at.text) < 0.5, `line ${n} number is ${at.number - at.text}px off at ${JSON.stringify(scroll)}`);
    assert(Math.abs(at.painted - at.text) < 0.5, `line ${n} highlight is ${at.painted - at.text}px off at ${JSON.stringify(scroll)}`);
    assert(Math.abs(at.left) < 1, `highlight is ${at.left}px off horizontally`);
   }
  }
 } finally { await page.close(); }
});
test('Typing updates line numbers and highlight; plain text stays readable', async () => {
 const page = await open('theme=dark');
 try {
  const editor = page.getByLabel('Startup script');
  await editor.fill('echo one\necho two\n');
  assert.equal(await page.locator('.code-editor').first().locator('.code-editor-gutter span').count(), 3);
  assert.equal(await page.locator('.code-editor-highlight > *').first().textContent(), 'echo one\necho two\n');
  assert.equal(await editor.evaluate(el => getComputedStyle(el).color), 'rgba(0, 0, 0, 0)');
  assert.notEqual(await editor.evaluate(el => getComputedStyle(el).caretColor), 'rgba(0, 0, 0, 0)');
  const plain = page.getByLabel('Without highlighter');
  await plain.fill('echo hi');
  assert.equal(await plain.evaluate(el => getComputedStyle(el).color), await token(page, '--color-foreground'));
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.locator('.code-editor-highlight').first().evaluate(el => getComputedStyle(el).display), 'none');
  assert.notEqual(await editor.evaluate(el => getComputedStyle(el).color), 'rgba(0, 0, 0, 0)');
 } finally { await page.close(); }
});
test('Focus, invalid and disabled states reach the frame', async () => {
 const page = await open();
 try {
  const plain = page.getByLabel('Without highlighter');
  const frame = page.locator('.code-editor:has(#plain)');
  await plain.focus();
  assert.equal(await frame.evaluate(el => getComputedStyle(el).outlineColor), await token(page, '--color-focus'));
  assert.equal(await plain.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
  await plain.fill('bad');
  assert.equal(await plain.getAttribute('aria-invalid'), 'true');
  assert.equal(await frame.evaluate(el => getComputedStyle(el).borderTopColor), await token(page, '--color-danger'));
  assert.equal(await frame.evaluate(el => getComputedStyle(el).outlineColor), await token(page, '--color-danger'));
  const disabled = page.getByLabel('Disabled');
  assert(await disabled.isDisabled());
  assert.equal(await page.locator('.code-editor:has(#disabled) .code-editor-highlight').count(), 0);
  assert.equal(await disabled.evaluate(el => getComputedStyle(el).color), await token(page, '--color-disabled'));
  assert.equal(await page.locator('.code-editor:has(#disabled)').evaluate(el => getComputedStyle(el).backgroundColor), await token(page, '--color-disabled-surface'));
 } finally { await page.close(); }
});
for (const query of ['cornerStyle=pixel&frameScope=all&markScope=all&cornerMarks=ticks', 'theme=dark&cornerStyle=pixel&frameScope=all', 'borderStyle=manga&frameScope=all', 'borderStyle=brush&frameScope=all&theme=dark', 'borderStyle=double&cornerStyle=rounded&frameScope=all'])
 test(`One frame and no opaque inner fill with ${query}`, async () => {
  const page = await open(query);
  try {
   for (const id of ['script', 'plain', 'disabled']) {
    const parts = await page.locator(`.code-editor:has(#${id})`).evaluate(frame => [...frame.querySelectorAll('.code-editor-gutter, .code-editor-code, .code-editor-highlight, textarea')]
     .map(el => { const s = getComputedStyle(el); return { name: el.className, fill: s.backgroundColor, image: s.backgroundImage, border: s.borderTopWidth, shadow: s.boxShadow, radius: s.borderTopLeftRadius }; }));
    for (const part of parts) {
     assert.equal(part.fill, 'rgba(0, 0, 0, 0)', `${id} ${part.name} has a fill`);
     assert.equal(part.image, 'none', `${id} ${part.name} paints an image`);
     assert.equal(part.shadow, 'none', `${id} ${part.name} has a shadow`);
     if (part.name !== 'code-editor-gutter') assert.equal(part.border, '0px', `${id} ${part.name} has a border`);
    }
   }
   if (query.includes('pixel')) {
    const frame = page.locator('.code-editor:has(#plain)');
    assert.match(await frame.evaluate(el => getComputedStyle(el).backgroundImage), /gradient/);
    assert.equal(await frame.evaluate(el => getComputedStyle(el).borderTopColor), 'rgba(0, 0, 0, 0)');
    await page.getByLabel('Without highlighter').fill('bad');
    assert.equal(await frame.evaluate(el => getComputedStyle(el).borderTopColor), 'rgba(0, 0, 0, 0)', 'Pixel draws the invalid line itself');
    assert.equal(await frame.evaluate(el => getComputedStyle(el).getPropertyValue('--pixel-line').trim()), await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim()));
    assert.equal(await page.locator('.code-editor:has(#disabled)').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
   }
  } finally { await page.close(); }
 });
test('Fits a phone without page overflow', async () => {
 const page = await open('', { viewport: { width: 320, height: 800 }, hasTouch: true });
 try {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert(await page.getByLabel('Startup script').evaluate(el => el.scrollWidth > el.clientWidth), 'long lines scroll inside the editor');
 } finally { await page.close(); }
});
