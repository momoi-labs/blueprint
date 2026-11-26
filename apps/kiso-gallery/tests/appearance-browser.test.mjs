import assert from "node:assert/strict";
import { before, after } from "node:test";
import { test } from "./shard.mjs";
import { closeGenerator, field, openGenerator, tab } from "./settings-tabs.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { appearanceCode } from "../src/appearance-settings.ts";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const screenshots = process.env.SCREENSHOT_DIR;
// Pull requests run one representative case per sweep; main and nightly set KISO_FULL_SWEEP=1.
const fullSweep = process.env.KISO_FULL_SWEEP === "1";
let server, browser, url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});
async function open(route, width = 1440, colorScheme = "dark") {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.goto(`${url}#${route}`);
  return page;
}
const scopeName = { outer: 'Outer only', panels: 'With panels', all: 'With controls' };
const settings = openGenerator;
async function group(panel, name) {
  if (!name.endsWith(" options")) await tab(panel, name);
  const section = panel.getByRole("region", { name, exact: true });
  await section.waitFor();
  return section;
}
const close = closeGenerator;
async function plain(page) {
  await page.evaluate(() => {
    const appearance = window.kisoAppearance;
    appearance.save({ ...appearance.presetDefaults, theme: appearance.read().theme, cornerStyle: 'square', cornerSize: 'medium', backgroundStyle: 'solid', visualStyle: 'default', appShell: 'inset', frameScope: 'panels' });
  });
  await page.reload();
}
async function pickTheme(panel, name) {
  const before = await panel.getByRole("tab", { selected: true }).innerText();
  await tab(panel, "Theme");
  await panel.getByRole("radio", { name: `${name} theme`, exact: true }).check();
  await tab(panel, before.trim());
}

for (const width of [390, 1440]) test(`DetailSelect selects the last option by click and keyboard at ${width}px`, async () => {
  const page = await open('components/detail-select', width);
  try {
    await page.getByRole('button', { name: 'Definition Container image', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Definition: options' });
    const last = panel.getByRole('button', { name: 'Virtual machine', exact: true });
    assert(await last.isEnabled());
    await last.click();
    const trigger = page.getByRole('button', { name: 'Definition Virtual machine', exact: true });
    await trigger.waitFor();
    assert.equal(await panel.count(), 0);
    await trigger.click();
    await page.waitForFunction(e => e === document.activeElement, await last.elementHandle());
    await page.keyboard.press('Home');
    await page.getByRole('button', { name: 'Definition Container image', exact: true }).waitFor();
    await page.keyboard.press('ArrowDown');
    await page.getByRole('button', { name: 'Definition Source repository', exact: true }).waitFor();
    await page.keyboard.press('ArrowDown');
    await trigger.waitFor();
    assert.equal(await last.getAttribute('aria-pressed'), 'true');
    assert(await panel.isVisible(), 'Arrow selection keeps the panel open');
    await page.keyboard.press('Home');
    await page.keyboard.press('End');
    await trigger.waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await panel.count(), 0);
    assert(await page.getByRole('status').getByText('Selected definition: vm', { exact: true }).isVisible());
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Chart treatments select, persist and export without page growth at ${width}px`, async () => {
  const page = await open('components/chart', width);
  try {
    for (const [select, label, attribute, value] of [['Chart line', 'Stepped', 'chartLine', 'stepped'], ['Chart line', 'Curved', 'chartLine', 'curved'],
      ['Chart fill', 'Dots', 'chartFill', 'dots'], ['Chart fill', 'Scanlines', 'chartFill', 'scanlines']]) {
      const panel = await settings(page);
      const choices = await field(panel, select);
      const baseline = await page.evaluate(() => [document.documentElement.scrollHeight, document.documentElement.scrollWidth]);
      await choices.getByRole('radio', { name: label, exact: true }).check();
      assert.deepEqual(await page.evaluate(() => [document.documentElement.scrollHeight, document.documentElement.scrollWidth]), baseline);
      await page.waitForFunction(([key, expected]) => document.documentElement.dataset[key] === expected, [attribute, value]);
      await close(page);
      await page.waitForFunction(([key, expected]) => document.querySelector('[data-slot="chart"]')?.dataset[key === 'chartLine' ? 'line' : 'fill'] === expected, [attribute, value]);
      await page.reload();
      assert.equal(await page.evaluate(key => document.documentElement.dataset[key], attribute), value);
      const saved = await page.evaluate(() => window.kisoAppearance.read());
      assert(appearanceCode(saved).html.includes(`data-chart-${attribute === 'chartLine' ? 'line' : 'fill'}="${value}"`));
      assert.equal(saved.cornerStyle, 'rounded', 'Chart choice keeps the independent corner preference');
    }
  } finally { await page.close(); }
});

for (const accent of ['red', 'gold', 'lime']) for (const theme of ['light', 'dark']) test(`${accent} accent can be selected and restored in ${theme}`, async () => {
  const page = await open('intro', 1440, theme);
  try {
    const panel = await settings(page);
    const choice = panel.getByRole('button', { name: accent[0].toUpperCase() + accent.slice(1), exact: true });
    await choice.click();
    assert.equal(await choice.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), accent);
    await page.reload();
    assert.equal(await page.evaluate(() => window.kisoAppearance.read().accent), accent);
    assert.equal(await (await settings(page)).getByRole('button', { name: accent[0].toUpperCase() + accent.slice(1), exact: true }).getAttribute('aria-pressed'), 'true');
    if (screenshots) await page.screenshot({ path: `${screenshots}/${accent}-accent-${theme}.png` });
  } finally { await page.close(); }
});

test('Border choices update existing panels and guided controls', async () => {
  const page = await open('components');
  try {
    const panel = await settings(page);
    await (await field(panel, 'Corner type')).locator('input[value="square"]').check();
    for (const style of ['dash', 'double', 'rail', 'base', 'offset', 'none', 'manga', 'brush', 'solid']) {
      await settings(page);
      await (await field(panel, 'Border style')).locator(`input[value="${style}"]`).check();
      await close(page);
      for (const id of ['file-dropzone', 'radio-group', 'textarea']) await page.locator(`[data-pane-id="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator('.file-dropzone').first().waitFor();
      await page.locator('[data-pane-id="textarea"] textarea').waitFor();
      const actual = await page.evaluate(() => {
        const frame = selector => {
          const el = document.querySelector(selector), s = getComputedStyle(el), ink = getComputedStyle(el, '::before');
          return { border: s.borderTopStyle, contour: ink.clipPath, layer: ink.content, shadow: ink.boxShadow };
        };
        return { selected: document.documentElement.dataset.borderStyle, saved: window.kisoAppearance.read().borderStyle,
          cards: [...document.querySelectorAll('.catalog-pane')].map(el => frame(`[data-pane-id="${el.dataset.paneId}"]`)),
          file: frame('.file-dropzone'), radio: frame('.radio-group[data-variant="tiles"] > .radio-item'),
          field: getComputedStyle(document.querySelector('[data-pane-id="textarea"] textarea')).borderTopWidth,
          fieldContour: getComputedStyle(document.querySelector('[data-pane-id="textarea"] textarea')).clipPath };
      });
      assert.equal(actual.selected, style);
      assert.equal(actual.saved, style);
      assert(actual.cards.length > 10, 'The check includes existing catalog components');
      for (const card of actual.cards) {
        assert.equal(card.border, style === 'none' ? 'none' : style === 'dash' ? 'dashed' : 'solid', `${style}: catalog panels change`);
        if (['manga', 'brush'].includes(style)) assert(card.contour.startsWith('polygon('), `${style}: full panel contour`);
      }
      for (const control of [actual.file, actual.radio]) {
        assert.equal(control.border, style === 'dash' ? 'dashed' : 'solid', `${style}: large control border`);
        assert.equal(control.contour, actual.cards[0].contour, `${style}: shared decoration`);
      }
      assert.equal(actual.field, ['manga', 'brush'].includes(style) ? '3px' : '1px', `${style}: existing fields follow the border style`);
      assert.equal(actual.fieldContour.startsWith('polygon('), ['manga', 'brush'].includes(style), `${style}: fields take the irregular contour only with Manga and Brush`);
    }
    await page.reload();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.borderStyle), 'solid');
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Fresh visits and reset use SNES; a preset replaces the whole look in ${theme}`, async () => {
  const page = await open('intro', 1440, theme);
  try {
    const read = () => page.evaluate(() => window.kisoAppearance.read());
    const initial = await read();
    const panel = await settings(page);
    const preset = panel.getByRole('button', { name: 'Pixel everywhere', exact: true });
    const classic = panel.getByRole('button', { name: 'Kiso classic', exact: true });
    assert.equal(await preset.getAttribute('aria-pressed'), 'false');
    assert.equal(await panel.locator('.appearance-presets').getByRole('button', { name: 'SNES', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(initial.shadowStyle, 'soft');
    assert.equal(initial.accent, 'snes');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), undefined);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light dark');
    await classic.click();
    const direct = await read();
    assert.equal(direct.appShell, 'default');
    assert.notEqual(direct.accent, 'snes', 'Kiso classic replaces the fields it does not define');
    assert.equal(await classic.getAttribute('aria-pressed'), 'true');
    await page.reload();
    assert.equal((await read()).appShell, 'default', 'Saved appearance is not overwritten by the new default');
    await settings(page);
    await panel.getByRole('button', { name: 'Reset', exact: true }).click();
    await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).click();
    await classic.click();
    assert.deepEqual(await read(), direct, 'Click order does not change the result');
    await (await field(panel, 'Accent')).getByRole('button', { name: 'Teal', exact: true }).click();
    assert.equal(await classic.getAttribute('aria-pressed'), 'false', 'A changed look is no longer the preset');
    assert.equal(await panel.locator('.appearance-presets [aria-pressed="true"]').count(), 0);
    assert.equal((await panel.getByRole('status').filter({ hasText: 'Current look' }).innerText()).trim(), 'Current look: Custom');
    await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).click();
    await preset.click();
    const look = await read();
    assert.equal(look.accent, direct.accent, 'Pixel everywhere drops the accent of the earlier preset');
    assert.equal(look.shadowStyle, 'hard');
    assert.equal(look.cornerStyle, 'pixel');
    await pickTheme(panel, 'Dark');
    assert.equal(await preset.getAttribute('aria-pressed'), 'true', 'Light or dark is not part of the look');
    await preset.click();
    assert.equal((await read()).theme, 'dark', 'A preset keeps the chosen theme');
    await panel.getByRole('button', { name: 'Manga board', exact: true }).click();
    await panel.getByRole('button', { name: 'Reset', exact: true }).click();
    assert.deepEqual(await read(), initial);
    await page.reload();
    assert.deepEqual(await read(), initial);
    if (screenshots) await page.screenshot({ path: `${screenshots}/pixel-default-${theme}.png` });
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Random changes appearance without losing theme at ${width}px`, async () => {
  const page = await open('components/form-field', width, 'dark');
  try {
    let seed = 42;
    await page.evaluate(seed => {
      Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
    }, seed);
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    const panel = await settings(page);
    await pickTheme(panel, 'Dark');
    const randomTile = panel.getByRole('button', { name: 'Random', exact: true });
    const pixelTile = panel.getByRole('button', { name: 'Pixel everywhere', exact: true });
    assert.equal(await randomTile.locator('svg').count(), 1, 'Random has a visual preview');
    const randomBox = await randomTile.boundingBox(), pixelBox = await pixelTile.boundingBox();
    assert(randomBox.y >= pixelBox.y, 'Random follows Pixel everywhere in the preset grid');
    assert.equal(await panel.locator('.appearance-composition').last().textContent().then(text => text.trim()), 'Random');
    await close(page);
    let previous = await page.evaluate(() => window.kisoAppearance.read());
    for (let i = 0; i < 12; i++) {
      await settings(page);
      const random = panel.getByRole('button', { name: 'Random', exact: true });
      await random.focus(); await page.keyboard.press('Enter');
      const next = await page.evaluate(() => window.kisoAppearance.read());
      assert.equal(next.theme, 'dark');
      assert.notDeepEqual(next, previous);
      await close(page);
      assert(await ram.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }));
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
        elements: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth && getComputedStyle(el).display !== 'none').slice(-12).map(el => [el.className, el.parentElement?.className, el.getBoundingClientRect().right]) }));
      assert(overflow.scroll <= overflow.width, JSON.stringify({ next, overflow }));
      previous = next;
    }
    await page.reload();
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), previous);
    await settings(page);
    if (screenshots) await page.screenshot({ path: `${screenshots}/random-${width}.png` });
  } finally { await page.close(); }
});

for (const [width, frame, theme] of [
  [1440, "Default", "light"], [1440, "Default", "dark"],
  [1440, "Inset", "light"], [1440, "Inset", "dark"],
]) test(`The generator keeps Reset above its scrolling options at ${width}px in ${frame}/${theme}`, async () => {
  const page = await open("components", width, theme);
  try {
    const panel = await settings(page);
    await (await field(panel, "Application frame")).getByRole("radio", { name: frame, exact: true }).check({ timeout: 15000 });
    assert(await panel.getByRole("heading", { name: "Theme generator", exact: true }).isVisible());
    for (const name of ["Colors and type", "Presets", "Background", "Charts", "Panels", "Where it applies", "Shell", "Phone", "Use in code"]) {
      await tab(panel, name);
      assert(await panel.getByRole("region", { name, exact: true }).isVisible());
    }
    const borders = (await field(panel, "Border style"));
    assert.equal(await borders.getByRole("radio").count(), 9);
    assert((await borders.boundingBox()).height <= 330, "Nine border choices fit in five compact rows");
    const rounded = panel.getByRole("radio", { name: /^Rounded / });
    await rounded.focus();
    await page.keyboard.press("Space");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "rounded");
    const reset = panel.getByRole("button", { name: "Reset", exact: true });
    const resetBox = await reset.boundingBox();
    const scroll = panel.locator(".gen-scroll:not([hidden])");
    await scroll.evaluate(el => el.scrollTo({ top: el.scrollHeight, behavior: "instant" }));
    assert(await scroll.evaluate(el => el.scrollTop > 0));
    assert.deepEqual(await reset.boundingBox(), resetBox, "Reset stays fixed while the options scroll");
    assert(resetBox.y + resetBox.height <= (await scroll.boundingBox()).y, "Reset sits above the scroll area");
    assert(await reset.evaluate(el => {
      const box = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), "Reset remains clickable without scrolling back up");
    assert.equal(await panel.evaluate(el => el.scrollTop), 0, "Only the options own the vertical scroll position");
    await reset.click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "rounded");
  } finally { await page.close(); }
});

for (const frame of ["Default", "Inset"]) test(`Both rails release space independently and retain demo state in ${frame}`, async () => {
  const page = await open("components/table");
  try {
    await (await field(await settings(page), "Application frame")).getByRole("radio", { name: frame, exact: true }).check();
    await close(page);
    const panel = page.locator("#gallery-settings");
    await panel.waitFor();
    const main = page.locator('.component-gallery > [data-slot="app-shell-main"]');
    const width = async () => (await main.boundingBox()).width;
    const start = await width();
    const section = panel.getByRole("region", { name: "Table options", exact: true });
    await section.getByRole("combobox", { name: /^Density/ }).selectOption("spacious");
    await section.getByRole("combobox", { name: /^Frame/ }).selectOption("none");
    await section.getByRole("combobox", { name: /^Header/ }).selectOption("plain");
    await page.getByRole("button", { name: /work_mem/ }).click();
    assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
    assert.equal(await page.getByRole("table").getAttribute("data-density"), "spacious");
    assert.equal(await page.getByRole("table").getAttribute("data-header"), "plain");
    const initialPanelBox = await panel.boundingBox();
    const sidebarWidth = () => page.locator(".component-gallery .catalog-sidebar").evaluate(el => el.getBoundingClientRect().width);
    const sidebarOpen = await sidebarWidth();
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await page.getByRole("button", { name: "Expand navigation", exact: true }).waitFor();
    await page.locator(".component-gallery .catalog-sidebar:not([data-panel-motion])").waitFor();
    const released = sidebarOpen - await sidebarWidth();
    assert(released > 150 && await width() >= start + released - 1);
    assert.equal((await panel.boundingBox()).width, initialPanelBox.width);
    await panel.getByRole("button", { name: "Close options", exact: true }).click();
    await panel.waitFor({ state: "hidden" });
    assert(await width() > start + released + 250);
    assert.equal((await page.locator(".catalog-detail").boundingBox()).width, await main.evaluate(el => el.clientWidth));
    await page.waitForFunction(() => document.activeElement?.getAttribute("href") === "#gallery-settings");
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-rails-closed-${frame}.png` });
    await page.locator('a[href="#gallery-settings"]').click();
    await panel.waitFor();
    assert.equal(await section.getByRole("combobox", { name: /^Density/ }).inputValue(), "spacious");
    assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
    await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).waitFor();
    await page.locator(".component-gallery .catalog-sidebar:not([data-panel-motion])").waitFor();
    assert.equal(await width(), start);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Rounded is one type with independent size and border choices at ${width}px`, async () => {
  const page = await open("components/table", width);
  try {
    let panel = await settings(page);
    let corners = await group(panel, "Panels");
    const choices = corners.getByRole("group", { name: "Corner type", exact: true });
    assert.equal(await choices.getByRole("radio").count(), 4);
    await choices.getByRole("radio", { name: /^Square / }).check();
    const size = corners.getByRole("radiogroup", { name: "Corner size", exact: true });
    assert.equal(await size.count(), 0, "Square hides size adjustments");
    await choices.getByRole("radio", { name: /^Rounded / }).check();
    assert.equal(await size.getByRole("radio", { name: "Off", exact: true }).count(), 0);
    const table = page.locator(".catalog-preview .table-wrap");
    const tableRadius = async () => {
      await close(page);
      const value = await table.evaluate(el => getComputedStyle(el).borderTopLeftRadius);
      await settings(page);
      await tab(panel, "Panels");
      return value;
    };
    for (const [size, radius] of [["Small", "8px"], ["Medium", "16px"], ["Large", "24px"]]) {
      await corners.getByRole("radiogroup", { name: "Corner size", exact: true }).getByRole("radio", { name: size, exact: true }).check();
      assert.equal(await tableRadius(), radius);
    }
    await choices.getByRole("radio", { name: /^Square / }).check();
    assert.equal(await size.count(), 0);
    await choices.getByRole("radio", { name: /^Asymmetric / }).check();
    assert.equal(await size.getByRole("radio", { name: "Off", exact: true }).count(), 0);
    assert.equal(await tableRadius(), "18px");
    await choices.getByRole("radio", { name: /^Rounded / }).check();
    assert(await size.getByRole("radio", { name: "Large", exact: true }).isChecked(), "Switching shapes retains the last size");
    const large = size.getByRole("radio", { name: "Large", exact: true });
    await large.focus(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowRight"); await page.waitForFunction(() => document.activeElement?.value === "small"); await page.keyboard.press("Space");
    assert(await size.getByRole("radio", { name: "Small", exact: true }).isChecked(), "Keyboard navigation wraps without an Off choice");
    const borders = (await field(panel, "Border style"));
    assert.equal(await borders.getByRole("radio").count(), 9);
    for (const border of ["none", "dash", "solid"]) {
      await borders.locator(`input[value="${border}"]`).check();
      assert.equal(await tableRadius(), "8px");
    }
    await page.reload();
    panel = await settings(page);
    corners = await group(panel, "Panels");
    assert(await corners.getByRole("radio", { name: /^Rounded / }).isChecked());
    assert(await corners.getByRole("radiogroup", { name: "Corner size", exact: true }).getByRole("radio", { name: "Small", exact: true }).isChecked());
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-corner-settings-${width}.png` });
    await panel.getByRole("button", { name: "Reset", exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "rounded");
  } finally { await page.close(); }
});

test("Component options replace each other and open on arrival without resetting global appearance", async () => {
  const page = await open("components/table");
  try {
    let panel = await settings(page);
    await pickTheme(panel, "Light");
    for (const [route, title, control, value] of [["app-shell", "ApplicationShell options", /^Sidebar toggle placement/, "header"], ["form-field", "Inline fields options", /^Control size/, "lg"]]) {
      await close(page);
      await page.goto(`${url}#components/${route}`);
      panel = page.locator("#gallery-settings");
      await panel.waitFor();
      const options = panel.getByRole("region", { name: title, exact: true });
      assert(await options.isVisible());
      const sectionBox = await options.boundingBox();
      const scrollBox = await panel.getByRole("region", { name: "Demo options list" }).boundingBox();
      assert(sectionBox.y >= scrollBox.y && sectionBox.y + sectionBox.height <= scrollBox.y + scrollBox.height + 1, "Current component controls scroll into view");
      assert.equal(await panel.locator(".gallery-component-settings > section").count(), 1);
      await options.getByRole("combobox", { name: control }).selectOption(value);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
      assert.equal(await page.locator(".catalog-preview .demo-settings-inline").count(), 0);
    }
    await page.goto(`${url}#components/alert`);
    await page.getByRole("group", { name: "Alert options", exact: true }).waitFor();
    assert.equal(await panel.locator(".gallery-component-settings > section").count(), 0);
    await page.goto(`${url}#intro`);
    await panel.waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("link", { name: "Appearance", exact: true }).count(), 0);
    await page.goto(`${url}#example`);
    assert.equal(await page.locator(".gallery-settings-trigger").count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
  } finally { await page.close(); }
});

for (const colorScheme of ["light", "dark"]) test(`Alert has one live preview for every severity and appearance in ${colorScheme}`, async () => {
  const page = await open("components/alert", 1440, colorScheme);
  try {
    const controls = page.getByRole("group", { name: "Alert options", exact: true });
    assert(await controls.isVisible());
    const alert = page.locator(".catalog-preview .alert");
    assert.equal(await alert.count(), 1);
    await page.locator(".catalog-preview .catalog-code summary").click();
    const code = page.locator(".catalog-preview .catalog-code pre");
    for (const appearance of ["tinted", "rail"]) for (const severity of ["info", "success", "warning", "error"]) {
      await controls.getByRole("combobox", { name: "Appearance", exact: true }).selectOption(appearance);
      await controls.getByRole("combobox", { name: "Severity", exact: true }).selectOption(severity);
      assert.equal(await alert.getAttribute("role"), "note");
      assert.equal((await code.textContent()).split("\n")[0], `<Alert${severity === "info" ? "" : ` variant="${severity}"`}${appearance === "rail" ? ' appearance="rail"' : ""} role="note">`);
      assert.equal(await alert.locator(".alert-label").textContent(), { info: "Info · Maintenance tonight", success: "Success · Failover complete", warning: "Warning · Disk almost full", error: "Error · Database unreachable" }[severity]);
      assert.equal(await alert.evaluate(el => el.classList.contains("alert-rail")), appearance === "rail");
      if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-alert-${appearance}-${severity}-${colorScheme}.png` });
    }
    await settings(page); await close(page);
    assert.equal(await controls.getByRole("combobox", { name: "Severity", exact: true }).inputValue(), "error");
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Appearance usage copies current settings from any page at ${width}px`, async () => {
  const page = await open("components/alert", width);
  try {
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } }));
    const panel = await settings(page);
    await pickTheme(panel, "Dark");
    await (await field(panel, "Visual style")).getByRole("radio", { name: "Editorial", exact: true }).check();
    const usage = await group(panel, "Use in code");
    const saved = await page.evaluate(() => window.kisoAppearance.read());
    const code = appearanceCode(saved);
    const html = usage.locator('code[data-language="html"]');
    assert.equal(await html.textContent(), code.html);
    assert((await html.locator("span").evaluateAll(els => [...new Set(els.map(el => getComputedStyle(el).color))])).length >= 3);
    await usage.getByRole("button", { name: "Copy HTML", exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedText), code.html);
    await usage.getByRole("button", { name: "Copy JavaScript", exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedText), code.javascript);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

test("Old Appearance bookmarks open the Theme generator", async () => {
  const page = await open("appearance");
  try {
    await page.waitForURL(`${url}#theme`);
    await page.locator(".gen-workspace").waitFor();
    assert.equal(await page.locator("#gallery-settings").isVisible(), false);
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Canvas choices and independent outer styles persist at ${width}px`, async () => {
  const page = await open('components/card', width);
  try {
    let panel = await settings(page);
    await (await field(panel, 'Application frame')).getByRole('radio', { name: 'Inset', exact: true }).check();
    await (await field(panel, 'Canvas background')).getByRole('radio', { name: 'Momoi watermark', exact: true }).check();
    await (await field(panel, 'Panel fill')).getByRole('radio', { name: 'Translucent', exact: true }).check();
    await tab(panel, 'Where it applies');
    await (await field(panel, 'Outer border')).locator('input[value="brush"]').check();
    await (await field(panel, 'Apply frames to')).getByRole('radio', { name: scopeName.panels, exact: true }).check();
    await (await field(panel, 'Apply marks to')).getByRole('radio', { name: scopeName.outer, exact: true }).check();
    await (await field(panel, 'Outer marks')).locator('input[value="none"]').check();
    assert.equal(await panel.getByRole('group', { name: 'Outer corners', exact: true }).count(), 0, 'Brush owns the outer contour');
    const selected = await page.evaluate(() => ({ ...document.documentElement.dataset }));
    assert.equal(selected.borderStyle, 'solid', 'Outer Brush does not change inner borders');
    assert.equal(selected.backgroundStyle, 'momoi');
    assert.equal(selected.panelFill, 'translucent');
    await tab(panel, 'Use in code');
    assert((await panel.locator('.appearance-usage').innerText()).includes('data-outer-border-style="brush"'));
    await page.reload(); panel = await settings(page);
    assert(await (await field(panel, 'Canvas background')).getByRole('radio', { name: 'Momoi watermark', exact: true }).isChecked());
    await tab(panel, 'Where it applies');
    assert(await (await field(panel, 'Outer border')).locator('input[value="brush"]').isChecked());
    assert(await (await field(panel, 'Apply marks to')).getByRole('radio', { name: scopeName.outer, exact: true }).isChecked());
    await panel.getByRole('button', { name: 'Reset', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.backgroundStyle), 'glow');
    assert(await (await field(panel, 'Outer border')).locator('input[value="none"]').isChecked());
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Switching the application frame keeps the canvas paper in ${theme}`, async () => {
  const page = await open('intro', 1440, theme);
  try {
    const panel = await settings(page);
    const frames = panel.getByRole('radiogroup', { name: 'Application frame', exact: true });
    // The paper under the pattern is the inset shell's ::after layer, else the shell or page background.
    const paper = () => page.evaluate(() => {
      const shell = document.querySelector('.app-shell'), layer = getComputedStyle(shell, '::after');
      const clear = color => color === 'rgba(0, 0, 0, 0)';
      if (layer.content !== 'none' && !clear(layer.backgroundColor)) return layer.backgroundColor;
      const own = getComputedStyle(shell).backgroundColor;
      return clear(own) ? getComputedStyle(document.body).backgroundColor : own;
    });
    for (const preset of ['Manga board', 'Blueprint', 'Pixel everywhere']) {
      await tab(panel, 'Presets');
      await panel.getByLabel('Presets').getByRole('button', { name: preset, exact: true }).click();
      await tab(panel, 'Application frame');
      await frames.getByRole('radio', { name: 'Default', exact: true }).check();
      const expected = await paper();
      await frames.getByRole('radio', { name: 'Inset', exact: true }).check();
      assert.equal(await paper(), expected, `${preset}: an inset frame keeps the paper of the default frame`);
    }
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`An inset frame surround matches the canvas paper in ${theme}`, async () => {
  const page = await open('components', 1440, theme);
  try {
    // The component pages show the sidebar, and the settings panel shows its side panel.
    await settings(page);
    const colors = (token) => page.evaluate(token => {
      const shell = document.querySelector('.app-shell'), probe = document.createElement('span');
      probe.style.color = token; shell.append(probe);
      const resolved = getComputedStyle(probe).color; probe.remove();
      const side = [...shell.querySelectorAll(':scope > :is(.sidebar, .app-shell-panel)')].filter(el => getComputedStyle(el).display !== 'none').map(el => getComputedStyle(el).backgroundColor);
      return { ring: getComputedStyle(shell).backgroundColor, side, resolved };
    }, token);
    for (const paperTone of ['theme', 'accent']) for (const backgroundStyle of ['momoi-repeat', 'fibers', 'construction']) for (const backgroundPlacement of ['inside', 'outside', 'both']) {
      await page.evaluate(settings => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, theme: 'system', appShell: 'inset', ...settings }), { paperTone, backgroundStyle, backgroundPlacement });
      const { ring, side, resolved } = await colors('var(--canvas-fill, var(--color-background))');
      assert.equal(ring, resolved, `${paperTone}/${backgroundStyle}/${backgroundPlacement}: the area around an inset frame uses the canvas paper`);
      assert.deepEqual(side, side.map(() => resolved), `${paperTone}/${backgroundStyle}/${backgroundPlacement}: the side panels use the canvas paper`);
    }
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, theme: 'system', appShell: 'inset', backgroundStyle: 'solid' }));
    const solid = await colors('var(--color-sidebar)');
    assert.equal(solid.ring, solid.resolved, 'A solid background keeps the sidebar color around the frame');
  } finally { await page.close(); }
});

test('Legacy selections remain explicit until replaced, and incompatible choices retain state', async () => {
  const page = await open('components/card');
  try {
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, borderStyle: 'bevel', cornerMarks: 'dots' }));
    await page.reload();
    const panel = await settings(page);
    await tab(panel, 'Panels');
    assert(await panel.getByRole('radio', { name: /^Inset edge \(legacy\)/ }).isChecked());
    assert(await panel.getByRole('radio', { name: 'Corner dots (legacy)', exact: true }).isChecked());
    await (await field(panel, 'Border style')).getByRole('radio', { name: /^Solid / }).check();
    assert.equal(await panel.getByRole('radio', { name: /^Inset edge \(legacy\)/ }).count(), 0);
    await panel.getByRole('radio', { name: /^Pixel classic / }).check();
    assert(await panel.getByRole('radio', { name: /^Dashed outline / }).isDisabled());
    assert(await (await field(panel, 'Corner marks')).getByRole('radio', { name: 'Curved brackets', exact: true }).isDisabled());
    await panel.getByRole('radio', { name: /^Brush frame / }).check();
    assert.equal(await panel.getByRole('radio', { name: /^Pixel classic / }).count(), 0, 'Brush hides the corner choices');
    assert.equal(await page.evaluate(() => window.kisoAppearance.read().cornerStyle), 'pixel', 'Brush retains the selected corner');
  } finally { await page.close(); }
});

for (const [width, theme] of [[320, 'dark'], [390, 'light'], [1440, 'dark']]) test(`Visual settings reproduce the Blueprint study at ${width}px in ${theme}`, async () => {
  const page = await open('appearance', width, theme);
  try {
    await page.locator('.gen-workspace').waitFor();
    await plain(page);
    let panel = await settings(page);
    await pickTheme(panel, theme === 'dark' ? 'Dark' : 'Light');
    await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).click();
    const saved = await page.evaluate(() => window.kisoAppearance.read());
    for (const [key, value] of Object.entries({ theme, accent: 'blueprint', paperTone: 'theme', backgroundStyle: 'construction', backgroundPlacement: 'both', backgroundStrength: 'quiet', outerBorderStyle: 'solid', borderStyle: 'solid', cornerStyle: 'square', cornerMarks: 'ticks', frameScope: 'all', markScope: 'panels', markClearance: 'sheet', shadowStyle: 'none', technicalText: 'mono', controlStyle: 'tactile', progressStyle: 'segmented', panelLabels: 'numbered', chartPalette: 'mono' })) assert.equal(saved[key], value, key);
    await tab(panel, 'Presets');
    assert(await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).getAttribute('aria-pressed') === 'true');
    assert(await (await field(panel, 'Canvas background')).getByRole('radio', { name: 'Construction lines', exact: true }).isEnabled(), 'The module grid remains available');
    await tab(panel, 'Where it applies');
    for (const label of ['Outer border', 'Outer corners', 'Outer marks']) {
      const choices = await field(panel, label);
      for (const option of await choices.locator('label.appearance-option').all()) {
        assert.equal(await option.locator('svg[aria-hidden="true"], .appearance-background-sample[aria-hidden="true"]').count(), 1, `${label} has a decorative preview for every choice`);
      }
    }
    const placement = (await field(panel, 'Pattern placement'));
    const inside = placement.getByRole('radio', { name: 'Inside frame', exact: true });
    await inside.focus(); await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => document.activeElement?.value === 'both'); await page.keyboard.press('Space');
    assert(await placement.getByRole('radio', { name: 'Both', exact: true }).isChecked());
    assert.equal(await page.evaluate(() => document.documentElement.dataset.backgroundPlacement), 'both');
    await page.keyboard.press('ArrowLeft'); await page.waitForFunction(() => document.activeElement?.value === 'inside'); await page.keyboard.press('Space');
    await (await field(panel, 'Panel fill')).getByRole('radio', { name: 'Translucent', exact: true }).check();
    const borders = (await field(panel, 'Border style'));
    const thumbnail = borders.locator('label:has(input[value="double"]) svg');
    const before = await thumbnail.innerHTML();
    await (await field(panel, 'Apply frames to')).getByRole('radio', { name: 'Outer only', exact: true }).check();
    assert.equal(await thumbnail.innerHTML(), before, 'Outer-only styling cannot erase option drawings');
    await tab(panel, 'Presets');
    await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).click();
    await page.reload(); panel = await settings(page);
    assert(await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).getAttribute('aria-pressed') === 'true');
    await close(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (screenshots) await page.screenshot({ path: `${screenshots}/blueprint-study-${width}-${theme}.png`, fullPage: true });
    panel = await settings(page);
    await panel.getByRole('button', { name: 'Reset', exact: true }).click();
  } finally { await page.close(); }
});

test('Landing Intro scrolls through its closing section', async () => {
  const page = await open('intro', 1587, 'dark');
  try {
    await page.setViewportSize({ width: 1587, height: 934 });
    const navigation = page.getByRole('button', { name: 'Collapse navigation', exact: true });
    if (await navigation.count()) await navigation.click();
    const content = page.locator('.catalog-intro');
    const geometry = await content.evaluate(el => ({ content: el.scrollHeight, viewport: el.clientHeight }));
    assert(geometry.content > geometry.viewport, `The landing has multiple sections: ${JSON.stringify(geometry)}`);
    await page.setViewportSize({ width: 1587, height: 600 });
    assert(await content.evaluate(el => el.scrollHeight > el.clientHeight), 'Short viewports still allow genuine content scrolling');
    await content.evaluate(el => el.scrollTop = el.scrollHeight);
    const last = page.locator('.studio-footer');
    const viewport = await content.boundingBox(), box = await last.boundingBox();
    assert(box.y >= viewport.y - 1 && box.y + box.height <= viewport.y + viewport.height + 1);
    if (screenshots) await page.screenshot({ path: `${screenshots}/intro-short-viewport.png` });
  } finally { await page.close(); }
});

test('Intro keeps its reading width while scrolling at the frame edge', async () => {
  const page = await open('appearance', 1920);
  try {
    const panel = await settings(page);
    await (await field(panel, 'Application frame')).getByRole('radio', { name: 'Inset', exact: true }).check();
    await close(page);
    const geometry = await page.evaluate(() => {
      const main = document.querySelector('.component-gallery > [data-slot="app-shell-main"]');
      const scroll = main.querySelector('.catalog-main');
      const frame = main.getBoundingClientRect(), content = scroll.getBoundingClientRect();
      return { gap: frame.right - content.right, readingWidth: main.querySelector('.intro-description').getBoundingClientRect().width, overflow: getComputedStyle(scroll).overflowY };
    });
    assert(geometry.gap <= 2, `Scrollbar is next to the border, gap was ${geometry.gap}px`);
    assert(geometry.readingWidth <= 720, 'Text does not expand to viewport width');
    assert.equal(geometry.overflow, 'auto');
  } finally { await page.close(); }
});

// Intro has no sidebar, so the toggles are measured on a section page.
for (const [width, theme] of fullSweep ? [[320, 'dark'], [390, 'light'], [1200, 'dark'], [1680, 'light']] : [[390, 'light']]) test(`Every gallery sample survives appearance transitions at ${width}px in ${theme}`, async () => {
  const page = await open('components', width, theme);
  const failures = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const inspect = () => page.locator('.catalog-pane-grid > .pane-grid-body > .catalog-pane').evaluateAll(sections => sections.map(section => {
      const preview = section.querySelector('.catalog-preview');
      const box = section.getBoundingClientRect();
      // Ink and marks may extend into the card's padding. They must stay within
      // their allocated sample, not enter the neighboring masonry column.
      const paintRight = preview.getBoundingClientRect().right + preview.scrollWidth - preview.clientWidth;
      return { id: section.dataset.paneId, width: box.width, height: box.height, overflow: Math.max(0, paintRight - box.right) };
    }));
    const initial = await inspect();
    assert.equal(initial.length, 85, 'The sweep covers every current catalog sample');
    const baseline = Object.fromEntries(initial.map(item => [item.id, item.overflow]));
    for (const preset of ['Blueprint', 'Pixel workshop', 'Manga board', 'Brush study', 'Momoi signature', 'Pixel everywhere', 'Manga panels', 'Brush panels']) {
      const panel = await settings(page);
      await tab(panel, 'Presets');
      await panel.getByLabel('Presets').getByRole('button', { name: preset.endsWith('panels') ? 'Blueprint' : preset, exact: true }).click();
      if (preset.endsWith('panels')) await (await field(panel, 'Border style')).locator(`input[value="${preset.startsWith('Manga') ? 'manga' : 'brush'}"]`).check();
      // Exercise changes after applying a preset, not only static snapshots.
      for (const scope of ['all', 'panels', 'outer']) {
        await (await field(panel, 'Apply frames to')).getByRole('radio', { name: scopeName[scope], exact: true }).check();
        await (await field(panel, 'Apply marks to')).getByRole('radio', { name: scopeName[scope], exact: true }).check();
        await (await field(panel, 'Panel fill')).getByRole('radio', { name: scope === 'panels' ? 'Solid' : 'Translucent', exact: true }).check();
        await (await field(panel, 'Visual style')).getByRole('radio', { name: scope === 'panels' ? 'Editorial' : 'Default', exact: true }).check();
        await (await field(panel, 'Mark clearance')).getByRole('radio', { name: scope === 'all' ? 'Drawing sheet' : 'Normal', exact: true }).check();
        await tab(panel, 'Where it applies');
        const detail = (await field(panel, 'Border detail'));
        if (await detail.count()) await detail.getByRole('radio', { name: scope === 'all' ? 'Large' : 'Small', exact: true }).check();
        await close(page);
        // ResizeObserver positions the masonry cards after the style change.
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const state = `${preset}/${scope}`;
        for (const item of await inspect()) {
          if (item.width <= 0 || item.height <= 0 || item.overflow > Math.max(1, baseline[item.id])) failures.push({ state, ...item, baseline: baseline[item.id] });
        }
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) failures.push({ state, documentOverflow: true });
        await settings(page);
      }
    }
    if (screenshots) await writeFile(`${screenshots}/appearance-sweep-${width}-${theme}.json`, JSON.stringify({ initial, failures, errors }, null, 2));
    assert.deepEqual(errors, [], 'Appearance changes do not throw in any mounted sample');
    assert.deepEqual(failures, [], 'Appearance does not collapse samples or introduce horizontal overflow');
  } finally { await page.close(); }
});

for (const [width, theme] of [[390, 'light'], [1200, 'dark']]) test(`New frames keep editing, selection and modal actions working at ${width}px in ${theme}`, async () => {
  const page = await open('components/form-field', width, theme);
  try {
    let panel = await settings(page);
    await close(page);
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    await ram.fill('24');
    const os = page.getByRole('combobox', { name: 'OS', exact: true });
    await os.click(); await page.getByRole('option', { name: 'macOS', exact: true }).click();
    for (const frame of ['pixel', 'manga', 'brush']) {
      await close(page);
      await plain(page);
      panel = await settings(page);
      await tab(panel, 'Presets');
      await panel.getByLabel('Presets').getByRole('button', { name: 'Blueprint', exact: true }).click();
      if (frame === 'pixel') await (await field(panel, 'Corner type')).locator('input[value="pixel"]').check();
      else await (await field(panel, 'Border style')).locator(`input[value="${frame}"]`).check();
      for (const scope of ['all', 'panels', 'outer']) {
        await (await field(panel, 'Apply frames to')).getByRole('radio', { name: scopeName[scope], exact: true }).check();
        await (await field(panel, 'Apply marks to')).getByRole('radio', { name: scopeName[scope], exact: true }).check();
        await (await field(panel, frame === 'pixel' ? 'Corner size' : 'Border detail')).getByRole('radio', { name: scope === 'all' ? 'Large' : 'Small', exact: true }).check();
        await close(page);
        await ram.fill('24');
        await os.click(); await page.getByRole('option', { name: 'macOS', exact: true }).click();
        assert.match(await os.textContent(), /macOS/);
        assert(await page.getByRole('textbox', { name: 'Managed value', exact: true }).isDisabled());
        await ram.fill('0'); assert.equal(await ram.getAttribute('aria-invalid'), 'true');
        await ram.fill('24'); await ram.focus();
        assert.equal(await ram.evaluate(el => getComputedStyle(el.closest('.field-control')).outlineWidth), '2px');
        await os.click(); await page.getByRole('option', { name: 'GNU/Linux', exact: true }).click();
        await os.click(); await page.getByRole('option', { name: 'macOS', exact: true }).click();
        if (screenshots && scope === 'all') await page.screenshot({ path: `${screenshots}/fields-${frame}-${width}-${theme}.png` });
        panel = await settings(page);
      }
    }
    await close(page);
    await page.goto(`${url}#components/modal-dialog`);
    for (const frame of ['pixel', 'manga', 'brush']) {
      await close(page);
      await plain(page);
      panel = await settings(page);
      await tab(panel, 'Presets');
      await panel.getByLabel('Presets').getByRole('button', { name: frame === 'pixel' ? 'Pixel everywhere' : 'Blueprint', exact: true }).click();
      if (frame !== 'pixel') await (await field(panel, 'Border style')).locator(`input[value="${frame}"]`).check();
      await (await field(panel, frame === 'pixel' ? 'Corner size' : 'Border detail')).getByRole('radio', { name: 'Large', exact: true }).check();
      await close(page);
      const trigger = page.getByRole('button', { name: 'Edit project', exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Edit project', exact: true });
      await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Retained project');
      const save = dialog.getByRole('button', { name: 'Save changes', exact: true });
      await save.scrollIntoViewIfNeeded();
      assert(await save.evaluate(el => { const b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)); }), `${frame}: frame does not cover the action`);
      if (screenshots) await page.screenshot({ path: `${screenshots}/dialog-${frame}-${width}-${theme}.png` });
      await save.click(); await dialog.waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.activeElement?.textContent === 'Edit project');
      assert(await page.getByText('Example changes saved.', { exact: true }).isVisible());
    }
  } finally { await page.close(); }
});

for (const theme of ['light', 'dark']) test(`Native select options stay readable and usable through frame changes in ${theme}`, async () => {
  const page = await open('components', 1440, theme);
  try {
    await page.locator('[data-pane-id="table"]').scrollIntoViewIfNeeded();
    const select = page.getByRole('combobox', { name: 'Header', exact: true });
    const table = page.getByRole('table', { name: 'Memory comparison', exact: true });
    const contrast = (foreground, background) => {
      const luminance = color => {
        const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
          value /= 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      const a = luminance(foreground), b = luminance(background);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    };
    let minimum = Infinity;
    for (const frame of ['solid', 'pixel', 'manga', 'brush']) {
      for (const fill of ['solid', 'translucent']) {
        for (const accent of ['violet', 'terracotta', 'teal', 'cobalt', 'nocturne']) {
          await page.evaluate(({ frame, fill, accent }) => window.kisoAppearance.save({
            ...window.kisoAppearance.defaults, theme: 'system', accent,
            borderStyle: frame === 'pixel' ? 'solid' : frame,
            cornerStyle: frame === 'pixel' ? 'pixel' : 'square',
            frameScope: 'all', markScope: 'all', cornerMarks: 'ticks',
            backgroundStyle: 'fibers', panelFill: fill, paperTone: 'accent',
          }), { frame, fill, accent });
          const state = `${frame}/${fill}/${accent}`;
          const colors = await select.locator('option').evaluateAll(options => options.map(option => {
            const css = getComputedStyle(option);
            return { color: css.color, background: css.backgroundColor };
          }));
          for (const option of colors) {
            assert.match(option.background, /^rgb\(/, `${state}: native options have opaque backgrounds`);
            const ratio = contrast(option.color, option.background);
            minimum = Math.min(minimum, ratio);
            assert(ratio >= 4.5, `${state}: native option text contrast is ${ratio.toFixed(2)}:1`);
          }
          assert.match(await select.evaluate(el => getComputedStyle(el).backgroundImage), /svg\+xml/, `${state}: select chevron survives frame and mark layers`);
        }
        await select.focus();
        await select.press('ArrowDown');
        await select.press('Enter');
        assert.equal(await select.inputValue(), 'plain');
        assert.equal(await table.getAttribute('data-header'), 'plain', `${frame}/${fill}: keyboard selection updates the real table`);
        await select.press('ArrowUp');
        await select.press('Enter');
        assert.equal(await select.inputValue(), 'tinted');
        assert.equal(await table.getAttribute('data-header'), 'tinted');
      }
    }
    console.log(`Native select option contrast in ${theme}: at least ${minimum.toFixed(2)}:1`);
    if (screenshots) await select.locator('..').screenshot({ path: `${screenshots}/native-select-${theme}.png` });
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Navigation stays reachable on Intro and after route changes at ${width}px`, async () => {
  const page = await open('intro', width);
  try {
    const phone = width < 700;
    const expanded = 'Collapse navigation';
    const collapsed = phone ? 'Browse' : 'Expand navigation';
    const nav = page.getByRole('navigation', { name: 'Component categories', exact: true });
    // A desktop Intro is the home and has no sidebar; a phone opens the drawer.
    if (phone) {
      await page.getByRole('button', { name: collapsed, exact: true }).click();
      assert(await nav.isVisible());
      await page.keyboard.press('Escape');
    } else assert.equal(await nav.isVisible(), false, 'Intro has no sidebar on desktop');
    await page.getByRole('navigation', { name: 'Preview pages', exact: true }).getByRole('link', { name: /^Components\b/ }).click();
    await page.waitForURL(`${url}#components`);
    await page.getByRole('button', { name: phone ? collapsed : expanded, exact: true }).waitFor();
    if (!phone) assert(await nav.isVisible(), 'Section pages open the sidebar');
    // The brand sits in the sidebar header, the floating bar or the phone's top bar.
    await page.locator('.component-gallery .catalog-brand:visible').first().click({ timeout: 30_000 });
    await page.waitForURL(`${url}#intro`);
    if (phone) {
      await page.getByRole('button', { name: collapsed, exact: true }).waitFor();
      await page.getByRole('button', { name: collapsed, exact: true }).click();
    }
    await nav.waitFor({ state: phone ? 'visible' : 'hidden' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Panel style, outer overrides and Pixel size remain distinct at ${width}px`, async () => {
  const page = await open('intro', width);
  try {
    const panel = await settings(page);
    await (await field(panel, 'Corner type')).locator('input[value="pixel"]').check();
    const size = (await field(panel, 'Corner size'));
    assert.equal(await size.getByRole('radio', { name: 'Off', exact: true }).count(), 0);
    assert.equal(await panel.getByRole('radiogroup', { name: 'Border detail', exact: true }).count(), 0, 'Pixel has only one size control');
    const card = page.locator('.hero-panel-project .card');
    const geometries = [];
    for (const name of ['Small', 'Medium', 'Large']) {
      await settings(page);
      await tab(panel, 'Corner size');
      await size.getByRole('radio', { name, exact: true }).check();
      await close(page);
      geometries.push(await card.evaluate(el => getComputedStyle(el, '::before').clipPath));
    }
    assert.equal(new Set(geometries).size, 3, 'All three choices change the rendered steps');
    await settings(page);
    await tab(panel, 'Corner size');
    await size.getByRole('radio', { name: 'Large', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.activeElement?.value === 'small');
    await page.keyboard.press('Space');
    assert(await size.getByRole('radio', { name: 'Small', exact: true }).isChecked(), 'Arrow navigation wraps without an Off choice');
    await (await field(panel, 'Outer border')).getByRole('radio', { name: 'Brush frame', exact: true }).check();
    const detail = (await field(panel, 'Border detail'));
    assert.equal(await detail.count(), 1, 'Border detail appears once');
    await detail.getByRole('radio', { name: 'Large', exact: true }).check();
    await close(page);
    assert.equal(await card.evaluate(el => getComputedStyle(el, '::before').clipPath), geometries[0], 'Brush detail does not resize Pixel');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.outerBorderStyle), 'brush');
    await page.reload();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerSize), 'small');
    await settings(page);
    await (await field(panel, 'Outer border')).getByRole('radio', { name: 'Same as panels', exact: true }).check();
    assert.equal(await panel.getByRole('radiogroup', { name: 'Border detail', exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.outerBorderStyle), 'inherit');
    await tab(panel, 'Presets');
    await panel.getByRole('button', { name: 'Pixel workshop', exact: true }).click();
    const marks = (await field(panel, 'Mark size'));
    await marks.getByRole('radio', { name: 'Large', exact: true }).check();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.markSize), 'large', 'Outer-only marks retain an enabled size control');
    if (screenshots) await page.screenshot({ path: `${screenshots}/appearance-organization-${width}.png` });
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Use in code appears once, only in the Code tab, at ${width}px`, async () => {
  const page = await open('components/alert', width);
  try {
    const panel = await settings(page);
    for (const name of ['Look', 'Layout', 'Canvas', 'Frame', 'Phone']) {
      await tab(panel, name);
      assert.equal(await panel.getByRole('heading', { name: 'Use in code', exact: true }).count(), 0, `${name} does not show the code`);
    }
    await tab(panel, 'Code');
    const usage = panel.getByRole('region', { name: 'Use in code', exact: true });
    assert(await usage.isVisible());
    assert.equal(await panel.locator('.appearance-usage').count(), 1, 'One usage block in the generator');
    assert.equal(await usage.evaluate(el => document.getElementById(el.closest('[role="tabpanel"]').getAttribute('aria-labelledby')).textContent), 'Code');
    assert.equal(await usage.getByRole('button', { name: 'Copy HTML', exact: true }).count(), 1);
    const list = panel.getByRole('tablist', { name: 'Settings groups', exact: true });
    assert(await list.evaluate(el => el.scrollWidth <= el.clientWidth), 'The tabs fit without sideways scrolling');
    await panel.getByRole('tab', { name: 'Look', exact: true }).click();
    await page.keyboard.press('ArrowDown');
    await panel.getByRole('tab', { name: 'Layout', exact: true, selected: true }).waitFor();
  } finally { await page.close(); }
});

test('Plain header preference stays transparent and static in a desktop inset shell', async () => {
  const page = await open('intro', 1280);
  try {
    for (const theme of ['light', 'dark']) for (const panelFill of ['solid', 'glass']) {
      await page.evaluate(({ theme, panelFill }) => window.kisoAppearance.save({
        ...window.kisoAppearance.read(), appShell: 'inset', headerVariant: 'plain', theme, panelFill,
      }), { theme, panelFill });
      const actual = await page.locator('.catalog-header').evaluate(el => {
        const css = getComputedStyle(el);
        return { position: css.position, fill: css.backgroundColor, layer: getComputedStyle(el, '::before').content };
      });
      assert.deepEqual(actual, { position: 'static', fill: 'rgba(0, 0, 0, 0)', layer: 'none' }, `${theme}/${panelFill}`);
    }
  } finally { await page.close(); }
});

test('A floating header with an outer-only large Manga frame stays inside the page', async () => {
  const page = await open('components', 1440);
  try {
    await page.evaluate(() => window.kisoAppearance.save({
      ...window.kisoAppearance.read(), appShell: 'inset', headerVariant: 'floating', borderStyle: 'manga',
      frameDetail: 'large', frameScope: 'outer', shadowStyle: 'soft',
    }));
    await page.reload();
    await page.locator('.catalog-header').waitFor();
    assert.deepEqual(await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]), [1440, 1440]);
  } finally { await page.close(); }
});


function sharedMarkCorners() {
  const corners = [];
  const walk = (doc, ox, oy, scale) => {
    const win = doc.defaultView;
    for (const el of doc.querySelectorAll("*")) {
      if (el.tagName === "IFRAME") {
        const r = el.getBoundingClientRect();
        if (el.contentDocument && r.width) walk(el.contentDocument, ox + (r.left + el.clientLeft) * scale, oy + (r.top + el.clientTop) * scale, scale * r.width / el.offsetWidth);
        continue;
      }
      const cs = win.getComputedStyle(el, "::after");
      if (cs.content === "none" || cs.position !== "absolute" || Number(cs.opacity) === 0 || !cs.getPropertyValue("--mark-reach") || !el.closest(".page")) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || !el.checkVisibility()) continue;
      const k = r.width / el.offsetWidth;
      const px = value => parseFloat(value) * k;
      const probe = doc.createElement("i");
      probe.style.cssText = "position:absolute;visibility:hidden;width:var(--presentation-grid-gap)";
      el.append(probe);
      const gap = parseFloat(win.getComputedStyle(probe).width);
      probe.remove();
      const own = win.getComputedStyle(el);
      const pad = { left: r.left + px(own.borderLeftWidth), top: r.top + px(own.borderTopWidth), right: r.right - px(own.borderRightWidth), bottom: r.bottom - px(own.borderBottomWidth) };
      const box = { left: pad.left + px(cs.left), top: pad.top + px(cs.top), right: pad.right - px(cs.right), bottom: pad.bottom - px(cs.bottom) };
      const anchor = (-parseFloat(cs.right) - gap / 2) * k - px(own.borderRightWidth);
      const ruled = cs.outlineStyle === "solid" && parseFloat(cs.outlineWidth) > 0;
      const x = ruled ? { l: box.left - k, r: box.right } : { l: box.left + anchor, r: box.right - anchor - k };
      const y = ruled ? { t: box.top - k, b: box.bottom } : { t: box.top + anchor, b: box.bottom - anchor - k };
      let arms = null;
      const images = cs.backgroundImage.split(/,\s*(?=linear-gradient)/);
      if (!ruled && images.length === 8 && images.every(image => image.startsWith("linear-gradient"))) {
        const sizes = cs.backgroundSize.split(",").map(part => part.trim().split(/\s+/).map(px));
        arms = cs.backgroundPosition.split(",").map((position, index) => {
          const parts = position.match(/calc\([^)]*\)|\S+/g);
          const at = (part, free) => {
            const calc = part.match(/^calc\(([\d.]+)% ([-+]) ([\d.]+)px\)$/);
            if (calc) return free * parseFloat(calc[1]) / 100 + (calc[2] === "-" ? -1 : 1) * px(calc[3]);
            return part.endsWith("%") ? free * parseFloat(part) / 100 : px(part);
          };
          const [w, h] = sizes[index];
          const x0 = box.left + at(parts[0], box.right - box.left - w), y0 = box.top + at(parts[1], box.bottom - box.top - h);
          return { x0, y0, x1: x0 + w, y1: y0 + h };
        });
      }
      const label = `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")}`;
      [["tl", "l", "t"], ["tr", "r", "t"], ["bl", "l", "b"], ["br", "r", "b"]].forEach(([corner, h, v], index) => {
        const arm = arms && { h: arms[index * 2], v: arms[index * 2 + 1] };
        const page = n => n * scale;
        corners.push({ el, doc, label, corner, scale: scale * k, x: ox + page(x[h]), y: oy + page(y[v]),
          arm: arm && { hx0: ox + page(arm.h.x0), hx1: ox + page(arm.h.x1), hy: oy + page(arm.h.y0), vx: ox + page(arm.v.x0), vy0: oy + page(arm.v.y0), vy1: oy + page(arm.v.y1) } });
      });
    }
  };
  walk(document, 0, 0, 1);
  const groups = [];
  for (const corner of corners) {
    const reach = 14 * corner.scale;
    const group = groups.find(g => g.every(other => other.doc === corner.doc && other.el !== corner.el && !other.el.contains(corner.el) && !corner.el.contains(other.el)) && Math.abs(g[0].x - corner.x) < reach && Math.abs(g[0].y - corner.y) < reach);
    if (group) group.push(corner); else groups.push([corner]);
  }
  return groups.filter(group => group.length > 1).map(group => {
    const spread = pick => (Math.max(...group.map(pick)) - Math.min(...group.map(pick))) / group[0].scale;
    const armOff = Math.max(...group.map(c => c.arm ? Math.max(Math.abs(c.arm.hy - c.y), Math.abs(c.arm.vx - c.x)) / c.scale : 0));
    return { offset: Math.max(spread(c => c.x), spread(c => c.y), armOff), at: [group[0].x, group[0].y],
      marks: group.map(({ label, corner, x, y, arm }) => ({ label, corner, x, y, arm })) };
  });
}

test("Sheet marks of neighboring panels meet at every shared corner", async () => {
  const rows = [];
  for (const width of [1440, 390]) {
    const page = await open("example/dashboard", width);
    try {
      await page.frameLocator("iframe").first().locator(".layout-stats").first().waitFor();
      const panel = await settings(page);
      await tab(panel, "Presets");
      const presets = (await panel.getByLabel("Presets").getByRole("button").allTextContents()).filter(name => name !== "Random");
      const marks = (await page.evaluate(() => window.kisoAppearance.options.cornerMarks)).filter(mark => !["none", "arcs", "diagonal"].includes(mark));
      for (const preset of presets) {
        await panel.getByLabel("Presets").getByRole("button", { name: preset, exact: true }).click();
        const look = await page.evaluate(() => window.kisoAppearance.read());
        for (const mark of marks) {
          await page.evaluate(next => window.kisoAppearance.save(next), { ...look, cornerMarks: mark, markClearance: "sheet", markScope: "panels" });
          await page.waitForFunction(mark => [...document.querySelectorAll("iframe")].every(frame => !frame.contentDocument?.querySelector(".layout-stats") || frame.contentDocument.documentElement.dataset.cornerMarks === mark && frame.contentDocument.documentElement.dataset.markClearance === "sheet"), mark);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const corners = await page.evaluate(sharedMarkCorners);
          rows.push({ mark, preset, width, corners: corners.length, offset: Math.max(0, ...corners.map(corner => corner.offset)) });
        }
      }
    } finally { await page.close(); }
  }
  console.log(["mark type | preset | width | corners checked | max offset", ...rows.map(row => `${row.mark} | ${row.preset} | ${row.width} | ${row.corners} | ${row.offset.toFixed(2)}`)].join("\n"));
  for (const mark of new Set(rows.map(row => row.mark))) assert(rows.some(row => row.mark === mark && row.corners > 0), `${mark} marks share corners on the dashboard`);
  assert.deepEqual(rows.filter(row => row.offset > 0.5), [], "Marks at a shared corner coincide within 0.5px");
});

test("presets replace the fields they do not define", async () => {
  const page = await open("intro");
  try {
    const base = await page.evaluate(() => window.kisoAppearance.presetDefaults);
    const panel = await settings(page);
    await tab(panel, "Presets");
    for (const label of ["Pixel workshop", "Drafting sheet", "Pixel everywhere"]) {
      await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, typeface: "dm-sans" }));
      await panel.getByRole("button", { name: label, exact: true }).click();
      const look = await page.evaluate(() => window.kisoAppearance.read());
      assert.equal(look.panelFill, base.panelFill, label);
      assert.equal(look.headerVariant, base.headerVariant, label);
      assert.equal(look.typeface, base.typeface, label);
      assert.equal(await panel.getByRole("button", { name: label, exact: true }).getAttribute("aria-pressed"), "true", label);
      if (label === "Pixel workshop") {
        assert.equal(look.outerCornerStyle, "pixel");
        assert.equal(look.outerCornerMarks, "brackets");
      } else if (label === "Drafting sheet") {
        assert.equal(look.outerCornerMarks, "ticks");
      } else {
        assert.equal(look.cornerStyle, "pixel");
      }
    }
  } finally { await page.close(); }
});
