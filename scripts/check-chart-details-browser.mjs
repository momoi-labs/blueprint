import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser, url;
before(async () => { await server.listen(); url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/chart-details.html`; browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server.close(); });
async function open(query = '', viewport = { width: 1000, height: 800 }) {
  const page = await browser.newPage({ viewport, hasTouch: viewport.width < 500 });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.locator('main').waitFor();
  return page;
}
const size = page => page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
for (const width of [320, 1000]) for (const bottom of [false, true]) test(`DetailSelect overlays without page growth at ${width}px, ${bottom ? 'bottom' : 'top'}`, async () => {
  const page = await open(`mode=select${bottom ? '&bottom' : ''}`, { width, height: 700 });
  try {
    const baseline = await size(page);
    await page.getByRole('button', { name: 'Definition Option 0' }).click();
    const panel = page.getByRole('dialog', { name: 'Definition: options' });
    const bounds = await panel.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 701, 'Panel stays inside the viewport');
    assert.deepEqual(await size(page), baseline, 'Opening does not grow the page');
    assert(await panel.evaluate(e => e.scrollHeight > e.clientHeight), 'Long content has internal scroll');
    const inset = await panel.evaluate(e => {
      const style = getComputedStyle(e), panel = e.getBoundingClientRect(), first = e.querySelector('.detail-select-option').getBoundingClientRect();
      return { padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
        top: first.top - panel.top - parseFloat(style.borderTopWidth),
        left: first.left - panel.left - parseFloat(style.borderLeftWidth),
        width: first.width - e.clientWidth };
    });
    assert.deepEqual(inset.padding, ['0px', '0px', '0px', '0px'], 'Panel has no padding around panes');
    assert([inset.top, inset.left, inset.width].every(value => Math.abs(value) < 0.01), 'Panes fill the scrollable panel from edge to edge');
    const gaps = await panel.locator('.detail-select-option').evaluateAll(elements => {
      const rows = elements.map(e => e.getBoundingClientRect());
      return rows.slice(1).map((row, index) => row.top - rows[index].bottom);
    });
    assert(gaps.every(gap => Math.abs(gap) < 0.01), 'Option panes meet at their separators without blank gaps');
    await panel.getByRole('button', { name: 'Option 7', exact: true }).click();
    assert.equal(await panel.count(), 0);
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '7');
    assert.deepEqual(await size(page), baseline);
  } finally { await page.close(); }
});
for (const width of [320, 1000]) test(`DetailSelect keyboard focus fills the whole pane at ${width}px`, async () => {
  const page = await open('mode=select', { width, height: 700 });
  try {
    await page.getByRole('button', { name: 'Definition Option 0' }).focus();
    await page.keyboard.press('Enter');
    const panel = page.getByRole('dialog', { name: 'Definition: options' });
    const first = panel.getByRole('button', { name: 'Option 0', exact: true });
    await page.waitForFunction(e => e === document.activeElement, await first.elementHandle());
    const focusPaint = () => page.evaluate(() => {
      const button = document.activeElement, row = button.closest('.detail-select-option');
      const rowStyle = getComputedStyle(row), buttonStyle = getComputedStyle(button);
      return { rowOutline: rowStyle.outlineStyle, fill: rowStyle.backgroundColor, buttonOutline: buttonStyle.outlineStyle };
    });
    for (const key of [null, 'End']) {
      if (key) await page.keyboard.press(key);
      const paint = await focusPaint();
      assert.equal(paint.rowOutline, 'none', 'Focus does not add a pane frame');
      assert.notEqual(paint.fill, 'rgba(0, 0, 0, 0)', 'Focus fills the whole pane');
      assert.equal(paint.buttonOutline, 'none', 'Title does not have a separate outline');
    }
    await page.keyboard.press('Tab');
    const link = panel.getByRole('link', { name: 'Guide 7' });
    assert(await link.evaluate(e => e === document.activeElement));
    const paint = await link.evaluate(e => ({ linkOutline: getComputedStyle(e).outlineStyle,
      rowOutline: getComputedStyle(e.closest('.detail-select-option')).outlineStyle }));
    assert.equal(paint.linkOutline, 'solid', 'Links retain their own focus indicator');
    assert.equal(paint.rowOutline, 'none');
  } finally { await page.close(); }
});
test('DetailSelect preserves selection fill on opening with thin separators across appearances', async () => {
  const page = await open('mode=select');
  try {
    for (const [corner, border] of [['square', 'solid'], ['round', 'double'], ['pixel', 'solid'], ['pixel', 'manga'], ['pixel', 'brush']]) {
      await page.evaluate(([corner, border]) => Object.assign(document.documentElement.dataset, { cornerStyle: corner, borderStyle: border }), [corner, border]);
      const trigger = page.locator('.detail-select-trigger');
      await trigger.click();
      const first = page.getByRole('dialog').getByRole('button', { name: 'Option 0', exact: true });
      await first.waitFor();
      const paint = () => first.evaluate(e => {
        const row = e.closest('.detail-select-option'), s = getComputedStyle(row);
        return { fill: s.backgroundColor, selected: row.dataset.selected, pressed: e.getAttribute('aria-pressed'),
          checkmarks: e.querySelectorAll('svg').length, clip: s.clipPath, radius: s.borderRadius,
          border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth], outline: s.outlineStyle };
      });
      const initial = await paint();
      assert.equal(initial.selected, 'true');
      assert.equal(initial.pressed, 'true');
      assert.equal(initial.checkmarks, 1, 'Current selection is marked immediately on opening');
      assert.notEqual(initial.fill, 'rgba(0, 0, 0, 0)');
      assert.deepEqual(initial.border, ['0px', '0px', '1px', '0px'], `${corner}/${border}: only a thin separator between options`);
      assert.equal(initial.radius, '0px');
      assert.equal(initial.clip, 'none', 'The outer panel owns the contour');
      await page.waitForFunction(e => e === document.activeElement, await first.elementHandle());
      await page.keyboard.press('End'); await page.keyboard.press('Home');
      const keyboard = await paint();
      assert.equal(keyboard.fill, initial.fill, 'Pointer opening and keyboard selection use the same full fill');
      assert.equal(keyboard.outline, 'none', 'Keyboard selection does not add a frame');
      await page.emulateMedia({ forcedColors: 'active' });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const fallback = await first.evaluate(e => {
        const s = getComputedStyle(e.closest('.detail-select-option'));
        return { outline: s.outlineStyle, color: s.outlineColor };
      });
      assert.equal(fallback.outline, 'solid');
      assert.notEqual(fallback.color, 'rgba(0, 0, 0, 0)', 'Forced colors retain visible focus');
      await page.emulateMedia({ forcedColors: 'none' });
      await page.keyboard.press('Escape');
      await page.waitForFunction(e => e === document.activeElement, await trigger.elementHandle());
    }
  } finally { await page.close(); }
});
for (const openingKey of ['ArrowDown', 'ArrowUp']) test(`DetailSelect opens with ${openingKey} and selects while navigating`, async () => {
  const page = await open('mode=select');
  try {
    const trigger = page.getByRole('button', { name: 'Definition Option 0' });
    await trigger.focus(); await page.keyboard.press(openingKey);
    const panel = page.getByRole('dialog', { name: 'Definition: options' });
    await panel.waitFor();
    const selected = panel.getByRole('button', { name: 'Option 0', exact: true });
    await page.waitForFunction(e => e === document.activeElement, await selected.elementHandle());
    await page.keyboard.press('ArrowDown');
    assert(await panel.getByRole('button', { name: 'Option 2', exact: true }).evaluate(e => e === document.activeElement));
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '2');
    assert.equal(await panel.getByRole('button', { name: 'Option 2', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('ArrowUp');
    assert(await selected.evaluate(e => e === document.activeElement));
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '0');
    assert.equal(await page.getByRole('status', { name: 'Changes' }).textContent(), '2');
    assert(await panel.isVisible(), 'Arrow selection keeps the panel open');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    const updated = page.getByRole('button', { name: 'Definition Option 2' });
    await updated.waitFor();
    assert.equal(await panel.count(), 0);
    await page.waitForFunction(e => e === document.activeElement, await updated.elementHandle());
  } finally { await page.close(); }
});
test('DetailSelect keyboard, rich links, disabled options and controlled selection', async () => {
  const page = await open('mode=select');
  try {
    const trigger = page.getByRole('button', { name: 'Definition Option 0' });
    await trigger.focus(); await page.keyboard.press('Enter');
    const panel = page.getByRole('dialog');
    assert(await panel.getByRole('button', { name: 'Option 0', exact: true }).evaluate(e => e === document.activeElement));
    await page.keyboard.press('Tab');
    assert(await panel.getByRole('link', { name: 'Guide 0' }).evaluate(e => e === document.activeElement));
    await page.keyboard.press('Enter');
    assert.equal(await page.getByRole('status', { name: 'Links' }).textContent(), '1');
    assert.equal(await page.getByRole('status', { name: 'Changes' }).textContent(), '0');
    assert(await panel.isVisible());
    const first = panel.getByRole('button', { name: 'Option 0', exact: true });
    await first.focus(); await page.keyboard.press('ArrowDown');
    assert(await panel.getByRole('button', { name: 'Option 2', exact: true }).evaluate(e => e === document.activeElement), 'Arrows skip disabled options');
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '2', 'Arrows select immediately');
    await page.keyboard.press('End');
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '7', 'End selects the last enabled option');
    await page.keyboard.press('Home');
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '0');
    assert(await first.evaluate(e => e === document.activeElement));
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space');
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '2');
    assert.equal(await page.getByRole('status', { name: 'Changes' }).textContent(), '4');
    const updated = page.getByRole('button', { name: 'Definition Option 2' });
    await page.waitForFunction(e => e === document.activeElement, await updated.elementHandle());
    await updated.click(); await page.keyboard.press('Escape');
    await page.waitForFunction(e => e === document.activeElement, await updated.elementHandle());
    await updated.click();
    await panel.getByRole('button', { name: 'Option 2', exact: true }).click();
    assert.equal(await page.getByRole('status', { name: 'Changes' }).textContent(), '4', 'Selecting the current value does not emit a change');
  } finally { await page.close(); }
});
test('DetailSelect selects from description and illustration clicks while preserving rich links and disabled rows', async () => {
  const page = await open('mode=select');
  try {
    await page.getByRole('button', { name: 'Definition Option 0' }).click();
    const panel = page.getByRole('dialog', { name: 'Definition: options' });
    const row = value => panel.locator('.detail-select-option').filter({ has: page.getByRole('button', { name: `Option ${value}`, exact: true }) });
    const fill = value => row(value).evaluate(e => getComputedStyle(e).backgroundColor);
    const selectedFill = await fill(0), disabledFill = await fill(1), idleFill = await fill(2);
    await row(2).locator('.detail-select-description p').hover();
    assert.notEqual(await fill(2), idleFill, 'Hover highlights the whole enabled pane');
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '0', 'Hover does not select');
    assert.equal(await page.getByRole('status', { name: 'Changes' }).textContent(), '0');
    await row(0).locator('.detail-select-description p').hover();
    assert.equal(await fill(0), selectedFill, 'Hover preserves the current selection fill');
    await row(1).locator('.detail-select-description p').hover();
    assert.equal(await fill(1), disabledFill, 'Disabled panes do not highlight on hover');
    await row(1).locator('.detail-select-description p').click();
    assert(await panel.isVisible(), 'Disabled descriptions cannot select');
    await row(2).getByRole('link', { name: 'Guide 2' }).click();
    assert.equal(await page.getByRole('status', { name: 'Selected' }).textContent(), '0');
    assert.equal(await page.getByRole('status', { name: 'Links' }).textContent(), '1');
    await row(2).locator('.detail-select-description p').click();
    await page.getByRole('button', { name: 'Definition Option 2' }).waitFor();
    assert.equal(await panel.count(), 0, 'Description click commits and closes');
    await page.getByRole('button', { name: 'Definition Option 2' }).click();
    await row(3).getByRole('img', { name: 'Illustration 3' }).click();
    await page.getByRole('button', { name: 'Definition Option 3' }).waitFor();
    assert.equal(await panel.count(), 0, 'Illustration click commits and closes');
    assert.equal(await page.getByRole('status', { name: 'Changes' }).textContent(), '2');
  } finally { await page.close(); }
});
test('DetailSelect handles an empty list and a disabled trigger', async () => {
  for (const state of ['empty', 'disabled']) {
    const page = await open(`mode=select&${state}`);
    try {
      const trigger = page.locator('.detail-select-trigger');
      if (state === 'disabled') assert(await trigger.isDisabled());
      else { await trigger.click(); assert(await page.getByText('No available options.').isVisible()); await page.keyboard.press('Escape'); await page.waitForFunction(e => e === document.activeElement, await trigger.elementHandle()); }
    } finally { await page.close(); }
  }
});
const curves = '.recharts-line-curve, .recharts-area-curve';
for (const style of ['solid', 'pixel', 'halftone', 'rounded']) test(`${style} preserves samples, gaps, colors, highlights and measured widths`, async () => {
  const page = await open(`style=${style}`);
  try {
    const chart = page.locator('[data-slot="chart"]');
    await chart.locator(curves).first().waitFor();
    const paths = await chart.locator(curves).evaluateAll(es => es.map(e => ({ d: e.getAttribute('d'), color: e.getAttribute('stroke'), cap: e.getAttribute('stroke-linecap') })));
    assert.equal(paths.length, 2);
    for (const path of paths) {
      assert.equal((path.d.match(/M/g) || []).length, 2, 'A missing sample leaves two disconnected runs');
      assert.equal(path.cap, style === 'rounded' ? 'round' : 'butt');
      assert.equal(path.d.includes('C'), style === 'rounded', 'Only Rounded changes line charts to bounded cubic curves');
      if (style === 'pixel') {
        const coordinates = [...path.d.matchAll(/[ML]([\d.-]+),([\d.-]+)/g)].map(m => [+m[1], +m[2]]);
        const matches = [...path.d.matchAll(/([ML])([\d.-]+),([\d.-]+)/g)];
        for (let i = 1; i < coordinates.length; i++) {
          // A new M begins the run after the gap; every L is an axis-aligned stair.
          if (matches[i][1] === 'L') assert(coordinates[i][0] === coordinates[i - 1][0] || coordinates[i][1] === coordinates[i - 1][1]);
        }
      }
    }
    assert.equal(paths[0].color, 'var(--color-chart-1)');
    assert.equal(paths[1].color, 'var(--color-chart-2)');
    await page.getByRole('button', { name: 'Load samples' }).click();
    const sparkline = page.getByRole('img', { name: 'Loaded trend' });
    await sparkline.locator(curves).waitFor();
    const sparkPath = await sparkline.locator(curves).getAttribute('d');
    assert.equal((sparkPath.match(/M/g) || []).length, 2, 'Sparkline keeps missing samples disconnected');
    assert.equal(sparkPath.includes('C'), style === 'rounded', 'Only Rounded smooths the Sparkline');
    assert.equal(await sparkline.locator(curves).getAttribute('stroke-linecap'), style === 'rounded' ? 'round' : 'butt');
    if (style === 'halftone') assert.equal(await chart.locator('.recharts-area-area[fill^="url("]').count(), 2);
    await chart.getByRole('button', { name: /User/ }).click();
    assert.deepEqual(await chart.locator(curves).evaluateAll(es => es.map(e => e.getAttribute('stroke-opacity'))), ['1', '0.3']);
    for (const label of ['Connections', 'CPU limit']) {
      const track = page.getByRole('meter', { name: label });
      assert.equal(await track.getAttribute('aria-valuenow'), '37');
      const ratio = await track.evaluate(e => e.firstElementChild.getBoundingClientRect().width / e.getBoundingClientRect().width);
      assert(Math.abs(ratio - 0.37) < 0.001, 'Appearance keeps the exact measured width');
    }
    const fill = page.getByRole('meter', { name: 'Connections' }).locator('span');
    assert.equal(await fill.evaluate(e => getComputedStyle(e).maskImage === 'none'), style !== 'halftone');
    assert.equal(await fill.evaluate(e => getComputedStyle(e).borderTopLeftRadius), style === 'rounded' ? '9999px' : '0px');
    assert.equal(await page.getByRole('progressbar', { name: 'Waiting' }).getAttribute('aria-valuenow'), null);
    assert.equal(await page.locator('.step-bar > span').count(), 4);
    await chart.getByText('View exact values', { exact: true }).click();
    assert.equal(await chart.locator('.chart-values tbody tr').count(), 7);
    assert((await chart.textContent()).includes('Not collected'));
  } finally { await page.close(); }
});
test('Live scoped appearance and late samples update geometry independently of borders', async () => {
  const page = await open('style=halftone');
  try {
    const chart = page.locator('[data-slot="chart"]');
    await chart.locator('.recharts-area-area').first().waitFor();
    await page.getByRole('button', { name: 'Load samples' }).click();
    await page.waitForFunction(() => document.querySelector('[aria-label="Loaded trend"]')?.dataset.chartTreatment === 'halftone');
    assert.equal(await page.getByRole('img', { name: 'Scoped trend' }).getAttribute('data-chart-treatment'), 'pixel');
    await page.evaluate(() => document.documentElement.dataset.chartStyle = 'rounded');
    await page.waitForFunction(() => document.querySelector('[data-slot="chart"]').dataset.chartTreatment === 'rounded');
    assert.equal(await page.getByRole('img', { name: 'Scoped trend' }).getAttribute('data-chart-treatment'), 'pixel');
    assert.equal(await page.getByRole('img', { name: 'Loaded trend' }).getAttribute('data-chart-treatment'), 'rounded');
    await page.evaluate(() => document.getElementById('scoped').dataset.chartStyle = 'solid');
    await page.waitForFunction(() => document.getElementById('scoped').firstElementChild.dataset.chartTreatment === 'solid');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), 'pixel');
  } finally { await page.close(); }
});
test('Halftone split charts have unique pattern IDs and Rounded stacks preserve linear boundaries', async () => {
  for (const query of ['style=halftone&layout=split', 'style=rounded&variant=stacked-area']) {
    const page = await open(query);
    try {
      const chart = page.locator('[data-slot="chart"]');
      await chart.locator(curves).first().waitFor();
      const ids = await chart.locator('pattern').evaluateAll(es => es.map(e => e.id));
      assert.equal(new Set(ids).size, ids.length);
      if (query.includes('stacked')) assert(await chart.locator(curves).evaluateAll(es => es.every(e => !e.getAttribute('d').includes('C'))));
    } finally { await page.close(); }
  }
});

test('Chart readouts inherit control corners without changing series treatment', async () => {
  const page = await open('style=solid');
  try {
    const chart = page.locator('[data-slot="chart"]');
    const plot = chart.locator('.recharts-surface').first();
    await plot.focus(); await page.keyboard.press('ArrowRight');
    const readout = chart.locator('.chart-inspection');
    await readout.waitFor();
    assert((await readout.evaluate(e => getComputedStyle(e).clipPath)).startsWith('polygon('), 'Pixel control contour');
    for (const cornerStyle of ['rounded', 'asym']) {
      await page.evaluate(cornerStyle => document.documentElement.dataset.cornerStyle = cornerStyle, cornerStyle);
      const radii = await readout.evaluate(e => { const s = getComputedStyle(e); return [s.borderTopLeftRadius, s.borderTopRightRadius]; });
      assert(radii.every(r => parseFloat(r) > 0));
      assert.equal(radii[0] === radii[1], cornerStyle === 'rounded');
    }
    for (const borderStyle of ['manga', 'brush']) {
      await page.evaluate(borderStyle => document.documentElement.dataset.borderStyle = borderStyle, borderStyle);
      assert((await readout.evaluate(e => getComputedStyle(e).clipPath)).startsWith('polygon('));
    }
    assert.equal(await chart.getAttribute('data-chart-treatment'), 'solid');
  } finally { await page.close(); }
});
