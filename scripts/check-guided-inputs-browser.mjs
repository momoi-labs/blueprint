import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/guided-inputs.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
 const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, ...options });
 page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(`${url}?${query}`); await page.getByRole('button', { name: 'Run action', exact: true }).waitFor();
 return page;
}
const output = (page, name) => page.getByRole('status', { name });
for (const variant of ['default', 'tiles', 'segmented']) test(`Radio ${variant}: keyboard, form value, reset and explicit submission`, async () => {
 const page = await open(`variant=${variant}`);
 try {
  const group = page.getByRole('radiogroup', { name: 'Format', exact: true });
  const compact = group.getByRole('radio', { name: 'Compact', exact: true });
  const full = group.getByRole('radio', { name: 'Full', exact: true });
  assert.equal(await compact.getAttribute('aria-checked'), 'true');
  assert.equal(await compact.getAttribute('aria-describedby').then(id => page.locator(`[id="${id}"]`).textContent()), 'Short output.');
  await compact.focus(); await page.keyboard.down('ArrowRight');
  await page.waitForFunction(element => element.getAttribute('aria-checked') === 'true', await full.elementHandle());
  await page.keyboard.up('ArrowRight');
  assert.equal(await full.getAttribute('aria-checked'), 'true');
  assert(await full.evaluate(e => e === document.activeElement));
  assert.equal(await group.locator('[role="radio"][tabindex="0"]').count(), 1);
  await page.keyboard.press('Enter'); assert.equal(await output(page, 'Submissions').textContent(), '0');
  await page.getByRole('button', { name: 'Submit format' }).click();
  assert.equal(await output(page, 'Submitted format').textContent(), 'full');
  await page.getByRole('button', { name: 'Reset format' }).click();
  assert.equal(await compact.getAttribute('aria-checked'), 'true');
  await page.getByRole('button', { name: 'Submit format' }).click();
  assert.equal(await output(page, 'Submitted format').textContent(), 'compact');
  await page.getByRole('radio', { name: 'Second', exact: true }).click();
  assert.equal(await output(page, 'Changes').textContent(), '1');
  assert.equal(await page.getByRole('radio', { name: 'Second', exact: true }).getAttribute('aria-checked'), 'true');
 } finally { await page.close(); }
});
test('Action tiles activate once through native keys and do not submit', async () => {
 const page = await open();
 try {
  const tile = page.getByRole('button', { name: 'Run action', exact: true });
  await tile.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  assert.equal(await output(page, 'Actions').textContent(), '2');
  assert.equal(await output(page, 'Submissions').textContent(), '0');
  assert.equal(await tile.getAttribute('role'), null);
  assert(await page.getByRole('button', { name: 'Unavailable action' }).isDisabled());
 } finally { await page.close(); }
});
for (const width of [320, 390, 1280]) test(`Steps retain state and reachable navigation at ${width}px`, async () => {
 const page = await open('long', { viewport: { width, height: 900 }, hasTouch: width < 500 });
 try {
  const nav = page.getByRole('navigation', { name: 'Progress' });
  if (width < 500) {
   assert.equal(await nav.getByRole('list').count(), 0);
   const toggle = nav.getByRole('button', { name: 'View steps' });
   assert((await toggle.boundingBox()).height >= 44);
   await toggle.click(); assert.equal(await nav.getByRole('button', { name: 'Hide steps' }).getAttribute('aria-expanded'), 'true');
  }
  assert.equal(await nav.locator('[aria-current="step"]').count(), 1);
  await nav.getByRole('button', { name: /Source/ }).click();
  assert.equal(await nav.locator('[aria-current="step"]').getAttribute('data-state'), 'completed');
  assert.equal(await nav.getByRole('link', { name: /Finish/ }).count(), 0);
  assert.equal(await nav.getByRole('button', { name: /Finish/ }).count(), 0);
  assert.equal(await nav.getByRole('link', { name: /Format/ }).getAttribute('href'), '#format');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
 } finally { await page.close(); }
});
test('Empty Steps has no current item or invented completion', async () => {
 const page = await open('empty', { viewport: { width: 390, height: 900 } });
 try { assert.equal(await page.locator('[aria-current="step"]').count(), 0); assert(await page.getByText('No current step', { exact: true }).isVisible()); }
 finally { await page.close(); }
});
async function drop(page, files) {
 await page.locator('.file-dropzone').evaluate((el, files) => {
  const dt = new DataTransfer(); for (const file of files) dt.items.add(new File(['sample'], file.name, { type: file.type }));
  el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
 }, files);
}
test('File picker/drop parity, rejection, cancellation, repeated files and disabled drops', async () => {
 const page = await open();
 try {
  const input = page.getByLabel('Choose sample file', { exact: true });
  const file = { name: 'sample.TXT', mimeType: 'text/plain', buffer: Buffer.from('sample') };
  await input.setInputFiles(file); await input.setInputFiles(file);
  assert.equal(await output(page, 'File calls').textContent(), '2');
  await input.dispatchEvent('cancel');
  assert.equal(await output(page, 'Files').textContent(), 'sample.TXT');
  await drop(page, [{ name: 'bad.pdf', type: 'application/pdf' }]);
  assert.equal(await output(page, 'Rejections').textContent(), '1');
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  assert.equal(await output(page, 'Files').textContent(), 'sample.TXT');
  await input.setInputFiles({ name: 'bad.pdf', mimeType: 'application/pdf', buffer: Buffer.from('sample') });
  assert.equal(await output(page, 'Rejections').textContent(), '2');
  await drop(page, [{ name: 'one.txt', type: '' }, { name: 'two.txt', type: '' }]);
  assert.equal(await output(page, 'Rejections').textContent(), '3');
  await page.getByRole('checkbox', { name: 'Multiple files' }).check();
  await drop(page, [{ name: 'one.txt', type: '' }, { name: 'two.png', type: 'image/png' }]);
  assert.equal(await output(page, 'Files').textContent(), 'one.txt,two.png');
  assert.notEqual(await input.getAttribute('aria-invalid'), 'true');
  await page.getByRole('checkbox', { name: 'Disable files' }).check();
  await drop(page, [{ name: 'ignored.txt', type: 'text/plain' }]);
  assert.equal(await output(page, 'File calls').textContent(), '3');
  assert(await input.isDisabled());
 } finally { await page.close(); }
});
for (const theme of ['light', 'dark']) for (const hasTouch of [false, true]) test(`XL controls keep size and native behavior, ${theme}/${hasTouch ? 'touch' : 'mouse'}`, async () => {
 const page = await open(`theme=${theme}`, { viewport: { width: hasTouch ? 390 : 1280, height: 960 }, hasTouch });
 try {
  const input = page.getByRole('textbox', { name: 'Large input', exact: true });
  assert.equal((await input.boundingBox()).height, 56);
  const grouped = page.getByRole('textbox', { name: 'Grouped input', exact: true });
  assert.equal(await grouped.evaluate(e => e.parentElement.getBoundingClientRect().height), 56);
  assert.equal((await page.getByRole('button', { name: 'Continue', exact: true }).boundingBox()).height, 56);
  const select = page.getByRole('combobox', { name: 'Large select', exact: true });
  assert.equal((await select.boundingBox()).height, 56);
  await input.fill('retained'); assert.equal(await grouped.inputValue(), 'retained');
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  assert((await notes.boundingBox()).height > 56);
  await notes.fill('line one'); await notes.press('End'); await notes.press('Enter'); await notes.press('a');
  assert.equal(await notes.inputValue(), 'line one\na');
  await select.click(); await page.getByRole('option', { name: 'Wide', exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'combobox');
  assert.equal(await select.textContent(), 'Wide');
  assert.equal(await input.inputValue(), 'retained');
  for (const header of await page.locator('.topbar[data-variant="plain"]').all()) {
   assert.equal(await header.evaluate(e => getComputedStyle(e).position), 'static');
   assert.equal(await header.evaluate(e => getComputedStyle(e).backgroundColor), 'rgba(0, 0, 0, 0)');
   assert.equal(await header.evaluate(e => getComputedStyle(e).borderBottomWidth), '0px');
  }
 } finally { await page.close(); }
});

function luminance(rgb) {
 const channels = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
 return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
for (const theme of ['light', 'dark']) test(`Tangerine ${theme}: filled text, hover and selected marker contrast`, async () => {
 const page = await open(`theme=${theme}`, { viewport: { width: 390, height: 960 } });
 try {
  const primary = page.locator('#primary');
  for (const hover of [false, true]) {
   if (hover) await primary.hover();
   // Wait for the declared color transition before sampling its final value.
   await primary.evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished)); });
   const colors = await primary.evaluate(e => { const s = getComputedStyle(e); return [s.color, s.backgroundColor]; });
   assert(contrast(...colors) >= 4.5, `${theme} primary ${hover ? 'hover' : 'rest'}: ${colors}`);
  }
  const marker = await page.locator('.steps-segments > [data-current="true"]').evaluate(e => [getComputedStyle(e).backgroundColor, getComputedStyle(document.body).backgroundColor]);
  assert(contrast(...marker) >= 3, `${theme} current marker: ${marker}`);
  const radio = page.getByRole('radio', { name: 'Compact', exact: true });
  await radio.focus();
  const focus = await radio.evaluate(e => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineWidth]; });
  assert.notEqual(focus[0], 'none'); assert(parseFloat(focus[1]) >= 2);
 } finally { await page.close(); }
});

for (const orientation of ['horizontal', 'vertical']) for (const dir of ['ltr', 'rtl']) test(`Steps connectors leave markers clear: ${orientation}/${dir}`, async () => {
 const page = await open(`orientation=${orientation}&dir=${dir}`);
 try {
  for (const width of [1280, 390]) {
   await page.setViewportSize({ width, height: 960 });
   if (width < 500) await page.getByRole('button', { name: 'View steps' }).click();
   const geometry = await page.locator('.steps-list > li').evaluateAll(items => items.slice(0, -1).map((el, index) => {
    const css = getComputedStyle(el, '::before'), rect = el.getBoundingClientRect();
    const marker = el.querySelector('.steps-marker').getBoundingClientRect();
    const next = items[index + 1].querySelector('.steps-marker').getBoundingClientRect();
    const x = rect.x + parseFloat(css.left), y = rect.y + parseFloat(css.top);
    return { x, y, right: x + parseFloat(css.width), bottom: y + parseFloat(css.height), marker: marker.toJSON(), next: next.toJSON() };
   }));
   for (const line of geometry) {
    if (orientation === 'vertical' || width < 500) {
     assert(line.y > line.marker.bottom && line.bottom < line.next.top, JSON.stringify(line));
    } else if (dir === 'ltr') {
     assert(line.x > line.marker.right && line.right < line.next.left, JSON.stringify(line));
    } else {
     assert(line.right < line.marker.left && line.x > line.next.right, JSON.stringify(line));
    }
   }
   const pending = page.locator('.steps-list > [data-state="upcoming"]');
   assert.equal(await pending.locator('.steps-marker').evaluate(e => getComputedStyle(e).borderTopStyle), 'dashed');
   assert.notEqual(await pending.locator('.steps-label').evaluate(e => getComputedStyle(e).color), await page.locator('.steps-list > [data-state="completed"] .steps-label').first().evaluate(e => getComputedStyle(e).color));
   assert.equal(await page.locator('.steps-list > [data-state="disabled"] .steps-marker svg').count(), 1);
  }
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Choice frames and step markers follow appearance settings in ${theme}`, async () => {
 const page = await open(`theme=${theme}`);
 try {
  const shapes = ['square', 'rounded', 'asym', 'pixel'];
  const borders = ['solid', 'none', 'dash', 'rail', 'bevel', 'double', 'base', 'offset', 'manga', 'brush'];
  for (const scope of ['all', 'panels', 'outer']) for (const borderStyle of borders) for (const cornerStyle of shapes) {
   await page.evaluate(settings => Object.assign(document.documentElement.dataset, settings), { frameScope: scope, borderStyle, cornerStyle });
   const styles = await page.evaluate(() => {
    const read = selector => { const el = document.querySelector(selector), s = getComputedStyle(el), ink = getComputedStyle(el, '::before'); return { radius: [s.borderTopLeftRadius, s.borderTopRightRadius], width: s.borderTopWidth, border: s.borderTopStyle, line: s.borderTopColor, image: s.backgroundImage, background: s.backgroundColor, shadow: s.boxShadow, ink: { content: ink.content, clip: ink.clipPath, inset: ink.inset, radius: ink.borderRadius, image: ink.backgroundImage, shadow: ink.boxShadow } }; };
    return { reference: read('#choices > button'), panel: read('#frame-reference'), radio: read('.radio-group[data-variant="tiles"] > .radio-item'), file: read('.file-dropzone'), marker: read('.steps-list [data-state="completed"] .steps-marker') };
   });
   for (const [name, actual] of [['radio', styles.radio], ['file', styles.file], ...(scope === 'all' ? [['marker', styles.marker]] : [])]) {
    const where = `${theme}/${scope}/${borderStyle}/${cornerStyle}/${name}`;
    const panel = scope === 'all' && name !== 'marker';
    assert.deepEqual(actual.radius, panel ? styles.panel.radius : styles.reference.radius, `${where}: same ${panel ? 'panel' : 'control'} corners`);
    if (panel && cornerStyle !== 'pixel') {
     assert.equal(actual.border, borderStyle === 'none' ? 'solid' : styles.panel.border, `${where}: border treatment`);
     for (const property of ['content', 'clip', 'inset', 'radius']) assert.equal(actual.ink[property], styles.panel.ink[property], `${where}: shared ${property}`);
     if (borderStyle === 'manga') assert(actual.ink.image.includes('linear-gradient'), `${where}: slanted stroke`);
     if (['brush', 'rail', 'base', 'offset', 'bevel'].includes(borderStyle)) assert.notEqual(actual.ink.shadow, 'none', `${where}: decorative stroke`);
    }
    if (scope === 'all' && cornerStyle === 'pixel' && !['manga', 'brush'].includes(borderStyle)) {
     assert(actual.image.includes('linear-gradient'), `${where}: stepped edge is painted`);
     assert.equal(actual.background, 'rgba(0, 0, 0, 0)', `${where}: no square background behind the steps`);
     assert.equal(actual.shadow, 'none', `${where}: no rectangular shadow`);
    }
    if (scope === 'all' && ['manga', 'brush'].includes(borderStyle)) {
     if (name === 'marker') assert.equal(actual.width, styles.reference.width, `${where}: compact outline width`);
     else {
      assert.equal(actual.ink.clip, styles.panel.ink.clip, `${where}: expressive contour`);
      assert.equal(actual.line, 'rgba(0, 0, 0, 0)', `${where}: no rectangular border under the contour`);
     }
    }
   }
  }
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Pixel choice states and native activation survive in ${theme}`, async () => {
 const page = await open(`theme=${theme}&corners=pixel&invalid`, { hasTouch: true, viewport: { width: 390, height: 960 } });
 try {
  const group = page.getByRole('radiogroup', { name: 'Format', exact: true });
  const compact = group.getByRole('radio', { name: 'Compact', exact: true });
  const full = group.getByRole('radio', { name: 'Full', exact: true });
  await full.tap(); assert.equal(await full.getAttribute('aria-checked'), 'true');
  assert.equal(await output(page, 'Submissions').textContent(), '0');
  // Keyboard entry must use the stepped edge rather than a rectangular ring.
  await compact.focus(); await page.keyboard.press('Tab'); await full.focus();
  assert.equal(await full.evaluate(e => getComputedStyle(e).getPropertyValue('--pixel-line-width').trim()), '2px');
  const input = page.getByLabel('Choose sample file', { exact: true });
  await input.focus();
  assert.equal(await page.locator('.file-dropzone').evaluate(e => getComputedStyle(e).getPropertyValue('--pixel-line-width').trim()), '2px');
  const chooserPromise = page.waitForEvent('filechooser'); await input.press('Enter');
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'valid.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
  assert.equal(await output(page, 'Files').textContent(), 'valid.txt');
  await page.getByRole('button', { name: 'Submit format' }).click();
  await drop(page, [{ name: 'invalid.pdf', type: 'application/pdf' }]);
  assert.equal(await input.getAttribute('aria-invalid'), 'true');
  const errorColor = await page.locator('.file-dropzone').evaluate(e => { const s = getComputedStyle(e); return [s.getPropertyValue('--pixel-line').trim(), s.getPropertyValue('--color-danger').trim()]; });
  assert.equal(errorColor[0], errorColor[1]);
  await page.getByRole('checkbox', { name: 'Disable files' }).check();
  await drop(page, [{ name: 'ignored.txt', type: 'text/plain' }]);
  assert.equal(await output(page, 'File calls').textContent(), '1');
  assert(await input.isDisabled());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Full choice contours retain state colors, spacing and activation in ${theme}`, async () => {
 const page = await open(`theme=${theme}`, { hasTouch: true });
 try {
  for (const border of ['manga', 'brush']) {
   await page.evaluate(border => Object.assign(document.documentElement.dataset, { borderStyle: border, frameDetail: 'large' }), border);
   const group = page.getByRole('radiogroup', { name: 'Format', exact: true });
   const full = group.getByRole('radio', { name: 'Full', exact: true });
   await full.tap(); assert.equal(await full.getAttribute('aria-checked'), 'true');
   assert.equal(await output(page, 'Submissions').textContent(), '0');
   const selectedInk = await full.evaluate((e, border) => {
    const s = getComputedStyle(e), ink = getComputedStyle(e, '::before');
    const probe = document.createElement('span'); probe.style.color = 'var(--color-link)'; e.append(probe);
    const expected = getComputedStyle(probe).color; probe.remove();
    return { color: border === 'manga' ? ink.color : ink.boxShadow, expected, fill: s.getPropertyValue('--frame-fill').trim(), expectedFill: s.getPropertyValue('--color-accent-surface').trim() };
   }, border);
   assert(selectedInk.color.includes(selectedInk.expected), `${border}: selected contour uses accent ink`);
   assert.equal(selectedInk.fill, selectedInk.expectedFill);
   for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 960 });
    const edges = await group.locator('.radio-item').evaluateAll(items => items.map(el => {
     const rect = el.getBoundingClientRect(), ink = getComputedStyle(el, '::before');
     return { left: rect.left + parseFloat(ink.left), right: rect.right - parseFloat(ink.right), top: rect.top + parseFloat(ink.top), bottom: rect.bottom - parseFloat(ink.bottom) };
    }));
    for (let i = 0; i < edges.length - 1; i++) assert(edges[i].right < edges[i + 1].left || edges[i].bottom < edges[i + 1].top, `${border}/${width}: adjacent contours do not overlap`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${border}/${width}: no horizontal overflow`);
   }
   const input = page.getByLabel('Choose sample file', { exact: true });
   await input.focus();
   const chooserPromise = page.waitForEvent('filechooser'); await input.press('Enter');
   await (await chooserPromise).setFiles({ name: 'contour.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
   assert.equal(await output(page, 'Files').textContent(), 'contour.txt');
   await drop(page, [{ name: 'invalid.pdf', type: 'application/pdf' }]);
   assert.equal(await input.getAttribute('aria-invalid'), 'true');
   const errorInk = await page.locator('.file-dropzone').evaluate((el, border) => {
    const ink = getComputedStyle(el, '::before');
    const probe = document.createElement('span'); probe.style.color = 'var(--color-danger)'; el.append(probe);
    const expected = getComputedStyle(probe).color; probe.remove();
    return [border === 'manga' ? ink.color : ink.boxShadow, expected];
   }, border);
   assert(errorInk[0].includes(errorInk[1]), `${border}: error follows the full contour`);
   await page.emulateMedia({ forcedColors: 'active' });
   for (const control of [full, page.locator('.file-dropzone')]) {
    const fallback = await control.evaluate(el => [getComputedStyle(el).borderTopWidth, getComputedStyle(el, '::before').display]);
    assert.deepEqual(fallback, ['1px', 'none'], `${border}: forced colors retain a native outline`);
   }
   await page.emulateMedia({ forcedColors: 'none' });
  }
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Steps keep state colors and uniform error tint with Pixel corners in ${theme}`, async () => {
 const page = await open(`theme=${theme}&corners=pixel`);
 try {
  const nav = page.getByRole('navigation', { name: 'Progress' });
  for (const [state, fill, line] of [['completed', 'foreground', 'foreground'], ['error', 'danger-surface', 'danger'], ['disabled', 'muted', 'border']]) {
   const marker = nav.locator(`.steps-list > [data-state="${state}"] .steps-marker`).first();
   const colors = await marker.evaluate((e, { fill, line }) => { const s = getComputedStyle(e); return {
    actual: [s.getPropertyValue('--pixel-fill').trim(), s.getPropertyValue('--pixel-line').trim()],
    expected: [s.getPropertyValue(`--color-${fill}`).trim(), s.getPropertyValue(`--color-${line}`).trim()],
   }; }, { fill, line });
   assert.deepEqual(colors.actual, colors.expected, `${state} retains its colors`);
  }
  const pending = nav.locator('.steps-list > [data-state="upcoming"] .steps-marker');
  assert((await pending.evaluate(e => getComputedStyle(e).backgroundImage)).includes('repeating-linear-gradient'), 'Pixel pending edge retains dashes');
  const error = nav.locator('.steps-list > [data-state="error"] .steps-marker');
  const png = await error.screenshot();
  const fills = await page.evaluate(async source => {
   const image = new Image(); image.src = source; await image.decode();
   const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
   const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
   // Two interior points avoid the exclamation glyph and the border.
   return [[18, 5], [5, 18]].map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data]);
  }, `data:image/png;base64,${png.toString('base64')}`);
  assert(fills[0].every((channel, index) => Math.abs(channel - fills[1][index]) <= 1), 'Translucent error fill is painted once across the shape, allowing 1 channel value for raster rounding');
  await nav.getByRole('button', { name: /Source/ }).click();
  const revisited = nav.locator('[aria-current="step"] .steps-marker');
  const fill = await revisited.evaluate(e => { const s = getComputedStyle(e); return [s.getPropertyValue('--pixel-fill').trim(), s.getPropertyValue('--color-primary').trim()]; });
  assert.equal(fill[0], fill[1], 'Revisited completed step shows current color');
  assert.equal(await nav.locator('[aria-current="step"]').getAttribute('data-state'), 'completed');
  assert.equal(await revisited.locator('svg').count(), 1, 'Completion check survives the current highlight');
  for (const scope of ['panels', 'outer']) {
   await page.evaluate(scope => document.documentElement.dataset.frameScope = scope, scope);
   assert.equal(await revisited.evaluate(e => getComputedStyle(e).backgroundImage), 'none');
   assert.equal(await revisited.evaluate(e => getComputedStyle(e).borderTopLeftRadius), '9999px', 'Narrower scopes preserve the default marker shape');
  }
 } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Square markers, panel marks on choice frames and marker guides in ${theme}`, async () => {
 const page = await open(`theme=${theme}&corners=square`);
 try {
  const marker = '.steps-list [data-state="completed"] .steps-marker';
  assert.deepEqual(await page.locator(marker).first().evaluate(e => { const s = getComputedStyle(e); return [s.borderTopLeftRadius, s.borderTopRightRadius]; }), ['0px', '0px'], 'Square markers have square corners');
  for (const markScope of ['panels', 'all', 'outer']) for (const cornerMarks of ['ticks', 'brackets', 'none']) {
   await page.evaluate(settings => Object.assign(document.documentElement.dataset, settings), { markScope, cornerMarks });
   const marks = await page.evaluate(() => {
    const read = selector => { const s = getComputedStyle(document.querySelector(selector), '::after'); return { content: s.content, inset: s.inset, opacity: s.opacity, image: s.backgroundImage, mask: s.maskImage }; };
    return { panel: read('#frame-reference'), radio: read('.radio-group[data-variant="tiles"] > .radio-item'), file: read('.file-dropzone') };
   });
   for (const name of ['radio', 'file']) assert.deepEqual(marks[name], marks.panel, `${markScope}/${cornerMarks}/${name}: same marks as panels`);
  }
  await page.evaluate(() => Object.assign(document.documentElement.dataset, { markScope: 'all', cornerMarks: 'ticks' }));
  const guides = await page.evaluate(marker => {
   const guide = selector => getComputedStyle(document.querySelector(selector)).getPropertyValue('--control-guide').trim();
   return { marker: guide(marker), button: guide('#choices > button'), radio: guide('.radio-group[data-variant="tiles"] > .radio-item'), file: guide('.file-dropzone'), image: getComputedStyle(document.querySelector(marker)).backgroundImage };
  }, marker);
  assert.equal(guides.marker, guides.button, 'Markers use the button guides');
  assert(guides.image.includes('linear-gradient'), 'Marker guides are painted');
  assert.equal(guides.radio, 'transparent', 'Tiles carry panel marks, not guides');
  assert.equal(guides.file, 'transparent', 'The drop zone carries panel marks, not guides');
  await page.evaluate(() => document.documentElement.dataset.frameScope = 'panels');
  assert.equal(await page.locator(marker).first().evaluate(e => getComputedStyle(e).backgroundImage), 'none', 'Circular markers have no guides');
 } finally { await page.close(); }
});

for (const border of ['manga', 'brush']) test(`${border} buttons, markers and switches use the irregular control contour with a visible focus ring`, async () => {
 const page = await open(`border=${border}&corners=square`);
 try {
  const clip = selector => page.locator(selector).first().evaluate(e => getComputedStyle(e).clipPath);
  for (const selector of ['#choices > button', '.steps-list [data-state="completed"] .steps-marker', 'button[data-slot="switch"]']) assert((await clip(selector)).startsWith('polygon('), `${selector}: irregular contour`);
  assert.equal(await clip('.radio-group[data-variant="tiles"] > .radio-item'), 'none', 'Tiles keep the panel contour instead');
  const button = page.locator('#choices > button').first();
  await button.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  assert.deepEqual(await button.evaluate(e => { const s = getComputedStyle(e); return [e.matches(':focus-visible'), s.clipPath, s.outlineStyle]; }), [true, 'none', 'solid'], 'A focused button shows the standard ring on its full box');
 } finally { await page.close(); }
});
