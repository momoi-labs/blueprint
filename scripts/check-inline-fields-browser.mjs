import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/inline-fields.html`; browser = await chromium.launch(); if (process.env.SCREENSHOT_DIR) await mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', options = {}) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, ...options });
  page.setDefaultTimeout(5000); await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`); await page.getByRole('spinbutton', { name: 'RAM', exact: true }).waitFor();
  return page;
}
for (const theme of ['light', 'dark']) for (const [size, height] of [['sm', 32], ['md', 36], ['lg', 40]]) test(`Inline frame sizing and descriptions for ${size}/${theme}`, async () => {
  const page = await open(`theme=${theme}&size=${size}`);
  try {
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    const select = page.getByRole('combobox', { name: 'OS', exact: true });
    for (const control of [ram, select]) {
      assert.equal(await control.evaluate(el => el.parentElement.getBoundingClientRect().height), height);
      assert.equal(await control.evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
    }
    for (const role of ['textbox', 'combobox']) {
      const standalone = page.getByRole(role, { name: role === 'textbox' ? 'Standalone input' : 'Standalone select' });
      assert.equal((await standalone.boundingBox()).height, height);
      assert.equal(await standalone.evaluate(el => getComputedStyle(el).borderTopWidth), '1px');
    }
    await page.locator('label').filter({ hasText: /^RAM$/ }).click();
    assert(await ram.evaluate(el => el === document.activeElement));
    assert.equal(await ram.evaluate(el => getComputedStyle(el.parentElement).outlineWidth), '2px');
    assert.equal(await ram.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    const described = await ram.evaluate(el => el.getAttribute('aria-describedby').split(' ').map(id => document.getElementById(id).textContent));
    assert.deepEqual(described, ['Total available memory.', 'GB']);
    const native = page.getByRole('textbox', { name: 'Native size', exact: true });
    assert.equal(await native.getAttribute('size'), '6');
    assert.equal(await native.getAttribute('data-control-size'), 'lg');
    const ids = (await native.getAttribute('aria-describedby')).split(' ');
    assert.equal(ids.filter(id => id === 'legacy-hint').length, 1);
    assert.equal(new Set(ids).size, ids.length);
    await page.getByRole('button', { name: 'Toggle error' }).click();
    assert.equal(await ram.getAttribute('aria-invalid'), 'true');
    assert(await ram.evaluate(el => el.getAttribute('aria-describedby').split(' ').some(id => document.getElementById(id).textContent.includes('at least 1 GB'))));
    await page.getByRole('button', { name: 'Toggle disabled' }).click();
    assert(await ram.isDisabled());
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/fields-${size}-${theme}.png`, fullPage: true });
  } finally { await page.close(); }
});
test('Controlled fields retain data and Select closes to its trigger without submitting', async () => {
  const page = await open();
  try {
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    await ram.fill('16');
    assert.equal(await page.getByRole('status', { name: 'Field changes' }).textContent(), '1');
    const os = page.getByRole('combobox', { name: 'OS', exact: true });
    await os.focus(); await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Windows', exact: true }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'combobox');
    assert(await os.evaluate(el => el === document.activeElement));
    assert.equal(await os.textContent(), 'Windows');
    assert.equal(await page.getByRole('status', { name: 'Field changes' }).textContent(), '2');
    await page.keyboard.press('Enter');
    await page.getByRole('listbox').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'combobox');
    assert(await os.evaluate(el => el === document.activeElement));
    assert.equal(await ram.inputValue(), '16');
    assert.equal(await page.getByRole('status', { name: 'Submissions' }).textContent(), '0');
  } finally { await page.close(); }
});
for (const width of [320, 390]) test(`Inline fields wrap without losing touch targets at ${width}px`, async () => {
  const page = await open('size=sm&long', { viewport: { width, height: 900 }, hasTouch: true });
  try {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const control of [page.getByRole('spinbutton', { name: 'RAM', exact: true }), page.getByRole('combobox', { name: 'OS', exact: true })]) {
      const rect = await control.boundingBox(); assert(rect.height >= 44 && rect.width >= 44);
      assert(await control.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    }
    const value = page.getByRole('combobox', { name: 'OS', exact: true }).locator('[data-slot="select-value"]');
    assert(await value.evaluate(el => {
      const trigger = el.parentElement;
      const end = trigger.getBoundingClientRect().right - parseFloat(getComputedStyle(trigger).paddingRight);
      return el.scrollWidth > el.clientWidth && el.getBoundingClientRect().right <= end && getComputedStyle(el).textOverflow === 'ellipsis';
    }), 'Long selected values stay outside the chevron padding');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/fields-${width}.png`, fullPage: true });
  } finally { await page.close(); }
});

// Compare a frame at rest and under keyboard focus. Pixel corners must carry
// the ring in the inner 2px of their stepped contour; other corners must keep
// it on the edge, with nothing painted outside the frame.
async function focusRing(page, control, frameOf, { pixel, grip }) {
  await control.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur());
  const box = await (await control.evaluateHandle(frameOf)).boundingBox();
  const clip = { x: Math.floor(box.x) - 8, y: Math.floor(box.y) - 8, width: Math.ceil(box.width) + 16, height: Math.ceil(box.height) + 16 };
  const rest = await page.screenshot({ clip });
  await control.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  assert(await control.evaluate(el => el === document.activeElement));
  const focused = await page.screenshot({ clip });
  const edges = { l: Math.round(box.x - clip.x), t: Math.round(box.y - clip.y), r: Math.round(box.x + box.width - clip.x), b: Math.round(box.y + box.height - clip.y) };
  return page.evaluate(async ({ sources, edges, pixel, grip }) => {
    const load = async source => { const image = new Image(); image.src = source; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); return ctx.getImageData(0, 0, canvas.width, canvas.height); };
    const [rest, focused] = await Promise.all(sources.map(load));
    const probe = document.createElement('span'); document.body.append(probe);
    const token = name => { probe.style.color = `var(${name})`; return getComputedStyle(probe).color.match(/\d+/g).slice(0, 3).map(Number); };
    const colors = { focus: token('--color-focus'), danger: token('--color-danger'), line: token('--color-input') }; probe.remove();
    const { width: w, height: h } = rest;
    const at = (image, x, y) => [...image.data.slice((y * w + x) * 4, (y * w + x) * 4 + 3)];
    const near = (c, t, tolerance = 40) => Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) <= tolerance;
    const ring = ['focus', 'danger'].find(name => near(at(focused, Math.floor((edges.l + edges.r) / 2), edges.t), colors[name]));
    const isRing = (x, y) => ring !== undefined && near(at(focused, x, y), colors[ring]);
    // Outside the frame, only count ring colour painted over the background.
    // Nearby text, such as a danger message, can re-rasterize between shots.
    const edge = [];
    for (let x = 0; x < w; x++) edge.push(at(rest, x, 0), at(rest, x, h - 1));
    for (let y = 0; y < h; y++) edge.push(at(rest, 0, y), at(rest, w - 1, y));
    const counts = new Map(edge.map(c => [c.join(), 0]));
    for (const c of edge) counts.set(c.join(), counts.get(c.join()) + 1);
    const background = [...counts].sort((p, q) => q[1] - p[1])[0][0].split(',').map(Number);
    const added = (x, y) => isRing(x, y) && near(at(rest, x, y), background, 12);
    const mx = Math.floor((edges.l + edges.r) / 2), my = Math.floor((edges.t + edges.b) / 2);
    const outside = [];
    for (let d = 1; d <= 4; d++) for (const [x, y] of [[mx, edges.t - d], [mx, edges.b - 1 + d], [edges.l - d, my], [edges.r - 1 + d, my]]) if (added(x, y)) outside.push([x, y]);
    const depth = (d) => [isRing(mx, edges.t + d), isRing(mx, edges.b - 1 - d), isRing(edges.l + d, my), isRing(edges.r - 1 - d, my)];
    const result = { ring, outside, edge: [depth(0), depth(1), depth(2)] };
    if (!pixel) return result;
    // The rest contour is a closed line: flood the outside up to it, then
    // expect the ring on every shape pixel within 2px of the outside. The
    // native resize grip of a textarea covers its last corner, so skip it.
    const skip = (x, y) => grip && x >= edges.r - 16 && x < edges.r && y >= edges.b - 16 && y < edges.b;
    // Start from everything beyond a 2px band around the frame, so nearby text,
    // such as a danger message, never reads as part of the contour.
    const band = (x, y) => x >= edges.l - 2 && x < edges.r + 2 && y >= edges.t - 2 && y < edges.b + 2;
    const out = new Uint8Array(w * h); const stack = [];
    for (let p = 0; p < w * h; p++) if (!band(p % w, (p - p % w) / w)) { out[p] = 1; stack.push(p); }
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p - x) / w;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || out[ny * w + nx] || skip(nx, ny) || [colors.line, colors.danger].some(line => near(at(rest, nx, ny), line, 12))) continue;
        out[ny * w + nx] = 1; stack.push(ny * w + nx);
      }
    }
    const distance = new Uint8Array(w * h).fill(255); let frontier = [];
    for (let p = 0; p < w * h; p++) if (out[p]) { distance[p] = 0; frontier.push(p); }
    for (let d = 1; d <= 4; d++) {
      const next = [];
      for (const p of frontier) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const x = p % w + dx, y = (p - p % w) / w + dy;
        if (x < 0 || y < 0 || x >= w || y >= h || distance[y * w + x] !== 255) continue;
        distance[y * w + x] = d; next.push(y * w + x);
      }
      frontier = next;
    }
    // Compare up to 4px inside, clear of the value and its selection.
    result.contour = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const d = distance[y * w + x];
      if (skip(x, y) || d > 4) continue;
      if (d === 0 ? added(x, y) : (d <= 2) !== isRing(x, y)) result.contour.push([x, y]);
    }
    result.flooded = out.reduce((n, v) => n + v, 0) < w * h / 2;
    result.corners = [[edges.l, edges.t], [edges.r - 1, edges.t], [edges.l, edges.b - 1], [edges.r - 1, edges.b - 1]].map(([x, y]) => isRing(x, y));
    return result;
  }, { sources: [rest, focused].map(png => `data:image/png;base64,${png.toString('base64')}`), edges, pixel, grip });
}

for (const corners of ['rounded', 'square', 'pixel-small', 'pixel-large']) for (const theme of ['light', 'dark']) test(`Fields draw their focus ring on their own edge with ${corners} corners in ${theme}`, async () => {
  const [cornerStyle, cornerSize = 'medium'] = corners.split('-');
  const pixel = cornerStyle === 'pixel';
  const page = await open(`theme=${theme}&border=solid&cornerStyle=${cornerStyle}&cornerSize=${cornerSize}&frameScope=all`);
  try {
    const self = el => el, frame = el => el.closest('.field-control');
    const fields = [
      ['Standalone input', page.getByRole('textbox', { name: 'Standalone input', exact: true }), self],
      ['Notes', page.getByRole('textbox', { name: 'Notes', exact: true }), self, true],
      ['Standalone select', page.getByRole('combobox', { name: 'Standalone select', exact: true }), self],
      ['RAM', page.getByRole('spinbutton', { name: 'RAM', exact: true }), frame],
      ['Tags', page.getByRole('combobox', { name: 'Tags', exact: true }).or(page.getByRole('textbox', { name: 'Tags', exact: true })), el => el.closest('.chip-input-box')],
    ];
    const check = async (name, control, frameOf, grip, ring) => {
      const result = await focusRing(page, control, frameOf, { pixel, grip });
      assert.equal(result.ring, ring, `${name}: the frame's edge carries the ${ring} ring`);
      assert.deepEqual(result.outside, [], `${name}: nothing is painted outside the frame`);
      assert.deepEqual(result.edge, [[true, true, true, true], [true, true, true, true], [false, false, false, false]], `${name}: the ring covers the outer 2px of each edge`);
      if (pixel) {
        assert(result.flooded, `${name}: the rest contour is closed`);
        assert.deepEqual(result.corners, [false, false, false, false], `${name}: focus keeps the stepped corners`);
        assert.deepEqual(result.contour.slice(0, 8), [], `${name}: the ring follows the stepped contour without gaps or square corners: ${JSON.stringify(result.contour.slice(0, 8))}`);
      }
    };
    for (const [name, control, frameOf, grip] of fields) await check(name, control, frameOf, grip, 'focus');
    await page.getByRole('button', { name: 'Toggle error' }).click();
    for (const [name, control, frameOf, grip] of fields.filter(([name]) => ['Notes', 'RAM', 'Tags'].includes(name))) await check(`${name} (invalid)`, control, frameOf, grip, 'danger');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/field-focus-${corners}-${theme}.png`, fullPage: true });
  } finally { await page.close(); }
});
