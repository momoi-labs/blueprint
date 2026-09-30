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

async function open(query = '') {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(5000);
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(`${url}?${query}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  return page;
}

const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const appearance = locator => locator.evaluate(el => {
  const style = getComputedStyle(el);
  const before = getComputedStyle(el, '::before');
  const after = getComputedStyle(el, '::after');
  return [style.borderRadius, style.borderStyle, style.borderColor,
    before.content, before.boxShadow, before.border, after.opacity,
    after.backgroundImage, after.maskImage, after.inset];
});

for (const preference of ['headingPreference', 'visualStyle']) {
test(`${preference} applies unless a component explicitly chooses a variant`, async () => {
  const page = await open(`${preference}=editorial&shellPreference=inset`);
  try {
    const title = page.getByRole('heading', { level: 1 });
    const main = page.locator('[data-slot="app-shell-main"]');
    assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), '48px');
    assert.equal((await main.boundingBox()).y, 16);
    await page.goto(`${url}?${preference}=editorial&shellPreference=inset&headingVariant=default&variant=default`);
    await title.waitFor();
    assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), '22px');
    assert.equal((await main.boundingBox()).y, 0);
    await page.goto(`${url}?${preference}=default&shellPreference=default&editorial&variant=inset`);
    await title.waitFor();
    assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), '48px');
    assert.equal((await main.boundingBox()).y, 16);
  } finally { await page.close(); }
});
}

test('Editorial heading scales, wraps long titles, and keeps actions reachable', async () => {
  const page = await open();
  try {
    const title = page.getByRole('heading', { level: 1 });
    assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), '22px');
    await page.goto(`${url}?editorial&title=Your%20homelab`);
    await title.waitFor();
    assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), '48px');
    if (screenshots) await page.screenshot({ path: `${screenshots}/editorial-desktop.png` });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${url}?editorial&variant=inset&title=${'homelab'.repeat(20)}`);
      await title.waitFor();
      assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), '30px');
      assert(await noOverflow(page), `Long title overflow at ${width}px`);
      const actions = page.locator('[data-slot="page-header-actions"]');
      const titleBox = await title.boundingBox();
      const actionsBox = await actions.boundingBox();
      assert(actionsBox.y >= titleBox.y + titleBox.height, 'Actions wrap below the title');
      await page.getByRole('button', { name: 'Deploy application' }).focus();
      assert(await page.getByRole('button', { name: 'Deploy application' }).evaluate(el => el === document.activeElement));
    }
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) {
  test(`Inset shell fills the viewport and inherits ${theme} Appearance settings`, async () => {
    const page = await open(`variant=inset&editorial&theme=${theme}`);
    try {
      const main = page.locator('[data-slot="app-shell-main"]');
      const shell = page.locator('[data-slot="app-shell"]');
      const sidebar = page.locator('[data-slot="sidebar"]');
      const expanded = await main.boundingBox();
      assert.equal(expanded.y, 16);
      assert.equal(expanded.y + expanded.height, 884);
      assert.equal((await shell.boundingBox()).height, 900);
      for (const border of ['square', 'soft', 'round', 'asym', 'rail', 'dash', 'bevel', 'double', 'base', 'offset']) {
        await page.evaluate(value => document.documentElement.dataset.borderStyle = value, border);
        await page.evaluate(() => {
          document.documentElement.dataset.cornerMarks = 'arcs';
          document.documentElement.dataset.markSize = 'large';
        });
        assert.deepEqual(await appearance(main), await appearance(page.locator('.card')), `${border} frame should match panel Appearance`);
        assert(await noOverflow(page), `${border} should not cause horizontal scroll`);
        if (screenshots && ['square', 'round'].includes(border)) await page.screenshot({ path: `${screenshots}/inset-${theme}-${border}.png` });
      }
      await page.evaluate(() => document.documentElement.dataset.cornerSize = 'off');
      assert.equal(await main.evaluate(el => getComputedStyle(el).borderRadius), '0px');
      await page.getByRole('button', { name: 'Collapse sidebar' }).click();
      assert((await main.boundingBox()).width > expanded.width);
      assert.equal((await main.boundingBox()).y + (await main.boundingBox()).height, 884);
      if (screenshots) await page.screenshot({ path: `${screenshots}/inset-${theme}-collapsed.png` });
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await noOverflow(page));
      assert((await main.boundingBox()).y >= (await sidebar.boundingBox()).y + (await sidebar.boundingBox()).height);
      if (screenshots) await page.screenshot({ path: `${screenshots}/inset-${theme}-mobile.png`, fullPage: true });
    } finally { await page.close(); }
  });
}

test('Inset topbar and dense tables keep their height and internal scrolling', async () => {
  const page = await open('variant=inset&editorial&topbar');
  try {
    assert.equal(await page.getByRole('complementary').count(), 0);
    assert.equal((await page.locator('[data-slot="app-shell-main"]').boundingBox()).x, 16);
    for (const variant of ['default', 'inset']) {
      await page.goto(`${url}?variant=${variant}&visualStyle=editorial&editorial&dense`);
      await page.getByRole('table').waitFor();
      assert(await page.locator('.table-wrap').evaluate(el => el.scrollHeight > el.clientHeight), 'Table rows scroll inside the page');
      assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), `${variant} dense page must stay inside the viewport`);
      assert(await noOverflow(page));
    }
    await page.goto(`${url}?variant=inset&long`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.evaluate(() => scrollTo(0, 500));
    assert.equal((await page.locator('[data-slot="sidebar"]').boundingBox()).y, 16, 'Sidebar remains inside the inset while scrolling');
  } finally { await page.close(); }
});

test('Inset frame stays visible when long page content scrolls', async () => {
  const page = await open('variant=inset&long');
  try {
    const frame = page.locator('[data-slot="app-shell-main"]');
    const initial = await frame.boundingBox();
    await page.mouse.move(initial.x + initial.width / 2, 500);
    await page.mouse.wheel(0, 500);
    await page.waitForFunction(() => document.querySelector('.page-header').getBoundingClientRect().top < 0);
    assert.equal((await frame.boundingBox()).y, initial.y, 'Scrolling content keeps the top edge inside the viewport');
  } finally { await page.close(); }
});
