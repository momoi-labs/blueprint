import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { appearanceCode } from '../apps/kiso-gallery/src/appearance-settings.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let server, browser, url;
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/appearance-frames.html`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server?.close(); });
async function open(query) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.locator('#sample').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '*, ::before, ::after { animation: none !important; transition: none !important; }' });
  return page;
}
const borders = ['solid', 'none', 'rail', 'dash', 'bevel', 'double', 'base', 'offset', 'manga', 'brush'];
const corners = ['square', 'rounded', 'asym', 'pixel'];
const sizes = ['off', 'small', 'medium', 'large'];
const marks = ['none', 'ticks', 'brackets', 'arcs', 'dots', 'diagonal'];
const shadows = ['none', 'hard', 'soft'];

test('all 5,760 combined appearance tuples render on Card and DiagramNode', async () => {
  const page = await open('shadowMatrix');
  try {
    const tuples = [];
    for (const theme of ['light', 'dark']) for (const borderStyle of borders) for (const cornerStyle of corners)
      for (const cornerSize of sizes) for (const cornerMarks of marks) for (const shadowStyle of shadows)
        tuples.push({ theme, borderStyle, cornerStyle, cornerSize, cornerMarks, shadowStyle });
    let checked = 0;
    for (let start = 0; start < tuples.length; start += 48) {
      const batch = tuples.slice(start, start + 48);
      await page.evaluate(async batch => {
        window.setShadowTuples(batch);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }, batch);
      const failures = await page.evaluate(batch => batch.flatMap((tuple, index) => {
        const scope = document.getElementById(`tuple-${index}`), errors = [];
        for (const el of [scope.querySelector('.card'), scope.querySelector('.diagram-node')]) {
          const s = getComputedStyle(el), before = getComputedStyle(el, '::before'), after = getComputedStyle(el, '::after');
          const layer = getComputedStyle(el.querySelector(':scope > .panel-shadow'));
          const child = getComputedStyle(el.querySelector(':scope > .panel-shadow > span > span'));
          const paint = getComputedStyle(el.querySelector(':scope > .panel-shadow > span'));
          const expressive = ['manga', 'brush'].includes(tuple.borderStyle);
          const shaped = tuple.cornerStyle === 'pixel' || expressive;
          const x = tuple.borderStyle === 'rail' ? -3 : tuple.borderStyle === 'base' ? 0 : 3;
          const y = tuple.borderStyle === 'rail' ? 0 : 3;
          const shadow = tuple.shadowStyle;
          const fail = message => errors.push({ tuple, slot: el.dataset.slot, message, shadow: s.boxShadow, filter: layer.filter, contour: child.clipPath });
          if (shadow === 'none' && s.boxShadow !== 'none') fail('None must remove panel elevation');
          if (shadow !== 'none' && !s.boxShadow.endsWith(`${x}px ${y}px ${shadow === 'soft' ? 8 : 0}px 0px`)) fail('Wrong projection geometry');
          if (shadow !== 'none' && s.boxShadow.includes(', color')) fail('Stacked projection');
          if (shadow !== 'none' && !shaped && !s.boxShadow.startsWith('color(srgb 0 0 0 /')) fail('Projection must stay neutral');
          if (layer.display !== (shadow === 'none' ? 'none' : 'block')) fail('Missing isolated layer');
          if (Number(paint.opacity) !== Number(shaped)) fail('Wrong contour activation');
          if (shaped && shadow !== 'none' && (child.clipPath === 'none' || layer.clipPath === 'none')) fail('Missing silhouette/source mask');
          const scale = { off: 0, small: .5, medium: 1, large: 1.5 }[tuple.cornerSize];
          const radius = expressive || tuple.cornerStyle === 'pixel' || tuple.cornerStyle === 'square' ? 0 : (tuple.cornerStyle === 'rounded' ? 16 : 12) * scale;
          if (parseFloat(s.borderTopLeftRadius) !== radius) fail('Corner geometry changed');
          if (s.borderTopStyle !== (tuple.borderStyle === 'none' ? 'none' : tuple.borderStyle === 'dash' ? 'dashed' : 'solid')) fail('Border choice changed');
          if (tuple.borderStyle === 'none' && after.content !== 'none') fail('Borderless marks revived');
          if (tuple.cornerMarks === 'none' && after.opacity !== '0') fail('Disabled marks revived');
          if (tuple.cornerMarks === 'arcs' && (expressive || tuple.cornerStyle === 'pixel') && after.opacity !== '0') fail('Incompatible arcs revived');
          if (tuple.cornerMarks === 'brackets' && tuple.borderStyle === 'brush' && after.opacity !== '0') fail('Incompatible brackets revived');
          if (before.pointerEvents !== 'none') fail('Decoration intercepts input');
          const input = el.querySelector('.input') ?? scope.querySelector('.input');
          const baseline = document.querySelector(`#tuple-${index - index % 3} .input`);
          if (getComputedStyle(input).boxShadow !== getComputedStyle(baseline).boxShadow) fail('Input acquired projection');
        }
        return errors;
      }), batch);
      assert.deepEqual(failures, [], `Batch ${start}`);
      checked += batch.length;
    }
    assert.equal(checked, 5760);
    console.log(`Verified ${checked} tuples on each of Card and DiagramNode (11,520 rendered panels).`);
  } finally { await page.close(); }
});

// Decode actual browser screenshots in its canvas. The contour mask describes
// where pixels may change, not whether a CSS variable happens to be set.
async function pixels(page, off, on, geometry, soft) {
  return page.evaluate(async ({ off, on, geometry, soft }) => {
    async function image(source) {
      const img = new Image(); img.src = `data:image/png;base64,${source}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      return { width: img.width, height: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
    }
    const a = await image(off), b = await image(on);
    const mask = document.createElement('canvas'); mask.width = a.width; mask.height = a.height;
    const ctx = mask.getContext('2d');
    const coord = (value, dimension) => [...value.matchAll(/([+-]?\s*\d+(?:\.\d+)?)(px|%)/g)]
      .reduce((sum, [, amount, unit]) => sum + Number(amount.replace(/\s/g, '')) * (unit === '%' ? dimension / 100 : 1), 0);
    const points = geometry.contour.slice(8, -1).split(',').map(point => {
      const values = point.trim().match(/calc\([^)]*\)|[-\d.]+(?:px|%)/g);
      return [coord(values[0], geometry.width) + geometry.x, coord(values[1], geometry.height) + geometry.y];
    });
    const path = new Path2D(); points.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y)); path.closePath();
    let insideChanges = 0, exteriorChanges = 0, unexpected = 0, maxInterior = 0, softReach = 0;
    const unexpectedSamples = [];
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      const diff = Math.max(...[0, 1, 2].map(channel => Math.abs(a.data[i + channel] - b.data[i + channel])));
      const inside = ctx.isPointInPath(path, x + .5, y + .5);
      const deep = inside && [[-3, 0], [3, 0], [0, -3], [0, 3]].every(([dx, dy]) => ctx.isPointInPath(path, x + .5 + dx, y + .5 + dy));
      if (deep) { maxInterior = Math.max(maxInterior, diff); if (diff > 1) insideChanges++; }
      if (!inside && diff > 1) {
        exteriorChanges++;
        const inCast = ctx.isPointInPath(path, x + .5 - geometry.dx, y + .5 - geometry.dy);
        const nearCast = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => ctx.isPointInPath(path, x + .5 - geometry.dx + dx, y + .5 - geometry.dy + dy));
        // Chromium can rerasterize the original clipped border when a paint
        // layer appears. Ignore only its one-pixel antialias fringe, using the
        // same tolerance as the translated contour. Shadow-only screenshots
        // confirmed that those pixels belong to the border, not the cast.
        const nearOriginal = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => ctx.isPointInPath(path, x + .5 + dx, y + .5 + dy));
        if (!soft && !inCast && !nearCast && !nearOriginal) { unexpected++; if (unexpectedSamples.length < 5) unexpectedSamples.push([x, y, diff]); }
        if (soft && !inCast && !nearCast && !nearOriginal) softReach++;
      }
    }
    return { insideChanges, exteriorChanges, unexpected, maxInterior, softReach, ...(unexpected ? { unexpectedSamples, points } : {}) };
  }, { off, on, geometry, soft });
}

for (const theme of ['light', 'dark']) test(`rendered silhouette shadows preserve translucent interiors in ${theme}`, async () => {
  const page = await open(`shadowPaint&theme=${theme}&marks=none`);
  try {
    let cases = 0;
    for (const fill of ['solid', 'translucent']) for (const contour of ['pixel', 'manga', 'brush']) for (const size of ['small', 'medium', 'large']) {
      await page.evaluate(({ fill, contour, size }) => Object.assign(document.documentElement.dataset, {
        panelFill: fill, borderStyle: contour === 'pixel' ? 'solid' : contour, cornerStyle: contour === 'pixel' ? 'pixel' : 'square', cornerSize: size, frameDetail: size,
      }), { fill, contour, size });
      for (const selector of ['#paint-card', '.diagram-node']) {
        const el = page.locator(selector);
        await el.scrollIntoViewIfNeeded();
        const box = await el.boundingBox();
        const clip = { x: Math.floor(box.x - 28), y: Math.floor(box.y - 28), width: Math.ceil(box.width + 56), height: Math.ceil(box.height + 56) };
        for (const shadow of ['hard', 'soft']) {
          await page.evaluate(() => { document.documentElement.dataset.shadowStyle = 'none'; });
          await el.evaluate(async el => {
            el.dataset.shadowStyle = 'none';
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          });
          const off = (await page.screenshot({ clip })).toString('base64');
          await el.evaluate(async (el, shadow) => {
            el.dataset.shadowStyle = shadow;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          }, shadow);
          const on = (await page.screenshot({ clip })).toString('base64');
          const geometry = await el.locator(':scope > .panel-shadow > span > span').evaluate((child, clip) => {
            const rect = child.getBoundingClientRect(), style = getComputedStyle(child);
            return { contour: style.clipPath, width: rect.width, height: rect.height, x: rect.x - clip.x - 3, y: rect.y - clip.y - 3, dx: 3, dy: 3 };
          }, clip);
          const result = await pixels(page, off, on, geometry, shadow === 'soft');
          const label = `${theme}/${fill}/${contour}/${size}/${selector}/${shadow}: ${JSON.stringify(result)}`;
          assert.equal(result.insideChanges, 0, `Interior or text/control changed: ${label}`);
          assert(result.exteriorChanges > 100, `No visible exterior cast: ${label}`);
          assert.equal(result.unexpected, 0, `Cast does not follow silhouette: ${label}`);
          if (shadow === 'soft') assert(result.softReach > 50, `Missing blur: ${label}`);
          cases++;
        }
      }
    }
    console.log(`${theme}: ${cases} raster comparisons, including source-footprint removal and blur.`);
  } finally { await page.close(); }
});

test('local border directions, nested shadow overrides and controls remain independent', async () => {
  const page = await open('casts&corners=rounded&marks=none&frameScope=all');
  try {
    await page.evaluate(() => Object.assign(document.documentElement.dataset, { shadowStyle: 'soft', borderStyle: 'rail' }));
    const node = page.locator('.diagram-node');
    await node.evaluate(el => { el.dataset.borderStyle = 'dash'; el.dataset.status = 'failed'; });
    assert.match(await node.evaluate(el => getComputedStyle(el).boxShadow), /3px 3px 8px 0px$/);
    assert.match(await node.evaluate(el => getComputedStyle(el).borderColor), /rgb\(/);
    const tiles = page.locator('.radio-item');
    const before = await tiles.evaluateAll(items => items.map(el => getComputedStyle(el).boxShadow));
    await page.evaluate(() => { document.documentElement.dataset.shadowStyle = 'none'; });
    assert.deepEqual(await tiles.evaluateAll(items => items.map(el => getComputedStyle(el).boxShadow)), before, 'Panel setting must not change tiles');
    await node.evaluate(el => { el.dataset.shadowStyle = 'hard'; });
    assert.match(await node.evaluate(el => getComputedStyle(el).boxShadow), /3px 3px 0px 0px$/);
    await node.evaluate(el => { el.dataset.shadowStyle = 'auto'; });
    assert.notEqual(await node.evaluate(el => getComputedStyle(el).boxShadow), 'none', 'auto restores legacy resting elevation');
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await node.evaluate(el => getComputedStyle(el).boxShadow), 'none');
  } finally { await page.close(); }
});

test('outer shadow overrides do not leak into nested panels or dialogs', async () => {
  const page = await open('canvas&corners=rounded&marks=none&appShellOuter=full');
  try {
    for (const main of shadows) for (const outer of ['inherit', ...shadows]) for (const border of ['solid', 'rail', 'base']) {
      await page.evaluate(({ main, outer, border }) => Object.assign(document.documentElement.dataset, { shadowStyle: main, outerShadowStyle: outer, outerBorderStyle: border }), { main, outer, border });
      const effective = outer === 'inherit' ? main : outer;
      const x = border === 'rail' ? -3 : border === 'base' ? 0 : 3, y = border === 'rail' ? 0 : 3;
      const outerPaint = await page.locator('#outer').evaluate(el => getComputedStyle(el).boxShadow);
      assert(effective === 'none' ? outerPaint === 'none' : outerPaint.endsWith(`${x}px ${y}px ${effective === 'soft' ? 8 : 0}px 0px`), `${main}/${outer}/${border}: ${outerPaint}`);
      const inner = await page.locator('#sample').evaluate(el => getComputedStyle(el).boxShadow);
      assert(main === 'none' ? inner === 'none' : inner.endsWith(`3px 3px ${main === 'soft' ? 8 : 0}px 0px`), `${main}/${outer}/${border}: inner ${inner}`);
    }
    await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
    assert.match(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).boxShadow), /3px 3px 8px 0px$/);
  } finally { await page.close(); }
});

test('generated HTML and JavaScript render with shipped CSS and cross the phone breakpoint', async () => {
  const init = readFileSync(new URL('../apps/kiso-gallery/public/appearance-init.js', import.meta.url), 'utf8');
  const window = {};
  runInNewContext(init, { window, document: { documentElement: { dataset: {} } }, localStorage: { getItem: () => null } });
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  try {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    for (const theme of ['light', 'dark']) for (const shadowStyle of shadows) for (const phoneShadowStyle of ['inherit', ...shadows]) {
      const settings = { ...window.kisoAppearance.defaults, theme, shadowStyle, phoneShadowStyle, cornerStyle: 'square', borderStyle: 'rail', cornerMarks: 'none' };
      const code = appearanceCode(settings);
      const html = code.html.replace('>\n  <div', '>\n<head><link rel="stylesheet" href="/packages/kiso-react/dist/styles.css"></head><body>\n  <div')
        .replace('<!-- Your panel content -->', 'Generated panel')
        .replace('</html>', '<script>' + code.javascript + '</script></body></html>');
      await page.route('**/generated-shadow.html', route => route.fulfill({ contentType: 'text/html', body: html }));
      await page.goto(new URL('/generated-shadow.html', url).href);
      await page.locator('.card').waitFor();
      for (const width of [700, 699, 390, 1440]) {
        await page.setViewportSize({ width, height: 700 });
        const expected = width < 700 && phoneShadowStyle !== 'inherit' ? phoneShadowStyle : shadowStyle;
        await page.waitForFunction(expected => document.documentElement.dataset.shadowStyle === expected, expected);
        const actual = await page.locator('.card').evaluate(el => getComputedStyle(el).boxShadow);
        assert(expected === 'none' ? actual === 'none' : actual.endsWith(`-3px 0px ${expected === 'soft' ? 8 : 0}px 0px`), `${theme}/${shadowStyle}/${phoneShadowStyle}/${width}: ${actual}`);
      }
      // Without the script, HTML alone must keep the desktop configuration.
      await page.setViewportSize({ width: 700, height: 700 });
      await page.route('**/html-only.html', route => route.fulfill({ contentType: 'text/html', body: html.replace('<script>' + code.javascript + '</script>', '') }));
      await page.goto(new URL('/html-only.html', url).href);
      assert.equal(await page.locator('html').getAttribute('data-shadow-style'), shadowStyle);
      assert.equal(await page.locator('.panel-shadow > span > span').count(), 1);
      const actual = await page.locator('.card').evaluate(el => getComputedStyle(el).boxShadow);
      assert(shadowStyle === 'none' ? actual === 'none' : actual.endsWith(`-3px 0px ${shadowStyle === 'soft' ? 8 : 0}px 0px`));
      await page.unroute('**/generated-shadow.html');
      await page.unroute('**/html-only.html');
    }
  } finally { await page.close(); }
});

test('all panel families keep focus, contents and controls while shadow modes change', async () => {
  const page = await open('corners=pixel&marks=none');
  try {
    const input = page.getByLabel('RAM', { exact: true });
    await input.focus();
    for (const shadow of shadows) {
      await page.evaluate(shadow => { document.documentElement.dataset.shadowStyle = shadow; }, shadow);
      assert(await input.evaluate(el => el === document.activeElement));
      assert.equal(await input.inputValue(), '4');
      for (const selector of ['#sample', '.table-wrap', '#code', '#log', '#palette', '#inset']) {
        assert.equal(await page.locator(selector).locator(':scope > .panel-shadow').count(), 1, selector);
        const actual = await page.locator(selector).evaluate(el => getComputedStyle(el).boxShadow);
        assert(shadow === 'none' ? actual === 'none' : actual.endsWith(`3px 3px ${shadow === 'soft' ? 8 : 0}px 0px`), `${selector}: ${actual}`);
      }
      await page.locator('#sample').evaluate(el => el.classList.add('card-interactive'));
      await page.locator('#sample').hover();
      assert(shadow !== 'none' || await page.locator('#sample').evaluate(el => getComputedStyle(el).boxShadow) === 'none');
    }
    await page.getByRole('button', { name: 'Open drawer', exact: true }).click();
    const drawer = page.getByRole('dialog');
    assert.match(await drawer.evaluate(el => getComputedStyle(el).boxShadow), /3px 3px 8px 0px$/);
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });
  } finally { await page.close(); }
});

test('outer None and automatic phone modes hide silhouette paint', async () => {
  const page = await open('canvas&corners=pixel&marks=none&shadowStyle=hard&appShellOuter=none');
  try {
    const layer = page.locator('#outer > .panel-shadow');
    assert.equal(await layer.evaluate(el => getComputedStyle(el).display), 'none');
    await page.evaluate(() => { document.documentElement.dataset.appShellOuter = 'auto'; });
    await page.setViewportSize({ width: 699, height: 900 });
    assert.equal(await layer.evaluate(el => getComputedStyle(el).display), 'none');
    await page.setViewportSize({ width: 700, height: 900 });
    assert.equal(await layer.evaluate(el => getComputedStyle(el).display), 'block');
  } finally { await page.close(); }
});
