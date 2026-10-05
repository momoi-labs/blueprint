import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/appearance-frames.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`); await page.locator('#sample, #solid-square').first().waitFor();
  return page;
}
const radii = el => { const s = getComputedStyle(el); return [s.borderTopLeftRadius, s.borderTopRightRadius].map(parseFloat); };

for (const theme of ['light', 'dark']) test(`Table bands and separators fill every contour in ${theme}`, async () => {
  const page = await open(`contents&theme=${theme}&corners=pixel&frameScope=all&marks=ticks`);
  try {
    await page.evaluate(() => {
      document.documentElement.style.cssText = '--color-card:rgb(16,16,16);--color-muted:rgb(80,80,80);--color-border:rgb(240,0,240);--color-foreground:rgb(240,0,240)';
    });
    for (const border of ['solid', 'manga', 'brush', 'double', 'dash', 'rail', 'base', 'offset', 'none']) {
      for (const size of ['small', 'medium', 'large']) {
        await page.evaluate(({ border, size }) => {
          Object.assign(document.documentElement.dataset, { borderStyle: border, cornerStyle: ['solid', 'manga', 'brush'].includes(border) ? 'pixel' : 'rounded', cornerSize: size, frameDetail: size });
        }, { border, size });
        for (const id of ['plain-table', 'chrome-table']) {
          const geometry = await page.locator(`#${id}`).evaluate(el => {
            const content = el.querySelector('.table-surface') || el.querySelector('.table-scroll');
            const frame = el.getBoundingClientRect(), box = content.getBoundingClientRect(), s = getComputedStyle(el);
            const ink = getComputedStyle(el, '::before');
            return { left: box.left - frame.left, right: frame.right - box.right, border: parseFloat(s.borderLeftWidth), ink: parseFloat(ink.left) || 0 };
          });
          const expected = geometry.border + (['manga', 'brush'].includes(border) ? geometry.ink : 0);
          assert(Math.abs(geometry.left - expected) < 1 && Math.abs(geometry.right - expected) < 1, `${id}/${border}/${size}: content reaches both frame edges: ${JSON.stringify(geometry)}`);
        }
        const table = page.locator('#plain-table');
        await table.scrollIntoViewIfNeeded();
        if (['solid', 'manga', 'brush'].includes(border)) {
          // Distinguish header, body, and ink so a body-colored rim cannot pass.
          const box = await table.boundingBox(), head = await table.locator('thead').boundingBox();
          const clip = { x: Math.floor(box.x - 16), y: Math.floor(box.y - 16), width: Math.ceil(box.width + 32), height: Math.ceil(box.height + 32) };
          const png = await page.screenshot({ clip });
          const pixels = await page.evaluate(async ({ source, y, line }) => {
            const image = new Image(); image.src = source; await image.decode();
            const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
            const at = (x, row) => [...ctx.getImageData(x, row, 1, 1).data].slice(0, 3);
            const ink = rgb => rgb[0] > 150 && rgb[1] < 80 && rgb[2] > 150;
            const hits = Array.from({ length: canvas.width }, (_, x) => x).filter(x => ink(at(x, y)));
            const left = hits[0], right = hits.at(-1);
            const leftInkEnd = Array.from({ length: 16 }, (_, n) => left + n).find(x => !ink(at(x, y)));
            const rightInkEnd = Array.from({ length: 16 }, (_, n) => right - n).find(x => !ink(at(x, y)));
            const separator = Math.max(...[-1, 0, 1].map(dy => Array.from({ length: right - left - 8 }, (_, n) => left + n + 4).filter(x => ink(at(x, line + dy))).length));
            return { left: at(leftInkEnd + 1, y), right: at(rightInkEnd - 1, y), separator, span: right - left - 8 };
          }, { source: `data:image/png;base64,${png.toString('base64')}`, y: Math.floor(head.y + head.height / 2 - clip.y), line: Math.round(head.y + head.height - clip.y) });
          for (const edge of [pixels.left, pixels.right]) assert(edge.every(value => Math.abs(value - 80) <= 3), `${border}/${size}: header has no rim, got ${JSON.stringify(pixels)}`);
          assert(pixels.separator >= pixels.span - 2, `${border}/${size}: separator reaches the ink, got ${JSON.stringify(pixels)}`);
        }
      }
    }
    const toggle = page.locator('#plain-table').getByRole('button', { name: 'work_mem' });
    await toggle.focus(); await page.keyboard.press('Enter');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert(await page.locator('#plain-table').getByRole('link', { name: 'Memory details' }).isVisible());
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#plain-table tbody tr:nth-child(2) td').first().evaluate(el => getComputedStyle(el).borderBottomWidth), '0px', 'A hidden detail row does not leave a second bottom border');
  } finally { await page.close(); }
});

test('Frameless tables and frame scopes remove content decoration without losing scroll or controls', async () => {
  const page = await open('contents&frameless&corners=pixel&frameScope=all');
  try {
    for (const border of ['solid', 'manga', 'brush']) for (const scope of ['all', 'panels', 'outer']) {
      await page.evaluate(({ border, scope }) => Object.assign(document.documentElement.dataset, { borderStyle: border, frameScope: scope }), { border, scope });
      const surface = await page.locator('#plain-table .table-surface').evaluate(el => {
        const s = getComputedStyle(el); return [s.margin, s.clipPath, s.backgroundColor];
      });
      assert.deepEqual(surface, ['0px', 'none', 'rgba(0, 0, 0, 0)']);
      if (scope === 'outer') assert.equal(await page.locator('#chrome-table .table-surface').evaluate(el => getComputedStyle(el).margin), '0px');
    }
    for (const width of [320, 390, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator('#chrome-table table').evaluate(el => { el.style.minWidth = '120rem'; });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const scroller = page.locator('#chrome-table .table-scroll');
      await scroller.evaluate(el => { el.scrollLeft = el.scrollWidth; });
      assert(await scroller.evaluate(el => el.scrollLeft > 0), `${width}: wide rows scroll inside the frame`);
      await page.getByRole('button', { name: 'Next page' }).click();
    }
  } finally { await page.close(); }
});

test('Fields, structured inputs and grouped actions retain their frame scope and keyboard operation', async () => {
  const page = await open('contents&corners=pixel&frameScope=all&marks=none');
  try {
    const dependencies = page.getByRole('combobox', { name: 'Dependencies', exact: true });
    const filters = page.getByRole('combobox', { name: 'Filters', exact: true });
    for (const border of ['solid', 'manga', 'brush']) for (const scope of ['all', 'panels', 'outer']) {
      await page.evaluate(({ border, scope }) => Object.assign(document.documentElement.dataset, { borderStyle: border, frameScope: scope }), { border, scope });
      for (const [field, frame] of [
        [page.getByRole('textbox', { name: 'Name', exact: true }), '#fields > .input'],
        [page.getByRole('textbox', { name: 'Notes', exact: true }), '#fields > .textarea'],
        [page.getByRole('textbox', { name: 'RAM', exact: true }), '#fields .field-control'],
        [dependencies, '#fields > .chip-input .chip-input-box'],
        [filters, '#fields .filter-box'],
      ]) {
        await field.fill('Retained'); await field.focus();
        const style = await page.locator(frame).evaluate(el => {
          const s = getComputedStyle(el); return { radius: s.borderRadius, border: s.borderColor, width: s.borderTopWidth, image: s.backgroundImage, outline: s.outlineColor };
        });
        assert.equal(await field.inputValue(), 'Retained');
        if (scope !== 'all') {
          assert.equal(style.radius, '4px', `${frame}/${border}/${scope}: controls keep standard corners`);
          assert.equal(style.width, '1px');
        } else if (border === 'solid') {
          assert(style.image.includes('linear-gradient'));
          assert.equal(style.border, 'rgba(0, 0, 0, 0)', `${frame}: Pixel has no rectangular border`);
          assert.equal(style.outline, 'rgba(0, 0, 0, 0)', `${frame}: focus follows the stepped edge`);
        } else assert.equal(style.width, '2px', `${border}: fields use the compact heavy outline`);
      }
      await filters.fill('');
    }
    await page.getByRole('button', { name: 'Edit version', exact: true }).click();
    const editor = page.getByRole('textbox', { name: 'Edit version', exact: true });
    await editor.fill('22'); await editor.press('Enter');
    assert.equal(await page.getByRole('button', { name: 'Edit version', exact: true }).textContent(), '22');
    await page.getByRole('button', { name: 'Remove node', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Edit version', exact: true }).count(), 0);
    await filters.fill('status=active'); await filters.press('Enter');
    assert.equal(await filters.inputValue(), '');
    assert(await page.locator('.filter-chip').count() > 0);
    for (const name of ['Previous', 'Following', 'Stop']) {
      const button = page.getByRole('button', { name, exact: true }); await button.focus(); await button.press('Enter');
      assert(await button.evaluate(el => el === document.activeElement));
    }
  } finally { await page.close(); }
});

test('Pixel footer bands retain their fill and leave the corner cutouts clear', async () => {
  const page = await open('contents&corners=pixel&frameScope=all&marks=none');
  try {
    await page.locator('#band-card').evaluate(el => {
      el.style.cssText = '--color-muted:rgb(80,80,80);--color-card:rgb(16,16,16);--color-border:rgb(240,0,240)';
    });
    await page.evaluate(() => {
      document.body.style.background = 'rgb(200,200,200)';
      document.querySelector('#form-card').style.cssText = '--color-warning-surface:rgb(80,80,80);--color-card:rgb(16,16,16)';
    });
    for (const size of ['small', 'medium', 'large']) {
      await page.evaluate(size => document.documentElement.dataset.cornerSize = size, size);
      for (const selector of ['#band-card .card-footer', '#form-card .form-actions']) {
        const footer = page.locator(selector);
        await footer.scrollIntoViewIfNeeded();
        const box = await footer.boundingBox(), png = await footer.screenshot();
        const pixel = await page.evaluate(async source => {
          const image = new Image(); image.src = source; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
          return [Math.floor(canvas.width / 2), 0].map(x => [...ctx.getImageData(x, canvas.height - 2, 1, 1).data].slice(0, 3));
        }, `data:image/png;base64,${png.toString('base64')}`);
        assert.deepEqual(pixel[0], [80, 80, 80], `${selector}/${size}: the footer retains its band color`);
        assert.deepEqual(pixel[1], [200, 200, 200], `${selector}/${size}: fill does not cover the corner cutout`);
        assert(box.height > 36);
        const button = footer.getByRole('button'); await button.focus(); await page.keyboard.press('Enter');
        assert(await button.evaluate(el => { const b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)); }));
      }
    }
  } finally { await page.close(); }
});

test('React dialogs and drawers retain Pixel paint and obey outer-only scope', async () => {
  const page = await open('corners=pixel&frameScope=all&size=large');
  try {
    for (const kind of ['dialog', 'drawer']) {
      await page.getByRole('button', { name: `Open ${kind}`, exact: true }).click();
      const modal = page.getByRole('dialog'); await modal.waitFor();
      const paint = await modal.evaluate(el => { const s = getComputedStyle(el); return { fill: s.backgroundColor, image: s.backgroundImage, border: s.borderColor, shadow: s.boxShadow }; });
      assert.match(paint.fill, /(?:\/ 0|, 0\))/);
      assert(paint.image.includes('linear-gradient'), `${kind}: the React stylesheet retains Pixel fill layers`);
      assert.match(paint.border, /(?:\/ 0|, 0\))/);
      assert.equal(paint.shadow, 'none', `${kind}: a rectangular shadow cannot fill the Pixel cutouts`);
      await page.evaluate(() => document.documentElement.dataset.frameScope = 'outer');
      assert.equal(await modal.evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
      assert.equal(await modal.evaluate(el => getComputedStyle(el).boxShadow), 'none');
      await page.evaluate(() => document.documentElement.dataset.frameScope = 'all');
      await page.emulateMedia({ forcedColors: 'active' });
      assert.equal(await modal.evaluate(el => getComputedStyle(el).backgroundImage), 'none');
      assert.equal(await modal.evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
      await page.emulateMedia({ forcedColors: 'none' });
      await page.keyboard.press('Escape'); await modal.waitFor({ state: 'hidden' });
      await page.waitForFunction(name => document.activeElement?.textContent === name, `Open ${kind}`);
      await page.evaluate(() => document.documentElement.dataset.frameScope = 'all');
    }
  } finally { await page.close(); }
});
for (const [shape, panel, control] of [['square', [0, 0], [4, 4]], ['soft', [8, 8], [4, 4]], ['round', [16, 16], [8, 8]], ['rounded', [16, 16], [8, 8]], ['asym', [12, 3], [6, 2]]]) test(`${shape} corners survive independent borders, sizes and nested scopes`, async () => {
  const page = await open(`corners=${shape}`);
  try {
    for (const [size, scale] of [['small', .5], ['medium', 1], ['large', 1.5], ['off', 0]]) {
      await page.evaluate(size => document.documentElement.dataset.cornerSize = size, size);
      for (const border of ['solid', 'none', 'rail', 'dash', 'bevel', 'double', 'base', 'offset']) {
        await page.evaluate(border => document.documentElement.dataset.borderStyle = border, border);
        const expectedPanel = panel.map(n => n * scale);
        const expectedControl = control.map(n => n * (shape === 'square' && scale !== 0 ? 1 : scale));
        for (const selector of ['#sample', '#sample .table-wrap', '#nested .card']) assert.deepEqual(await page.locator(selector).evaluate(radii), expectedPanel, `${selector}: ${border}/${size}`);
        assert.deepEqual(await page.locator('#sample .field-control').evaluate(radii), expectedControl);
        assert.deepEqual(await page.locator('#sample button').evaluate(radii), expectedControl);
      }
    }
    await page.evaluate(() => { document.documentElement.dataset.cornerSize = 'off'; document.querySelector('#nested').dataset.cornerSize = 'medium'; });
    assert.deepEqual(await page.locator('#nested .card').evaluate(radii), panel, 'A nested corner size can restore rounding');
  } finally { await page.close(); }
});

test('Legacy border presets preserve their radii without a corner override', async () => {
  const page = await open('border=square');
  try {
    for (const [border, panel, control] of [['square', [0, 0], [4, 4]], ['soft', [8, 8], [4, 4]], ['round', [16, 16], [8, 8]], ['asym', [12, 3], [6, 2]], ['rail', [6, 6], [3, 3]]]) {
      await page.evaluate(border => document.documentElement.dataset.borderStyle = border, border);
      assert.deepEqual(await page.locator('#sample').evaluate(radii), panel);
      assert.deepEqual(await page.locator('#sample .field-control').evaluate(radii), control);
    }
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Frameless surfaces keep separators, fields and modal focus in ${theme}`, async () => {
  const page = await open(`border=none&corners=rounded&theme=${theme}`);
  const frameless = async locator => {
    const style = await locator.evaluate(el => { const s = getComputedStyle(el); return [s.borderTopWidth, s.boxShadow, getComputedStyle(el, '::before').content, getComputedStyle(el, '::after').content]; });
    assert.deepEqual(style, ['0px', 'none', 'none', 'none']);
  };
  try {
    for (const selector of ['#sample', '#sample .table-wrap', '#code', '#log', '#palette', '#inset']) await frameless(page.locator(selector));
    assert.equal(await page.locator('#sample .card-footer').evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
    assert.equal(await page.locator('#sample tr:first-child td').first().evaluate(el => getComputedStyle(el).borderBottomWidth), '1px');
    assert.equal(await page.locator('#sample .alert').evaluate(el => getComputedStyle(el).borderInlineStartWidth), '4px');
    const input = page.getByRole('spinbutton', { name: 'RAM' });
    await input.fill('16'); await input.focus();
    assert.equal(await input.evaluate(el => getComputedStyle(el.parentElement).outlineWidth), '2px');
    assert.equal(await input.evaluate(el => getComputedStyle(el.parentElement).borderTopWidth), '1px');
    assert.equal(await page.locator('#nested .card').evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
    assert.equal(await page.locator('#nested .card').evaluate(el => getComputedStyle(el, '::before').content), '""');
    for (const kind of ['dialog', 'drawer']) {
      const trigger = page.getByRole('button', { name: `Open ${kind}`, exact: true });
      await trigger.click();
      const modal = page.getByRole('dialog'); await modal.waitFor(); await frameless(modal);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/frameless-${kind}-${theme}.png` });
      await page.keyboard.press('Escape'); await modal.waitFor({ state: 'hidden' });
      await page.waitForFunction(name => document.activeElement?.textContent === name, `Open ${kind}`);
    }
    assert.equal(await input.inputValue(), '16');
  } finally { await page.close(); }
  if (process.env.SCREENSHOT_DIR) {
    const matrix = await open(`matrix&theme=${theme}`);
    try { await matrix.screenshot({ path: `${process.env.SCREENSHOT_DIR}/borders-and-corners-${theme}.png`, fullPage: true }); }
    finally { await matrix.close(); }
  }
});

for (const theme of ['light', 'dark']) test(`Canvas watermark, scope boundaries and native controls in ${theme}`, async () => {
  const page = await open(`canvas&theme=${theme}&corners=pixel&marks=ticks&outerBorderStyle=brush&outerCornerMarks=none&frameScope=panels&markScope=outer&backgroundStyle=momoi&panelFill=translucent`);
  try {
    const style = (el, pseudo) => { const s = getComputedStyle(el, pseudo); return { content: s.content, background: s.backgroundImage, color: s.backgroundColor, mask: s.maskImage, clip: s.clipPath, pointer: s.pointerEvents, opacity: s.opacity }; };
    const canvas = await page.locator('#canvas').evaluate(style, '::before');
    assert(canvas.background.includes('svg'));
    assert.equal(canvas.pointer, 'none');
    assert.equal(canvas.opacity, '0.14');
    assert.equal((await page.locator('#outer').evaluate(style)).color, 'rgba(0, 0, 0, 0)');
    assert((await page.locator('#outer').evaluate(style, '::before')).clip.startsWith('polygon('));
    assert((await page.locator('#sample').evaluate(style, '::before')).clip.startsWith('polygon('));
    assert.equal((await page.locator('#nested .card').evaluate(style, '::before')).clip, 'none', 'A local corner override clears pixel geometry');
    assert.equal((await page.locator('#sample').evaluate(style, '::after')).content, 'none', 'Outer-only marks do not leak into cards');
    await page.evaluate(() => { document.documentElement.dataset.frameScope = 'outer'; document.documentElement.dataset.markScope = 'panels'; });
    assert.equal((await page.locator('#sample').evaluate(style, '::before')).content, 'none');
    assert.notEqual((await page.locator('#sample').evaluate(style, '::after')).content, 'none', 'Mark scope is independent of frame scope');
    await page.evaluate(() => { document.documentElement.dataset.frameScope = 'all'; document.documentElement.dataset.markScope = 'all'; });
    const input = page.getByRole('textbox', { name: 'Native field', exact: true });
    await input.fill('User data'); await input.focus();
    assert.equal(await input.inputValue(), 'User data');
    assert((await input.evaluate(style)).background.includes('linear-gradient'));
    assert.equal((await input.evaluate(style)).clip, 'none', 'The native input and its focus outline are not clipped');
    const paint = await page.evaluate(() => {
      const probe = document.createElement('span'); document.body.append(probe);
      const color = token => { probe.style.color = `var(${token})`; return getComputedStyle(probe).color; };
      const result = {
        button: getComputedStyle(document.querySelector('#sample button')).backgroundImage.includes(color('--color-primary')),
        error: getComputedStyle(document.querySelector('[aria-label="Native field"]')).backgroundImage.includes(color('--color-danger')),
      };
      probe.remove(); return result;
    });
    assert.equal(paint.button, true, 'Pixel preserves the primary button fill');
    assert.equal(paint.error, true, 'Pixel preserves the invalid field border color');
    const trigger = page.getByRole('button', { name: 'Open dialog', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog'); await dialog.waitFor();
    assert((await dialog.evaluate(style, '::before')).clip.startsWith('polygon('), 'Portal keeps inner pixel style');
    assert(!(await dialog.evaluate(style)).background.includes('momoi'), 'Portal does not duplicate the watermark');
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.textContent === 'Open dialog');
    for (const width of [1440, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const canvas = document.querySelector('#canvas'); const outer = document.querySelector('#outer');
        const css = getComputedStyle(canvas, '::before'); const rect = outer.getBoundingClientRect();
        return { size: css.backgroundSize, position: css.backgroundPosition, margin: parseFloat(getComputedStyle(outer).marginRight), width: rect.width, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(geometry.size.includes('160px'), 'The symbol has a 160px preferred width');
      assert(geometry.position.includes('16px'), 'Both edge insets are 16px');
      assert.equal(geometry.margin, 16, 'The signature uses the same frame margin as other patterns');
      const watermarkFrame = await page.locator('#outer').boundingBox();
      await page.evaluate(() => document.documentElement.dataset.backgroundStyle = 'momoi-repeat');
      assert.deepEqual(await page.locator('#outer').boundingBox(), watermarkFrame, 'Switching between a watermark and repeating symbols does not resize the frame');
      await page.evaluate(() => document.documentElement.dataset.backgroundStyle = 'momoi');
      assert(geometry.width > 150, 'The frame remains usable on narrow screens');
      assert.equal(geometry.overflow, false, `No document overflow at ${width}`);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/canvas-${theme}-${width}.png`, fullPage: true });
    }
  } finally { await page.close(); }
});

test('New border contours, clearance, patterns and frameless suppression compose', async () => {
  const page = await open('canvas&corners=rounded&outerCornerStyle=pixel&outerCornerMarks=diagonal&backgroundStyle=dots');
  try {
    for (const border of ['solid', 'none', 'manga', 'brush']) {
      await page.evaluate(border => { document.documentElement.dataset.borderStyle = border; document.documentElement.dataset.outerBorderStyle = border; }, border);
      for (const id of ['#sample', '#outer']) {
        const result = await page.locator(id).evaluate(el => { const p = getComputedStyle(el, '::before'); return { content: p.content, mask: p.maskImage, clip: p.clipPath, position: p.maskPosition }; });
        if (border === 'none') assert.equal(result.content, 'none');
        if (border === 'manga') { assert(result.clip.startsWith('polygon(')); assert.equal(result.mask, 'none'); }
        if (border === 'brush') { assert(result.clip.startsWith('polygon(')); assert.equal(result.mask, 'none'); }
      }
    }
    for (const background of ['solid', 'dots', 'grid', 'crosses', 'construction', 'guides', 'fibers', 'momoi', 'momoi-repeat']) {
      await page.evaluate(background => document.documentElement.dataset.backgroundStyle = background, background);
      const image = await page.locator('#canvas').evaluate(el => { const s = getComputedStyle(el, '::before'); return [s.backgroundImage, s.maskImage]; });
      assert.equal(image.every(value => value === 'none'), background === 'solid', background);
    }
    await page.evaluate(() => { document.documentElement.dataset.borderStyle = 'offset'; document.documentElement.dataset.markClearance = 'sheet'; });
    assert(await page.locator('#sample').evaluate(el => parseFloat(getComputedStyle(el, '::after').top) <= -15), 'Offset plus drawing-sheet clearance stays outside the frame');
  } finally { await page.close(); }
});

test('Panel translucency retains contrast across every background, paper tone, theme and accent', async () => {
  const page = await open('canvas&backgroundStyle=momoi&panelFill=translucent&corners=square');
  try {
    let minimumText = Infinity, minimumFocus = Infinity;
    for (const background of ['solid', 'dots', 'grid', 'crosses', 'construction', 'guides', 'fibers', 'momoi', 'momoi-repeat']) for (const tone of ['theme', 'accent']) for (const theme of ['light', 'dark']) for (const accent of ['violet', 'terracotta', 'teal', 'cobalt', 'nocturne']) for (const strength of ['quiet', 'visible']) for (const fill of ['solid', 'translucent']) {
      const ratios = await page.evaluate(({ background, tone, theme, accent, strength, fill }) => {
        Object.assign(document.documentElement.dataset, { theme, accent, backgroundStyle: background, paperTone: tone, backgroundStrength: strength, panelFill: fill });
        const outer = document.querySelector('#outer'), card = document.querySelector('#sample');
        const ctx = document.createElement('canvas').getContext('2d');
        function rgb(color) { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); }
        function token(el, name) { const span = document.createElement('span'); span.style.color = `var(${name})`; el.append(span); const color = getComputedStyle(span).color; span.remove(); return rgb(color); }
        const blend = (top, bottom, alpha) => top.map((value, i) => value * alpha + bottom[i] * (1 - alpha));
        const luminance = rgb => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
        const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
        const paper = token(outer, tone === 'accent' ? '--color-accent-surface' : '--color-sidebar');
        const alpha = strength === 'quiet' ? .14 : .22;
        const pattern = background === 'solid' ? paper : blend(background.startsWith('momoi') ? [145, 132, 217] : token(outer, '--color-foreground'), paper, alpha);
        const solidCard = token(card, '--color-card');
        const backing = fill === 'solid' ? solidCard : blend(solidCard, pattern, .65);
        const canvasText = background === 'solid' && fill === 'solid' ? token(outer, '--color-background') : pattern;
        return {
          text: Math.min(...(background === 'solid' && fill === 'solid' && tone === 'theme' ? ['--color-foreground', '--color-muted-foreground'] : ['--color-foreground', '--color-muted-foreground', '--color-subtle-foreground']).flatMap(name => [contrast(token(card, name), backing), contrast(token(outer, name), canvasText)])),
          focus: contrast(token(card, '--color-ring'), backing),
        };
      }, { background, tone, theme, accent, strength, fill });
      minimumText = Math.min(minimumText, ratios.text); minimumFocus = Math.min(minimumFocus, ratios.focus);
      assert(ratios.text >= 4.5, `${background}/${tone}/${theme}/${accent}/${strength}/${fill}: text ${ratios.text}`);
      assert(ratios.focus >= 3, `${background}/${tone}/${theme}/${accent}/${strength}/${fill}: focus ${ratios.focus}`);
    }
    console.log(`Canvas contrast minima: text ${minimumText.toFixed(2)}:1, focus ${minimumFocus.toFixed(2)}:1`);
  } finally { await page.close(); }
});


test('Incompatible marks stay saved and return when the contour supports them', async () => {
  const page = await open('canvas&corners=pixel&marks=arcs');
  try {
    const opacity = () => page.locator('#sample').evaluate(el => getComputedStyle(el, '::after').opacity);
    assert.equal(await opacity(), '0');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerMarks), 'arcs');
    await page.evaluate(() => document.documentElement.dataset.cornerStyle = 'rounded');
    assert.equal(await opacity(), '1');
    await page.evaluate(() => { document.documentElement.dataset.borderStyle = 'brush'; document.documentElement.dataset.cornerMarks = 'brackets'; });
    assert.equal(await opacity(), '0');
    await page.evaluate(() => document.documentElement.dataset.borderStyle = 'solid');
    assert.equal(await opacity(), '1');
  } finally { await page.close(); }
});

test('Manga ink forms one continuous outline at wide and tall aspect ratios', async () => {
  const page = await open('border=manga&corners=square');
  try {
    await page.evaluate(() => {
      document.querySelector('#root').style.visibility = 'hidden';
      document.body.style.background = 'white';
      document.documentElement.style.setProperty('--color-foreground', 'rgb(255,0,255)');
      const probe = document.createElement('div');
      probe.id = 'ink-probe'; probe.className = 'card';
      probe.style.cssText = 'position:fixed;left:24px;top:24px;z-index:999;background:white;--appearance-ink-color:rgb(255,0,255);--corner-mark:0';
      document.body.append(probe);
    });
    for (const [width, height] of [[160, 80], [800, 180], [260, 700]]) for (const detail of ['small', 'medium', 'large']) {
      await page.locator('#ink-probe').evaluate((el, { width, height, detail }) => {
        el.style.width = `${width}px`; el.style.height = `${height}px`; document.documentElement.dataset.frameDetail = detail;
      }, { width, height, detail });
      const png = await page.screenshot({ clip: { x: 8, y: 8, width: width + 32, height: height + 32 } });
      const components = await page.evaluate(async source => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const ink = new Set();
        for (let i = 0; i < data.length; i += 4) if (data[i] > 220 && data[i + 1] < 140 && data[i + 2] > 220) ink.add(i / 4);
        const counts = [];
        while (ink.size) {
          const pending = [ink.values().next().value]; ink.delete(pending[0]); let count = 0;
          while (pending.length) {
            const pixel = pending.pop(); count++;
            for (const delta of [-canvas.width - 1, -canvas.width, -canvas.width + 1, -1, 1, canvas.width - 1, canvas.width, canvas.width + 1]) if (ink.delete(pixel + delta)) pending.push(pixel + delta);
          }
          counts.push(count);
        }
        return counts;
      }, `data:image/png;base64,${png.toString('base64')}`);
      if (components.length !== 1 && process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/manga-disconnected.png`, clip: { x: 8, y: 8, width: width + 32, height: height + 32 } });
      assert.equal(components.length, 1, `${width}x${height}/${detail}: ink must connect at all four corners (${components})`);
      assert(components[0] > width + height, 'The entire outline is painted');
    }
  } finally { await page.close(); }
});

test('Accent paper and drawing guides retain placement, theme contrast and matching rails', async () => {
  const page = await open('canvas&paperTone=accent&backgroundStyle=guides&backgroundPlacement=inside&corners=square');
  try {
    for (const theme of ['light', 'dark']) for (const accent of ['violet', 'terracotta', 'teal', 'cobalt', 'nocturne']) {
      const colors = await page.evaluate(({ theme, accent }) => {
        Object.assign(document.documentElement.dataset, { theme, accent });
        const main = document.querySelector('#outer'), card = document.querySelector('#sample'), shell = document.querySelector('#canvas');
        const ctx = document.createElement('canvas').getContext('2d');
        const rgb = value => { ctx.fillStyle = value; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3); };
        const token = name => { const span = document.createElement('span'); span.style.color = `var(${name})`; main.append(span); const value = getComputedStyle(span).color; span.remove(); return value; };
        const lum = color => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
        const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
        const paper = getComputedStyle(card).backgroundColor;
        return { paper, expected: token('--color-accent-surface'), canvas: getComputedStyle(shell).backgroundColor, rail: getComputedStyle(document.querySelector('#rail')).backgroundColor, sidebar: token('--color-sidebar'), text: ratio(getComputedStyle(card).color, paper), focus: ratio(token('--color-ring'), paper), inset: getComputedStyle(shell, '::before').marginTop, frameInset: getComputedStyle(main).marginTop };
      }, { theme, accent });
      assert.equal(colors.paper, colors.expected); assert.equal(colors.canvas, colors.expected);
      assert.equal(colors.rail, colors.expected, 'Navigation shares the accent paper');
      assert.equal(colors.inset, colors.frameInset, 'Inside guides align to the frame');
      assert(colors.text >= 4.5, `${theme}/${accent} text: ${colors.text}`);
      assert(colors.focus >= 3, `${theme}/${accent} focus: ${colors.focus}`);
    }
    for (const placement of ['outside', 'both', 'inside']) {
      await page.evaluate(placement => document.documentElement.dataset.backgroundPlacement = placement, placement);
      const fill = await page.locator('#outer').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.equal(fill === 'rgba(0, 0, 0, 0)', placement !== 'outside', 'Around-frame patterns have opaque content backing');
    }
  } finally { await page.close(); }
});

for (const border of ['manga', 'brush']) test(`A sticky header cannot cover the ${border} frame top edge`, async () => {
  const page = await open(`canvas&border=${border}&corners=square&frameScope=panels&marks=none`);
  try {
    await page.evaluate(() => document.documentElement.style.setProperty('--color-foreground', 'rgb(255,0,255)'));
    for (const width of [800, 1440]) for (const detail of ['small', 'medium', 'large']) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(detail => document.documentElement.dataset.frameDetail = detail, detail);
      const box = await page.locator('#outer').boundingBox();
      const png = await page.screenshot({ clip: { x: box.x + 12, y: box.y - 12, width: Math.floor(box.width - 24), height: 24 } });
      const missed = await page.evaluate(async source => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let missing = 0;
        for (let x = 0; x < canvas.width; x++) {
          let found = false;
          for (let y = 0; y < canvas.height; y++) {
            const p = (y * canvas.width + x) * 4;
            if (data[p] > data[p + 1] + 60 && data[p + 2] > data[p + 1] + 60) found = true;
          }
          if (!found) missing++;
        }
        return missing;
      }, `data:image/png;base64,${png.toString('base64')}`);
      assert.equal(missed, 0, `${width}px/${detail}: every column of the top ink edge remains visible`);
    }
  } finally { await page.close(); }
});

test('Translucent Pixel panels paint one uniform fill and retain cut-out corners', async () => {
  const page = await open('canvas&border=solid&corners=pixel&marks=none&panelFill=translucent');
  try {
    await page.evaluate(() => {
      const outer = document.querySelector('#outer'), sample = document.querySelector('#sample');
      const body = sample.parentElement; sample.replaceChildren(); body.replaceChildren(sample); outer.replaceChildren(body);
      outer.style.background = 'black';
      outer.style.minHeight = '600px';
      document.body.style.background = 'black';
      document.querySelector('#canvas').style.background = 'black';
      sample.style.cssText = 'position:fixed;left:400px;top:100px;width:160px;height:120px;margin:0;--color-card:white;box-shadow:none';
    });
    for (const corner of ['square', 'pixel']) for (const detail of ['small', 'medium', 'large']) {
      await page.evaluate(({ corner, detail }) => Object.assign(document.documentElement.dataset, { cornerStyle: corner, cornerSize: detail }), { corner, detail });
      const png = await page.screenshot({ clip: await page.locator('#sample').boundingBox() });
      const pixels = await page.evaluate(async source => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        return [[80, 2], [80, 9], [80, 60], [1, 1]].map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[0]);
      }, `data:image/png;base64,${png.toString('base64')}`);
      for (const value of pixels.slice(0, 3)) assert(Math.abs(value - 166) <= 2, `${corner}/${detail}: each fill band has 65% opacity, got ${pixels}`);
      if (corner === 'pixel') assert.equal(pixels[3], 0, 'The missing corner shows the canvas, not a rectangular fill');
    }
  } finally { await page.close(); }
});

for (const border of ['manga', 'brush']) test(`${border} fills reach every ink edge in solid and translucent panels`, async () => {
  const page = await open(`canvas&border=${border}&corners=square&marks=none&outerBorderStyle=none`);
  try {
    await page.evaluate(() => {
      const outer = document.querySelector('#outer'), sample = document.querySelector('#sample');
      const body = sample.parentElement; sample.replaceChildren(); body.replaceChildren(sample); outer.replaceChildren(body);
      outer.style.background = 'black'; outer.style.minHeight = '800px';
      document.body.style.background = 'black'; document.querySelector('#canvas').style.background = 'black';
      document.documentElement.style.setProperty('--color-foreground', 'rgb(255,0,255)');
      sample.style.cssText = 'position:fixed;left:400px;top:100px;margin:0;--color-card:white;box-shadow:none';
    });
    for (const [width, height] of [[260, 400], [700, 180]]) for (const detail of ['small', 'medium', 'large']) for (const fill of ['solid', 'translucent']) {
      await page.evaluate(({ width, height, detail, fill }) => {
        Object.assign(document.documentElement.dataset, { frameDetail: detail, panelFill: fill });
        Object.assign(document.querySelector('#sample').style, { width: `${width}px`, height: `${height}px` });
      }, { width, height, detail, fill });
      const box = await page.locator('#sample').boundingBox();
      const clip = { x: box.x - 16, y: box.y - 16, width: box.width + 32, height: box.height + 32 };
      const png = await page.screenshot({ clip });
      const result = await page.evaluate(async ({ source, fill }) => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const at = (x, y) => [...data.slice((y * canvas.width + x) * 4, (y * canvas.width + x) * 4 + 3)];
        const ink = ([r, g, b]) => r > g + 60 && b > g + 60;
        let leaks = 0, rows = 0, columns = 0;
        const expected = fill === 'solid' ? 255 : 166;
        function scan(length, point) {
          const hits = Array.from({ length }, (_, i) => i).filter(i => ink(at(...point(i))));
          if (hits.length < 2 || hits.at(-1) - hits[0] < 10) return false;
          for (let i = hits[0] + 2; i < hits.at(-1) - 2; i++) {
            const [r, g, b] = at(...point(i));
            // Ignore ink/antialiasing; uniform grey is the fill over black.
            if (Math.abs(r - g) < 3 && Math.abs(g - b) < 3 && Math.abs(r - expected) > 3) leaks++;
          }
          return true;
        }
        for (let y = 24; y < canvas.height - 24; y++) if (scan(canvas.width, x => [x, y])) rows++;
        for (let x = 24; x < canvas.width - 24; x++) if (scan(canvas.height, y => [x, y])) columns++;
        return { leaks, rows, columns, center: at(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2))[0], outside: at(1, 1) };
      }, { source: `data:image/png;base64,${png.toString('base64')}`, fill });
      const label = `${border}/${width}x${height}/${detail}/${fill}`;
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ clip, path: `${process.env.SCREENSHOT_DIR}/fill-${border}-${width}-${detail}-${fill}.png` });
      assert.equal(result.leaks, 0, `${label}: no canvas gaps or doubled translucent fill between ink edges`);
      assert(result.rows >= height - 16 && result.columns >= width - 16, `${label}: the outline bounds the full surface: ${JSON.stringify(result)}`);
      assert(Math.abs(result.center - (fill === 'solid' ? 255 : 166)) <= 2, `${label}: center uses the selected opacity`);
      assert.deepEqual(result.outside, [0, 0, 0], `${label}: paint stays inside the contour`);
      assert.equal(await page.locator('#sample').evaluate(el => getComputedStyle(el).clipPath), 'none', 'The interactive panel itself is not clipped');
    }
  } finally { await page.close(); }
});

for (const border of ['manga', 'brush']) test(`${border} footer and header bands reach the contour with live content`, async () => {
  const page = await open(`canvas&border=${border}&corners=square&marks=ticks`);
  try {
    // Keep real fields, table, footer and buttons. Empty surfaces cannot catch
    // a band that stops at the original rectangular content box.
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--color-foreground', 'rgb(255,0,255)');
      document.documentElement.style.setProperty('--color-muted', 'rgb(80,80,80)');
      document.querySelector('#sample').style.setProperty('--color-card', 'white');
    });
    async function assertFooter(panel, label) {
      const box = await panel.boundingBox();
      const clip = { x: Math.floor(box.x - 16), y: Math.floor(box.y - 16), width: Math.ceil(box.width + 32), height: Math.ceil(box.height + 32) };
      const png = await page.screenshot({ clip });
      const row = Math.floor(box.y + box.height - 5 - clip.y);
      const result = await page.evaluate(async ({ source, row }) => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const data = ctx.getImageData(0, row, canvas.width, 1).data;
        const rgb = x => [...data.slice(x * 4, x * 4 + 3)];
        const ink = ([r, g, b]) => r > g + 60 && b > g + 60;
        const hits = Array.from({ length: canvas.width }, (_, x) => x).filter(x => ink(rgb(x)));
        const gaps = [];
        for (let x = hits[0] + 2; x < hits.at(-1) - 2; x++) {
          const [r, g, b] = rgb(x);
          if (Math.abs(r - g) < 3 && Math.abs(g - b) < 3 && Math.abs(r - 80) > 3) gaps.push([x, r, g, b]);
        }
        return { gaps, inkCount: hits.length };
      }, { source: `data:image/png;base64,${png.toString('base64')}`, row });
      assert(result.inkCount >= 2, `${label}: the row crosses both ink edges`);
      assert.equal(result.gaps.length, 0, `${label}: footer color reaches both edges without a body-colored rim: ${JSON.stringify(result.gaps.slice(0, 8))}`);
      const button = panel.getByRole('button').last(); await button.focus();
      await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
      const buttonBox = await button.boundingBox();
      const footerBox = await panel.locator('.card-footer, .dialog-footer').boundingBox();
      assert(buttonBox.y - footerBox.y >= 4 && footerBox.y + footerBox.height - buttonBox.y - buttonBox.height >= 4, `${label}: padding contains the full focus ring`);
      assert.equal(await button.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
      await button.click();
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ clip, path: `${process.env.SCREENSHOT_DIR}/band-${label}.png` });
    }
    for (const theme of ['light', 'dark']) for (const detail of ['small', 'medium', 'large']) for (const fill of ['solid', 'translucent']) {
      await page.evaluate(({ theme, detail, fill }) => Object.assign(document.documentElement.dataset, { theme, frameDetail: detail, panelFill: fill }), { theme, detail, fill });
      await assertFooter(page.locator('#sample'), `${border}-${theme}-${detail}-${fill}`);
    }
    await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
    await assertFooter(page.getByRole('dialog'), `${border}-dialog`);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.evaluate(border => Object.assign(document.documentElement.dataset, { borderStyle: 'solid', outerBorderStyle: border, panelFill: 'solid' }), border);
    // Distinct header color makes an unpainted strip at either frame edge visible.
    await page.locator('#outer > .topbar').evaluate(el => el.style.setProperty('--color-background', 'rgb(80,80,80)'));
    const header = page.locator('#outer > .topbar'); const headerBox = await header.boundingBox();
    const clip = { x: Math.floor(headerBox.x - 16), y: Math.floor(headerBox.y - 16), width: Math.ceil(headerBox.width + 32), height: Math.ceil(headerBox.height + 32) };
    const png = await page.screenshot({ clip });
    const edges = await page.evaluate(async source => {
      const image = new Image(); image.src = source; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const y = canvas.height - 21;
      const data = ctx.getImageData(0, y, canvas.width, 1).data;
      const rgb = x => [...data.slice(x * 4, x * 4 + 3)];
      const ink = ([r, g, b]) => r > g + 60 && b > g + 60;
      const hits = Array.from({ length: canvas.width }, (_, x) => x).filter(x => ink(rgb(x)));
      return Array.from({ length: hits.at(-1) - hits[0] - 1 }, (_, i) => rgb(hits[0] + i + 1))
        .filter(([r, g, b]) => Math.abs(r - g) < 3 && Math.abs(g - b) < 3);
    }, `data:image/png;base64,${png.toString('base64')}`);
    assert(edges.length > 100, `${border}: the header row contains its fill`);
    for (const edge of edges) assert(edge.every(v => Math.abs(v - 80) <= 3), `${border}: header fill reaches outside the content box, got ${edge}`);
    await page.getByRole('button', { name: 'Header action' }).click();
    await page.locator('#outer > .page').evaluate(el => { el.style.minHeight = '0'; el.firstElementChild.style.marginBottom = '1500px'; el.scrollTop = 200; });
    assert.equal((await header.boundingBox()).y, headerBox.y, 'The header stays fixed while the page scrolls');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ clip, path: `${process.env.SCREENSHOT_DIR}/band-${border}-header.png` });
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`New frames retain the opaque log backing in ${theme}`, async () => {
  const page = await open(`theme=${theme}&corners=square&marks=none`);
  try {
    await page.locator('#log').evaluate(el => {
      el.replaceChildren();
      el.style.cssText = 'position:fixed;left:400px;top:100px;width:240px;height:180px';
    });
    async function center() {
      const png = await page.screenshot({ clip: await page.locator('#log').boundingBox() });
      return page.evaluate(async source => {
        const image = new Image(); image.src = source; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        return [...ctx.getImageData(120, 90, 1, 1).data];
      }, `data:image/png;base64,${png.toString('base64')}`);
    }
    const baseline = await center();
    assert(baseline[0] < 40, 'The log has a dark backing before appearance changes');
    for (const frame of ['pixel', 'manga', 'brush']) {
      await page.evaluate(frame => Object.assign(document.documentElement.dataset, {
        borderStyle: frame === 'pixel' ? 'solid' : frame, cornerStyle: frame === 'pixel' ? 'pixel' : 'square',
      }), frame);
      assert.deepEqual(await center(), baseline, `${frame} retains readable log backing`);
    }
  } finally { await page.close(); }
});

// Pixel checkboxes cut one step from each corner; switch tracks use the control
// steps and keep the notched thumb inside. Nothing paints a rectangular shadow.
for (const size of ['off', 'small', 'medium', 'large']) for (const theme of ['light', 'dark']) test(`Pixel checkboxes and switches step their corners at ${size} size in ${theme}`, async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 400 } });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?controls&corners=pixel&frameScope=all&size=${size}&theme=${theme}`); await page.locator('#controls').waitFor();
  const notch = { off: 0, small: 1, medium: 2, large: 3 }[size], radius = { off: 0, small: 3, medium: 6, large: 6 }[size];
  const shape = async (name, role, kind, line, fill) => {
    const control = page.getByRole(role, { name, exact: true });
    const box = await control.boundingBox();
    const clip = { x: Math.round(box.x) - 4, y: Math.round(box.y) - 4, width: Math.round(box.width) + 8, height: Math.round(box.height) + 8 };
    const png = await page.screenshot({ clip });
    return page.evaluate(async ({ source, kind, line, fill, notch, radius }) => {
      const image = new Image(); image.src = source; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const probe = document.createElement('span'); document.body.append(probe);
      const token = name => { probe.style.color = `var(${name})`; return getComputedStyle(probe).color.match(/\d+/g).slice(0, 3).map(Number); };
      const colors = { line: token(line), fill: token(fill), thumb: token(kind === 'on' ? '--color-primary-foreground' : '--color-white') }; probe.remove();
      const at = (x, y) => [...data.slice((y * w + x) * 4, (y * w + x) * 4 + 3)];
      const near = (c, t) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= 24;
      const bg = at(0, 0), x0 = 4, y0 = 4, x1 = w - 5, y1 = h - 5;
      // Mirror a point from the top-left corner into all four corners.
      const corners = (x, y) => [[x0 + x, y0 + y], [x1 - x, y0 + y], [x0 + x, y1 - y], [x1 - x, y1 - y]];
      const failures = [];
      const expect = (label, points, color) => { for (const [x, y] of points) if (!near(at(x, y), color)) failures.push(`${label} at ${x},${y}: ${at(x, y)}`); };
      if (kind === 'box') {
        for (let y = 0; y < notch; y++) for (let x = 0; x < notch; x++) expect('notch', corners(x, y), bg);
        expect('edge start', [...corners(notch, 0), ...corners(0, notch)], colors.line);
        expect('edge middle', [[(x0 + x1) >> 1, y0], [x0, (y0 + y1) >> 1]], colors.line);
        expect('fill', [[x0 + notch + 1, y0 + notch + 1]], colors.fill);
      } else {
        const step = radius / 3;
        expect('outer step', [...corners(radius - 1, 0), ...corners(0, radius - 1)], bg);
        expect('inner step', corners(step - 1, step - 1), bg);
        expect('track', [...corners(radius, 0), ...corners(0, radius), ...corners(step, step)], colors.fill);
        // The thumb never touches the background: the track surrounds it.
        let thumb = 0;
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          if (!near(at(x, y), colors.thumb)) continue;
          thumb++;
          if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) => near(at(nx, ny), bg))) failures.push(`thumb outside the track at ${x},${y}`);
        }
        if (thumb < 150) failures.push(`thumb has ${thumb} pixels`);
      }
      return failures.slice(0, 6);
    }, { source: `data:image/png;base64,${png.toString('base64')}`, kind, line, fill, notch, radius });
  };
  try {
    for (const [name, line, fill] of [['Unchecked', '--color-input', '--color-card'], ['Checked', '--color-primary', '--color-primary'], ['Mixed', '--color-primary', '--color-primary'], ['Native unchecked', '--color-input', '--color-card'], ['Native checked', '--color-primary', '--color-primary'], ['Native disabled', '--color-border', '--color-disabled-surface']]) {
      assert.deepEqual(await shape(name, 'checkbox', 'box', line, fill), [], `${name}: one step per corner`);
    }
    for (const [name, kind, fill] of [['Switch off', 'off', '--color-border-strong'], ['Switch on', 'on', '--color-primary'], ['Native switch off', 'off', '--color-border-strong'], ['Native switch on', 'on', '--color-primary']]) {
      assert.deepEqual(await shape(name, 'switch', kind, fill, fill), [], `${name}: stepped track around the thumb`);
    }
    const shadows = await page.locator('#controls').evaluate(root => [...root.querySelectorAll('[data-slot="checkbox"], [data-slot="switch-thumb"], .check input')].map(el => getComputedStyle(el).boxShadow));
    assert(shadows.every(shadow => shadow === 'none'), `No rectangular shadow: ${shadows}`);
    const checkbox = page.getByRole('checkbox', { name: 'Unchecked', exact: true });
    await checkbox.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    assert.deepEqual(await checkbox.evaluate(el => { const s = getComputedStyle(el); return [el.matches(':focus-visible'), s.outlineStyle, s.outlineWidth, s.outlineOffset]; }), [true, 'solid', '2px', '2px'], 'Keyboard focus keeps the offset ring');
  } finally { await page.close(); }
});

test('Forced colors keep the standard checkbox and switch shapes', async () => {
  const page = await browser.newPage({ viewport: { width: 1000, height: 400 }, forcedColors: 'active' });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  try {
    await page.goto(`${url}?controls&corners=pixel&frameScope=all&size=large`); await page.locator('#controls').waitFor();
    const paint = await page.locator('#controls').evaluate(root => [...root.querySelectorAll('[data-slot="checkbox"], [data-slot="switch"], .check input, .switch input')].map(el => getComputedStyle(el).backgroundImage));
    assert(paint.every(image => image === 'none'), `No Pixel layers in forced colors: ${paint}`);
    const pills = await page.locator('#controls').evaluate(root => [...root.querySelectorAll('[data-slot="switch"], [data-slot="switch-thumb"], .switch input')].map(el => [getComputedStyle(el).borderTopLeftRadius, getComputedStyle(el).maskImage]));
    assert(pills.every(([radius, mask]) => parseFloat(radius) > 9 && mask === 'none'), `Switches keep their pill shape in forced colors: ${pills}`);
  } finally { await page.close(); }
});
