import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/code-block.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
 const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.locator('#plain').waitFor();
 return page;
}
const token = (page, name) => page.evaluate(name => { const probe = document.createElement('i'); probe.style.color = `var(${name})`; document.body.append(probe); const color = getComputedStyle(probe).color; probe.remove(); return color; }, name);
// A line's code, without its number, marker and hidden change label.
const lineTexts = (page, id) => page.locator(`#${id} .code-block-line`).evaluateAll(lines => lines.map(line =>
 [...line.childNodes].filter(node => !node.matches?.('.code-block-number, .code-block-marker, .code-block-change'))
  .map(node => node.textContent).join('').replace(/\n$/, '')));
const command = 'echo "first line\nsecond line" | tee /tmp/out && echo "a very long line that runs well past the right edge of a phone screen and keeps going"';

test('Painted lines keep the value, also when a token spans lines', async () => {
 const page = await open();
 try {
  assert.deepEqual(await lineTexts(page, 'command'), command.split('\n'));
  assert.equal(await page.locator('#command .code-block-line').nth(1).locator('.code-string').first().textContent(), 'second line"', 'the string reopens on the next line');
  assert.deepEqual(await lineTexts(page, 'html'), ['# a<b', 'echo "x', 'y"']);
  assert.equal(await page.locator('#html .code-block-line').nth(2).locator('.code-string').textContent(), 'y"');
  assert.equal(await page.locator('#html .code-comment').textContent(), '# a<b');
  assert.deepEqual(await lineTexts(page, 'component'), ['one', 'two'], 'a component that hides its text falls back to the source');
  assert.deepEqual(await lineTexts(page, 'quoted'), ['one', 'two']);
  assert.equal(await page.locator('#quoted .code-block-line').nth(1).locator('.code-string').getAttribute('title'), 'x > y');
 } finally { await page.close(); }
});

test('Title, terminal mark, numbers and diff markers are wired for assistive technology', async () => {
 const page = await open();
 try {
  assert.equal(await page.locator('#command').evaluate(el => el.tagName), 'FIGURE');
  assert.equal(await page.locator('#command figcaption').textContent(), 'Run thisCopy');
  assert.equal(await page.locator('#command [data-slot="terminal-icon"]').getAttribute('aria-hidden'), 'true');
  assert.equal(await page.locator('#marked figcaption').count(), 0, 'no title, no caption');
  assert.equal(await page.locator('#plain .code-block-header').count(), 0);
  assert.deepEqual(await lineTexts(page, 'diff'), ['replicas: 1', 'replicas: 2', 'restart: unless-stopped']);
  assert.deepEqual(await page.locator('#diff .code-block-line').evaluateAll(lines => lines.map(line => line.dataset.change ?? '')), ['removed', 'added', '']);
  assert.deepEqual(await page.locator('#diff .code-block-marker').allTextContents(), ['−', '+', ' ']);
  assert.deepEqual(await page.locator('#diff .code-block-change').allTextContents(), ['Removed line: ', 'Added line: ']);
  for (const part of ['.code-block-marker', '.code-block-number']) {
   assert.deepEqual(new Set(await page.locator(`#marked ${part}`).evaluateAll(els => els.map(el => el.getAttribute('aria-hidden')))), new Set(['true']));
  }
  const added = page.locator('#diff [data-change="added"]');
  assert.doesNotMatch(await added.evaluate(el => getComputedStyle(el).backgroundColor), /rgba\(0, 0, 0, 0\)|\/ 0\)$/, 'an added row is tinted');
  assert.equal(await added.locator('.code-block-marker').evaluate(el => getComputedStyle(el).color), await token(page, '--color-success'));
 } finally { await page.close(); }
});

test('A fold hides its range until opened and keeps it in the copy', async () => {
 const page = await open();
 try {
  assert.deepEqual(await page.locator('#marked .code-block-number').allTextContents(), ['1', '2', '6']);
  const fold = page.getByRole('button', { name: 'Show 3 hidden lines' });
  assert.equal(await fold.getAttribute('aria-expanded'), 'false');
  await fold.click();
  const hide = page.getByRole('button', { name: 'Hide 3 lines' });
  assert.equal(await hide.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(await page.locator('#marked .code-block-number').allTextContents(), ['1', '2', '3', '4', '5', '6']);
  await hide.click();
  assert.equal(await page.locator('#marked .code-block-number').count(), 3);
 } finally { await page.close(); }
});

test('Copy copies the exact value and confirms with a Toast', async () => {
 const page = await open('', { permissions: ['clipboard-read', 'clipboard-write'] });
 try {
  await page.getByRole('button', { name: 'Copy command' }).click();
  await page.getByText('Command copied', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), command);
  await page.getByRole('button', { name: 'Copied command' }).waitFor();
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark'])
 test(`Syntax roles use their tokens and pass 4.5:1 on the block in ${theme}`, async () => {
  const page = await open(`theme=${theme}`);
  try {
   const surface = await page.locator('#plain').evaluate(el => getComputedStyle(el).backgroundColor);
   assert.equal(surface, await token(page, '--color-surface'));
   for (const role of ['comment', 'keyword', 'string', 'constant', 'name']) {
    const color = await page.locator(`#roles .code-${role}`).evaluate(el => getComputedStyle(el).color);
    assert.equal(color, await token(page, `--color-code-${role}`), role);
    const ratio = await page.evaluate(([fg, bg]) => {
     const rgb = c => c.match(/[\d.]+/g).slice(0, 3).map(Number);
     const lum = ([r, g, b]) => [r, g, b].map(v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
     const [a, b] = [lum(rgb(fg)), lum(rgb(bg))];
     return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }, [color, surface]);
    assert(ratio >= 4.5, `${role} is ${ratio.toFixed(2)}:1`);
   }
  } finally { await page.close(); }
 });

// Changed rows put a translucent status tint under the code, so every text
// color on them is checked against the tint composited over the block.
const accents = ['violet', 'terracotta', 'teal', 'cobalt', 'nocturne', 'tangerine', 'red', 'gold', 'lime'];
for (const theme of ['light', 'dark'])
 test(`Text on added and removed lines passes 4.5:1 in ${theme} for every accent`, async () => {
  const page = await open(`theme=${theme}`);
  try {
   const failures = [];
   for (const accent of accents) {
    await page.evaluate(accent => { document.documentElement.dataset.accent = accent; }, accent);
    failures.push(...await page.locator('#tinted').evaluate((block, accent) => {
     const rgba = color => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = color; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data]; };
     const over = ([r, g, b, a], [R, G, B]) => [r, g, b].map((v, i) => v * a / 255 + [R, G, B][i] * (1 - a / 255));
     const lum = rgb => rgb.map(v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
     const surface = rgba(getComputedStyle(block).backgroundColor);
     const out = [];
     for (const line of block.querySelectorAll('.code-block-line[data-change]')) {
      const fill = over(rgba(getComputedStyle(line).backgroundColor), surface);
      for (const part of line.querySelectorAll('.code-block-number, .code-block-marker, [class^="code-"]:not(.code-block-change)')) {
       const ink = over(rgba(getComputedStyle(part).color), fill);
       const [a, b] = [lum(ink), lum(fill)];
       const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
       if (ratio < 4.5) out.push(`${accent} ${line.dataset.change} ${part.className} ${ratio.toFixed(2)}`);
      }
     }
     return out;
    }, accent));
   }
   assert.deepEqual(failures, []);
  } finally { await page.close(); }
 });

for (const query of ['cornerStyle=pixel&frameScope=all&markScope=all&cornerMarks=ticks', 'theme=dark&cornerStyle=pixel&frameScope=all', 'borderStyle=manga&frameScope=all', 'borderStyle=brush&frameScope=all&theme=dark', 'borderStyle=double&cornerStyle=rounded&frameScope=all'])
 test(`One frame and no inner frame with ${query}`, async () => {
  const page = await open(query);
  try {
   for (const id of ['command', 'diff']) {
    const inner = await page.locator(`#${id} > pre`).evaluate(el => {
     const s = getComputedStyle(el), before = getComputedStyle(el, '::before').content, after = getComputedStyle(el, '::after').content;
     return { fill: s.backgroundColor, image: s.backgroundImage, border: s.borderTopWidth, shadow: s.boxShadow, before, after };
    });
    assert.deepEqual(inner, { fill: 'rgba(0, 0, 0, 0)', image: 'none', border: '0px', shadow: 'none', before: 'none', after: 'none' }, `${id} pre draws a frame`);
   }
   if (query.includes('pixel')) {
    const frame = page.locator('#plain');
    assert.match(await frame.evaluate(el => getComputedStyle(el).backgroundImage), /gradient/);
    assert.match(await frame.evaluate(el => getComputedStyle(el).borderTopColor), /rgba\(0, 0, 0, 0\)|\/ 0\)$/, 'Pixel draws the line itself');
   }
  } finally { await page.close(); }
 });

test('Fits a phone; long lines scroll inside the block and tints span the scroll', async () => {
 const page = await open('', { viewport: { width: 320, height: 800 }, hasTouch: true });
 try {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const touch = await page.evaluate(() => { const i = document.createElement('i'); i.style.width = 'var(--size-touch-min)'; document.body.append(i); const w = i.getBoundingClientRect().width; i.remove(); return w; });
  assert((await page.getByRole('button', { name: 'Show 3 hidden lines' }).boundingBox()).height >= touch, 'the fold meets the touch minimum');
  const code = page.locator('#command code');
  assert(await code.evaluate(el => el.scrollWidth > el.clientWidth), 'long lines scroll inside the block');
  const widths = await page.locator('#diff').evaluate(el => {
   el.querySelector('code').append(Object.assign(document.createElement('span'), { className: 'code-block-line', textContent: 'x'.repeat(200) }));
   return [...el.querySelectorAll('.code-block-line')].map(line => line.getBoundingClientRect().width);
  });
  assert.equal(new Set(widths).size, 1, `rows differ in width: ${widths.join(', ')}`);
 } finally { await page.close(); }
});
