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
    assert(await page.getByRole('link', { name: 'Overview', exact: true }).isVisible());
    await page.setViewportSize({ width: 1280, height: 900 });
    assert(await expand.isVisible());
    assert.equal(await expand.getAttribute('aria-expanded'), 'false');
    await page.goto(`${url}?headerToggle&noHeader&plain`);
    assert.equal(await page.locator('.sidebar-toggle').count(), 0);
    assert.equal(await page.locator('.topbar').count(), 0);
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
    assert((await link.locator('.sidebar-link-label').boundingBox()).width > 1);
    await page.getByRole('link', { name: 'Applications 4', exact: true }).tap();
    await page.getByRole('heading', { name: 'Applications', exact: true }).waitFor();
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
