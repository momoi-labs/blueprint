import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshots = process.env.SCREENSHOT_DIR;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/sidebar.html`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server.close(); });

async function open(query = '', options = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
  return page;
}

for (const controlled of [false, true]) test(`Header toggle preserves state and focus, controlled=${controlled}`, async () => {
  const page = await open(`headerToggle${controlled ? '&controlled' : ''}`);
  try {
    const toggle = page.getByRole('button', { name: 'Collapse sidebar' });
    assert.equal(await page.locator('.sidebar-toggle').count(), 1);
    assert.equal(await page.locator('.sidebar .sidebar-toggle').count(), 0);
    assert.equal(await page.locator('.topbar .sidebar-toggle').count(), 1);
    assert.equal(await toggle.getAttribute('aria-controls'), await page.locator('.sidebar').getAttribute('id'));
    await toggle.focus(); await page.keyboard.press('Enter');
    const expand = page.getByRole('button', { name: 'Expand sidebar' });
    assert.equal(await expand.getAttribute('aria-expanded'), 'false');
    assert(await expand.evaluate(el => el === document.activeElement));
    await page.keyboard.press('Space');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    if (controlled) {
      await page.getByRole('button', { name: 'Create application' }).click();
      assert(await expand.evaluate(el => el === document.activeElement), 'Hidden sidebar content hands focus to the visible header control');
    }
    if (screenshots) await page.screenshot({ path: `${screenshots}/sidebar-header-${controlled ? 'controlled' : 'uncontrolled'}.png` });
  } finally { await page.close(); }
});

test('Header toggle works without header content and follows the narrow breakpoint', async () => {
  const page = await open('headerToggle&noHeader&collapsed');
  try {
    const expand = page.getByRole('button', { name: 'Expand sidebar' });
    assert(await expand.isVisible());
    await page.setViewportSize({ width: 390, height: 850 });
    assert.equal(await expand.isVisible(), false);
    await page.getByRole('button', { name: 'Open navigation' }).click();
    assert(await page.getByRole('dialog').getByRole('link', { name: 'Overview', exact: true }).isVisible());
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert(await page.getByRole('button', { name: 'Open navigation' }).evaluate(element => element === document.activeElement), 'Focus returns to the menu button');
    await page.setViewportSize({ width: 1280, height: 900 });
    assert(await expand.isVisible());
    assert.equal(await expand.getAttribute('aria-expanded'), 'false');
    await page.goto(`${url}?headerToggle&noHeader&plain`);
    assert.equal(await page.locator('.sidebar-toggle').count(), 0);
    assert.equal(await page.locator('.topbar:visible').count(), 0, 'The phone header stays out of a wide screen');
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) for (const border of ['square', 'round']) {
  test(`Sidebar collapses without losing navigation or ${theme}/${border} appearance`, async () => {
    const page = await open(`theme=${theme}&border=${border}&marks=arcs`);
    try {
      const sidebar = page.locator('[data-slot="sidebar"]');
      const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
      assert.equal(await collapse.getAttribute('aria-controls'), await sidebar.getAttribute('id'));
      assert.equal(await collapse.getAttribute('aria-expanded'), 'true');
      const expanded = await sidebar.boundingBox();
      assert.equal(expanded.height, 900, 'Rail fills the viewport');
      const radius = await collapse.evaluate(element => getComputedStyle(element).borderRadius);
      if (screenshots) await page.screenshot({ path: `${screenshots}/sidebar-expanded-${theme}-${border}.png` });
      await collapse.focus();
      await page.keyboard.press('Enter');
      const expand = page.getByRole('button', { name: 'Expand sidebar' });
      assert.equal(await expand.getAttribute('aria-expanded'), 'false');
      assert(await expand.evaluate(element => element === document.activeElement));
      const compact = await sidebar.boundingBox();
      assert(compact.width < expanded.width / 2);
      assert.equal(compact.height, 900);
      assert.equal((await page.locator('[data-slot="app-shell-main"]').boundingBox()).x, compact.width);
      assert.equal(await expand.evaluate(element => getComputedStyle(element).borderRadius), radius);
      assert.equal(await page.locator('html').getAttribute('data-border-style'), border);
      assert.equal(await page.locator('html').getAttribute('data-corner-marks'), 'arcs');
      if (screenshots) await page.screenshot({ path: `${screenshots}/sidebar-collapsed-${theme}-${border}.png` });
      await page.keyboard.press('Tab');
      assert(await page.getByRole('link', { name: 'Overview', exact: true }).evaluate(element => element === document.activeElement));
      await page.getByRole('link', { name: 'Applications', exact: true }).click();
      await page.getByRole('heading', { name: 'Applications', exact: true }).waitFor();
      assert.equal(await page.getByRole('link', { name: 'Applications', exact: true }).getAttribute('aria-current'), 'page');
      assert.equal(await sidebar.getAttribute('data-collapsed'), 'true', 'Route changes preserve the preference');
      const labelOnly = page.getByRole('link', { name: 'Settings', exact: true });
      assert((await labelOnly.locator('.sidebar-link-label').boundingBox()).width > 1, 'Destinations without icons keep visible labels');
      await labelOnly.click();
      assert(page.url().endsWith('#settings'), 'Native links still navigate');
      await expand.focus();
      await page.keyboard.press('Space');
      assert.equal(await collapse.getAttribute('aria-expanded'), 'true');
      assert.equal((await sidebar.boundingBox()).width, expanded.width);
      assert.equal(await page.getByRole('status', { name: 'Requested collapse state' }).textContent(), 'false');
    } finally { await page.close(); }
  });
}

test('Controlled collapse returns focus from hidden content and respects the caller', async () => {
  const page = await open('controlled');
  try {
    await page.getByRole('button', { name: 'Create application' }).click();
    const expand = page.getByRole('button', { name: 'Expand sidebar' });
    await expand.waitFor();
    assert(await expand.evaluate(element => element === document.activeElement), 'Hidden actions must not strand focus');
    await expand.click();
    assert.equal(await page.getByRole('button', { name: 'Collapse sidebar' }).getAttribute('aria-expanded'), 'true');
    await page.goto(`${url}?controlled&veto`);
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    assert.equal(await page.getByRole('status', { name: 'Requested collapse state' }).textContent(), 'true');
    assert.equal(await page.getByRole('button', { name: 'Collapse sidebar' }).getAttribute('aria-expanded'), 'true', 'Controlled state changes only when the caller accepts it');
  } finally { await page.close(); }
});

test('Collapsed desktop navigation stays available on narrow screens and restores its state', async () => {
  const page = await open('collapsed', { hasTouch: true });
  try {
    const toggle = page.getByRole('button', { name: 'Expand sidebar' });
    const target = await toggle.boundingBox();
    assert(target.width >= 44 && target.height >= 44);
    const link = page.getByRole('link', { name: 'Overview', exact: true });
    const linkBox = await link.boundingBox();
    assert(linkBox.width >= 44 && linkBox.height >= 44, `Navigation touch target: ${JSON.stringify(linkBox)}`);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.getByRole('button', { name: /sidebar/ }).count(), 0);
    const menu = page.getByRole('button', { name: 'Open navigation' });
    const menuBox = await menu.boundingBox();
    assert(menuBox.width >= 44 && menuBox.height >= 44, `Menu touch target: ${JSON.stringify(menuBox)}`);
    await menu.tap();
    const drawer = page.getByRole('dialog');
    assert((await drawer.getByRole('link', { name: 'Overview', exact: true }).boundingBox()).width > 100,
      'The drawer shows labels even when the desktop sidebar is collapsed');
    await drawer.getByRole('link', { name: 'Applications 4', exact: true }).tap();
    await page.getByRole('heading', { name: 'Applications', exact: true }).waitFor();
    await drawer.waitFor({ state: 'detached' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (screenshots) await page.screenshot({ path: `${screenshots}/sidebar-narrow.png` });
    await page.setViewportSize({ width: 1280, height: 900 });
    await toggle.waitFor();
    assert.equal(await page.locator('[data-slot="sidebar"]').getAttribute('data-collapsed'), 'true');
  } finally { await page.close(); }
});

for (const mode of ['plain', 'topbar']) {
  test(`${mode} layout remains unchanged without opting in`, async () => {
    const page = await open(mode);
    try {
      assert.equal(await page.getByRole('button', { name: /sidebar/ }).count(), 0);
      if (mode === 'plain') assert.equal((await page.locator('[data-slot="sidebar"]').boundingBox()).width, 248);
      else assert.equal(await page.locator('[data-slot="sidebar"]').count(), 0);
    } finally { await page.close(); }
  });
}

test('A hovered navigation item steps its fill under Pixel corners', async () => {
  const page = await open();
  try {
    const item = page.locator('.sidebar .nav-item:not([aria-current="page"])').first();
    await item.hover();
    const paint = () => item.evaluate(el => ({ color: getComputedStyle(el).backgroundColor, image: getComputedStyle(el).backgroundImage }));
    const plain = await paint();
    assert.equal(plain.image, 'none');
    await page.evaluate(() => Object.assign(document.documentElement.dataset, { cornerStyle: 'pixel', frameScope: 'all' }));
    const pixel = await paint();
    assert.equal(pixel.color, 'rgba(0, 0, 0, 0)');
    assert(pixel.image.startsWith(`linear-gradient(${plain.color}, ${plain.color})`), pixel.image);
    await page.evaluate(() => { document.documentElement.dataset.frameScope = 'outer'; });
    assert.deepEqual(await paint(), plain);
  } finally { await page.close(); }
});

const box = (page, selector) => page.locator(selector).first().boundingBox();
const openMark = '.sidebar-header .sidebar-expanded-content .brand-mark';
const railMark = '.sidebar-rail-mark .brand-mark';

for (const placement of ['sidebar', 'header']) test(`The rail keeps the brand mark and expands the sidebar, toggle in ${placement}`, async () => {
  const page = await open(`brandMark&shellLayout${placement === 'header' ? '&headerToggle' : ''}`);
  try {
    assert.equal(await page.locator('.sidebar-rail-mark').count(), 0, 'The open sidebar has no rail mark');
    const before = await box(page, openMark);
    const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
    await collapse.click();
    await page.mouse.move(900, 500);
    const mark = page.locator(railMark);
    assert(await mark.isVisible(), 'The rail shows the mark');
    const after = await mark.boundingBox();
    assert.equal(after.x, before.x, 'The mark keeps its x on collapse');
    assert.equal(after.y, before.y, 'The mark keeps its y on collapse');
    assert.equal(before.x, 17.5, 'The mark starts at the brand inset');
    const expand = page.locator('.sidebar').getByRole('button', { name: 'Expand sidebar' });
    assert.equal(await expand.getAttribute('aria-expanded'), 'false');
    assert.equal(await expand.locator('.sidebar-rail-mark').count(), 1, 'The mark is the expand control');
    await expand.click();
    assert.notEqual(await page.locator('.sidebar').getAttribute('data-collapsed'), 'true', 'A click on the mark expands');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    for (const key of ['Enter', 'Space']) {
      await page.locator('.sidebar').getByRole('button', { name: 'Expand sidebar' }).focus();
      await page.keyboard.press(key);
      assert.notEqual(await page.locator('.sidebar').getAttribute('data-collapsed'), 'true', `${key} on the mark expands`);
      await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    }
  } finally { await page.close(); }
});

for (const border of ['soft', 'inset']) test(`The Header and the sidebar header share one bar, ${border}`, async () => {
  const page = await open(`brandMark&shellLayout&border=${border}`);
  try {
    const head = await box(page, '.sidebar-header');
    const bar = await box(page, '.app-shell-main > .topbar, [data-slot="app-shell-main"] > .topbar');
    assert.equal(head.y + head.height, bar.y + bar.height, 'Both bars end on one line');
    assert.equal(bar.height, 60, 'The bar keeps its height');
    const action = await box(page, '.sidebar-actions');
    assert(action.y >= head.y + head.height, 'The primary action sits below the bar');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    const rail = await box(page, '.sidebar-header');
    assert.equal(rail.y + rail.height, bar.y + bar.height, 'The rail header keeps the bar line');
  } finally { await page.close(); }
});

test('The rail mark hands focus to the Header toggle when it expands', async () => {
  const page = await open('brandMark&shellLayout&collapsed&headerToggle');
  try {
    await page.locator('.sidebar .sidebar-toggle').focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('.topbar .sidebar-toggle').evaluate(el => el === document.activeElement));
  } finally { await page.close(); }
});

test('A floating Header holds the brand and the rail has no mark', async () => {
  const page = await open('brandMark&shellLayout&headerVariant=floating');
  try {
    assert.equal(await page.locator('.app-shell-bar-brand .brand-mark').count(), 1, 'The brand is in the bar');
    assert.equal(await page.locator('.sidebar .brand-mark').count(), 0);
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    assert.equal(await page.locator('.sidebar-rail-mark').count(), 0, 'The rail has no mark');
    assert(await page.getByRole('button', { name: 'Expand sidebar' }).isVisible());
  } finally { await page.close(); }
});

for (const query of ['brandMark&shellLayout', 'brandMark&shellLayout&headerVariant=floating', 'brandMark&shellLayout&collapsed']) test(`No sideways scroll at 390px, ${query}`, async () => {
  const page = await open(query, { viewport: { width: 390, height: 850 } });
  try {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
    assert(await page.locator('.topbar .brand-mark').first().isVisible(), 'The phone header shows the brand');
    if (!query.includes('floating')) assert.equal(await page.locator('.topbar .app-shell-phone-brand .t-label').count(), 0, 'The phone header shows the mark only');
    assert((await box(page, '.topbar')).height < 100, 'The Header keeps its content height');
  } finally { await page.close(); }
});

for (const [label, query, bg] of [
  ['default', '', 'solid'],
  ['inset solid', 'variant=inset', 'solid'],
  ['inset patterned', 'variant=inset', 'construction'],
  ['shellLayout default', 'brandMark&shellLayout', 'solid'],
  ['shellLayout inset solid', 'brandMark&shellLayout&variant=inset', 'solid'],
  ['shellLayout inset patterned', 'brandMark&shellLayout&variant=inset', 'construction'],
  ['shellLayout floating default', 'brandMark&shellLayout&headerVariant=floating', 'solid'],
  ['shellLayout floating inset', 'brandMark&shellLayout&headerVariant=floating&variant=inset', 'construction'],
]) test(`ApplicationShell icons keep their position on collapse, ${label}`, async () => {
  const page = await open(query);
  try {
    await page.evaluate(value => { document.documentElement.dataset.backgroundStyle = value; }, bg);
    const icons = () => page.evaluate(() => [...document.querySelectorAll('.sidebar .nav-item .sidebar-link-icon')].map(el => {
      const rect = (el.querySelector('svg') || el).getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }));
    const before = await icons();
    assert(before.length >= 3);
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    const after = await icons();
    for (let i = 0; i < before.length; i++) {
      assert(Math.abs(after[i].x - before[i].x) <= 0.5 && Math.abs(after[i].y - before[i].y) <= 0.5,
        `${label} icon ${i} shifted (${(after[i].x - before[i].x).toFixed(2)}, ${(after[i].y - before[i].y).toFixed(2)})`);
    }
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    const reopened = await icons();
    for (let i = 0; i < before.length; i++) {
      assert(Math.abs(reopened[i].x - before[i].x) <= 0.5 && Math.abs(reopened[i].y - before[i].y) <= 0.5,
        `${label} reopen icon ${i} shifted (${(reopened[i].x - before[i].x).toFixed(2)}, ${(reopened[i].y - before[i].y).toFixed(2)})`);
    }
  } finally { await page.close(); }
});

for (const [label, query] of [
  ['sidebar toggle', ''],
  ['header toggle', 'headerToggle'],
  ['header toggle with a rail mark', 'headerToggle&brandMark'],
  ['inset', 'variant=inset'],
  ['shellLayout default', 'brandMark&shellLayout'],
  ['shellLayout inset', 'brandMark&shellLayout&variant=inset'],
]) test(`ApplicationShell icons keep their position on collapse with a fluid-width brand, ${label}`, async () => {
  const page = await open(`fluidBrand&${query}`);
  try {
    const measure = () => page.evaluate(() => ({
      header: document.querySelector('.sidebar-header').getBoundingClientRect().height,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      icons: [...document.querySelectorAll('.sidebar .nav-item .sidebar-link-icon')].map(el => {
        const rect = (el.querySelector('svg') || el).getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return { x: rect.x, y: rect.y, hit: el.closest('.nav-item').contains(hit) };
      }),
    }));
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const before = await measure();
      assert(before.icons.length >= 3);
      await page.getByRole('button', { name: 'Collapse sidebar' }).click();
      const after = await measure();
      assert(Math.abs(after.header - before.header) <= 0.5, `${label} ${width} header height changed by ${(after.header - before.header).toFixed(2)}`);
      assert.equal(after.overflow, 0, `${label} ${width} scrolls sideways`);
      for (let i = 0; i < before.icons.length; i++) {
        assert(Math.abs(after.icons[i].x - before.icons[i].x) <= 0.5 && Math.abs(after.icons[i].y - before.icons[i].y) <= 0.5,
          `${label} ${width} icon ${i} shifted (${(after.icons[i].x - before.icons[i].x).toFixed(2)}, ${(after.icons[i].y - before.icons[i].y).toFixed(2)})`);
        assert(after.icons[i].hit, `${label} ${width} icon ${i} does not receive the pointer`);
      }
      await page.getByRole('button', { name: 'Expand sidebar' }).first().click();
    }
  } finally { await page.close(); }
});
