import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = process.env.PLAYWRIGHT_BROWSER || 'chromium';
const screenshots = process.env.SCREENSHOT_DIR;
const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  await server.listen();
  url = `http://127.0.0.1:${server.httpServer.address().port}/scripts/fixtures/subtle-text.html`;
  browser = await engines[engine].launch();
  console.log(`${engine} ${browser.version()}`);
});
after(async () => { await browser?.close(); await server.close(); });

async function contrast(locator, pseudo = null, surface = null) {
  return locator.evaluate((element, { pseudo, surface }) => {
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    function rgba(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data];
    }
    function blend(front, back) {
      return front.slice(0, 3).map((channel, index) => channel * front[3] / 255 + back[index] * (1 - front[3] / 255));
    }
    const layers = [];
    for (let ancestor = surface ? document.querySelector(surface) : element; ancestor; ancestor = ancestor.parentElement) {
      layers.unshift(rgba(getComputedStyle(ancestor).backgroundColor));
    }
    const background = layers.reduce((back, front) => blend(front, back), [255, 255, 255]);
    const style = getComputedStyle(element, pseudo);
    const color = rgba(style.color);
    color[3] *= Number(style.opacity);
    const foreground = blend(color, background);
    const luminance = rgb => rgb.map(channel => channel / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const first = luminance(foreground);
    const second = luminance(background);
    return { foreground, background, ratio: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05) };
  }, { pseudo, surface });
}

for (const colorScheme of ['light', 'dark']) for (const scenario of ['text', 'select', 'menu', 'palette']) {
  test(`Small text contrast in ${scenario}/${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, colorScheme });
    page.setDefaultTimeout(5000);
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    try {
      await page.goto(`${url}?scenario=${scenario}`);
      const results = [];
      const check = async (name, locator, minimum = 4.5, pseudo = null, surface = null) => {
        await locator.waitFor();
        results.push({ name, minimum, ...await contrast(locator, pseudo, surface) });
      };
      if (scenario === 'text') {
        await check('page caps', page.locator('[data-case="page-caps"]'));
        await check('NavigationGroup', page.locator('[data-slot="navigation-group"] .t-caps'));
        await check('Navigation icon', page.locator('[data-slot="navigation-link"] .icon'), 3);
        for (const [name, selector] of [['Input placeholder', '#name'], ['Textarea placeholder', '#description'], ['Search placeholder', '[data-slot="search"] input'], ['ChipInput placeholder', '.chip-input-field']]) {
          await check(name, page.locator(selector), 4.5, '::placeholder');
        }
        await check('Search icon', page.locator('[data-slot="search"] .icon'), 3, null, '[data-slot="search"] input');
        for (const mark of await page.locator('.chip-option-mark').all()) await check(`chip syntax ${await mark.textContent()}`, mark);
        await check('empty option', page.locator('.chip-option[data-empty="true"]'));
        await page.locator('.chip-option').first().hover();
        for (const mark of await page.locator('.chip-option-mark').all()) await check(`hovered chip syntax ${await mark.textContent()}`, mark);
        await page.locator('.chip-option[data-empty="true"]').hover();
        await check('hovered empty option', page.locator('.chip-option[data-empty="true"]'));
        await check('chart axis', page.locator('.chart-axis'));
      } else if (scenario === 'select') {
        await check('Select placeholder', page.getByRole('combobox', { name: 'Region' }));
        if (screenshots) await page.getByRole('combobox', { name: 'Region' }).screenshot({ path: `${screenshots}/select-placeholder-${colorScheme}.png` });
        await page.getByRole('combobox', { name: 'Region' }).click();
        await check('SelectLabel', page.locator('[data-slot="select-label"]'));
      } else if (scenario === 'menu') {
        await page.getByRole('button', { name: 'Open projects' }).click();
        await check('DropdownMenuLabel', page.locator('[data-slot="dropdown-menu-label"]'));
      } else {
        await page.getByRole('button', { name: 'Open commands' }).click();
        await check('CommandPaletteGroup', page.locator('[data-slot="command-palette-group"] .t-caps'));
      }
      if (screenshots) await page.locator(scenario === 'text' ? 'main' : scenario === 'palette' ? '.palette' : '.menu').screenshot({ path: `${screenshots}/${scenario}-${colorScheme}.png` });
      console.log(JSON.stringify({ scenario, colorScheme, results }));
      for (const result of results) assert(result.ratio >= result.minimum, `${result.name}: ${result.ratio.toFixed(3)}:1, expected ${result.minimum}:1`);
    } finally { await page.close(); }
  });
}
