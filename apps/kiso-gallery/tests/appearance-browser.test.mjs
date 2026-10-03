import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { appearanceCode } from "../src/appearance-settings.ts";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const screenshots = process.env.SCREENSHOT_DIR;
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
async function settings(page) {
  const panel = page.locator("#gallery-settings");
  if (!await panel.isVisible()) await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await panel.waitFor();
  return panel;
}
async function group(panel, name) {
  const section = panel.getByRole("region", { name, exact: true });
  await section.waitFor();
  return section;
}
async function close(page) {
  await page.getByRole("button", { name: "Close settings", exact: true }).click();
  await page.locator("#gallery-settings").waitFor({ state: "hidden" });
}

for (const theme of ['light', 'dark']) test(`Fresh visits, reset and Pixel everywhere share the approved default in ${theme}`, async () => {
  const page = await open('intro', 1440, theme);
  try {
    const initial = await page.evaluate(() => window.kisoAppearance.read());
    const panel = await settings(page);
    const preset = panel.getByRole('button', { name: 'Pixel everywhere', exact: true });
    assert.equal(await preset.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), undefined);
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), 'light dark');
    await panel.getByRole('button', { name: 'Default', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), {
      ...initial, cornerStyle: 'square', cornerSize: 'medium', appShell: 'default', backgroundStyle: 'solid', visualStyle: 'default',
    }, 'Default preserves the previous appearance as a separate preset');
    await page.reload();
    assert.equal(await page.evaluate(() => window.kisoAppearance.read().cornerStyle), 'square', 'Saved appearance is not overwritten by the new default');
    await settings(page);
    await panel.getByRole('button', { name: 'Blueprint', exact: true }).click();
    await preset.click();
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), initial);
    await panel.getByRole('radio', { name: 'Dark theme', exact: true }).check();
    await preset.click();
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), initial, 'The default preset restores system theme');
    await panel.getByRole('button', { name: 'Manga board', exact: true }).click();
    await panel.getByRole('button', { name: 'Reset appearance', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), initial);
    await page.reload();
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), initial);
    if (screenshots) await page.screenshot({ path: `${screenshots}/pixel-default-${theme}.png` });
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Random changes appearance without losing theme or edited data at ${width}px`, async () => {
  const page = await open('components/form-field', width, 'dark');
  try {
    let seed = 42;
    await page.evaluate(seed => {
      Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
    }, seed);
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    const panel = await settings(page);
    await panel.getByRole('radio', { name: 'Dark theme', exact: true }).check();
    const randomTile = panel.getByRole('button', { name: 'Random', exact: true });
    const pixelTile = panel.getByRole('button', { name: 'Pixel everywhere', exact: true });
    assert.equal(await randomTile.locator('svg').count(), 1, 'Random has a visual preview');
    const randomBox = await randomTile.boundingBox(), pixelBox = await pixelTile.boundingBox();
    assert.equal(randomBox.y, pixelBox.y, 'Random sits in the same preset row as Pixel everywhere');
    assert(randomBox.x >= pixelBox.x + pixelBox.width);
    await close(page);
    await ram.fill('24');
    let previous = await page.evaluate(() => window.kisoAppearance.read());
    for (let i = 0; i < 12; i++) {
      await settings(page);
      const random = panel.getByRole('button', { name: 'Random', exact: true });
      await random.focus(); await page.keyboard.press('Enter');
      const next = await page.evaluate(() => window.kisoAppearance.read());
      assert.equal(next.theme, 'dark');
      assert.notDeepEqual(next, previous);
      await close(page);
      assert.equal(await ram.inputValue(), '24');
      assert(await ram.evaluate(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
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
  [1440, "Inset", "light"], [1440, "Inset", "dark"], [320, "Inset", "dark"],
]) test(`Appearance stays compact with reset above scrolling options at ${width}px in ${frame}/${theme}`, async () => {
  const page = await open("components", width, theme);
  try {
    const panel = await settings(page);
    await panel.getByRole("group", { name: "Application frame", exact: true }).getByRole("radio", { name: frame, exact: true }).check();
    assert(await panel.getByRole("heading", { name: "Appearance", exact: true }).isVisible());
    assert.equal(await panel.locator("details:not([open])").count(), 1);
    for (const name of ["Colors", "Layout", "Main style", "Where to apply", "Use in code"]) {
      assert(await panel.getByRole("region", { name, exact: true }).isVisible());
    }
    if (width >= 1200) {
      assert.equal(await panel.evaluate(el => getComputedStyle(el).backgroundColor),
        await page.locator(".catalog-sidebar").evaluate(el => getComputedStyle(el).backgroundColor), "Both sidebars share a background");
      if (frame === "Inset") assert.equal(await panel.evaluate(el => getComputedStyle(el).borderInlineStartWidth), "0px");
    }
    const borders = panel.getByRole("group", { name: "Border style", exact: true });
    assert.equal(await borders.getByRole("radio").count(), 9);
    assert((await borders.boundingBox()).height <= 330, "Nine border choices fit in five compact rows");
    const rounded = panel.getByRole("radio", { name: /^Rounded / });
    await rounded.focus();
    await page.keyboard.press("Space");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "rounded");
    const reset = panel.getByRole("button", { name: "Reset appearance", exact: true });
    const resetBox = await reset.boundingBox();
    const scroll = panel.getByRole("region", { name: "Settings options", exact: true });
    await scroll.evaluate(el => el.scrollTop = el.scrollHeight);
    assert(await scroll.evaluate(el => el.scrollTop > 0));
    assert.deepEqual(await reset.boundingBox(), resetBox, "Reset stays fixed while the options scroll");
    assert(resetBox.y + resetBox.height <= (await scroll.boundingBox()).y, "Reset sits above the scroll area");
    assert(await reset.evaluate(el => {
      const box = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
    }), "Reset remains clickable without scrolling back up");
    assert.equal(await panel.evaluate(el => el.scrollTop), 0, "Only the options own the vertical scroll position");
    await reset.click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "pixel");
    assert.equal(await panel.getByRole("status").filter({ hasText: "Global settings reset." }).count(), 1);
  } finally { await page.close(); }
});

for (const frame of ["Default", "Inset"]) test(`Both rails release space independently and retain demo state in ${frame}`, async () => {
  const page = await open("components/table");
  try {
    const panel = await settings(page);
    const layout = await group(panel, "Layout");
    await layout.getByRole("group", { name: "Application frame", exact: true }).getByRole("radio", { name: frame, exact: true }).check();
    const main = page.locator('.component-gallery > [data-slot="app-shell-main"]');
    const width = async () => (await main.boundingBox()).width;
    const start = await width();
    const section = await group(panel, "Table options");
    await section.getByRole("combobox", { name: /^Density/ }).selectOption("spacious");
    await section.getByRole("combobox", { name: /^Frame/ }).selectOption("none");
    await section.getByRole("combobox", { name: /^Header/ }).selectOption("plain");
    await page.getByRole("button", { name: /work_mem/ }).click();
    assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
    assert.equal(await page.getByRole("table").getAttribute("data-density"), "spacious");
    assert.equal(await page.getByRole("table").getAttribute("data-header"), "plain");
    const initialPanelBox = await panel.boundingBox();
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    await page.getByRole("button", { name: "Expand navigation", exact: true }).waitFor();
    assert(await width() > start + 200);
    assert.equal((await panel.boundingBox()).width, initialPanelBox.width);
    await close(page);
    assert(await width() > start + 500);
    assert.equal((await page.locator(".catalog-detail").boundingBox()).width, await main.evaluate(el => el.clientWidth));
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open settings");
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-rails-closed-${frame}.png` });
    await settings(page);
    assert.equal(await section.getByRole("combobox", { name: /^Density/ }).inputValue(), "spacious");
    assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
    await page.getByRole("button", { name: "Expand navigation", exact: true }).click();
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).waitFor();
    assert.equal(await width(), start);
    const scroll = panel.getByRole("region", { name: "Settings options" });
    const previewBox = await page.locator(".catalog-preview").boundingBox();
    await group(panel, "Main style");
    await scroll.evaluate(el => el.scrollTop = 200);
    assert(await scroll.evaluate(el => el.scrollTop > 0));
    assert.deepEqual(await page.locator(".catalog-preview").boundingBox(), previewBox);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

test("The settings gear stays after search in the header", async () => {
  const page = await open("components/alert");
  try {
    const panel = await settings(page);
    await panel.getByRole('group', { name: 'Application frame', exact: true }).getByRole('radio', { name: 'Default', exact: true }).check();
    const toggle = page.locator(".gallery-settings-trigger");
    assert.equal(await toggle.count(), 1);
    assert.equal(await toggle.getAttribute("data-placement"), "header");
    assert.equal(await toggle.evaluate(el => getComputedStyle(el).position), "static");
    assert.equal((await toggle.textContent()).trim(), "");
    const mainBox = await page.locator('.component-gallery > [data-slot="app-shell-main"]').boundingBox();
    const panelBox = await panel.boundingBox();
    assert.equal(mainBox.x + mainBox.width, panelBox.x, "No empty column between preview and settings");
    const searchBox = await page.getByRole("searchbox", { name: "Find a component" }).boundingBox();
    const headerToggleBox = await toggle.boundingBox();
    assert(headerToggleBox.x >= searchBox.x + searchBox.width, "Gear follows the search field");
    assert.equal(await panel.getByRole("combobox", { name: "Settings toggle", exact: true }).count(), 0);
    await toggle.focus(); await page.keyboard.press("Enter");
    await panel.waitFor({ state: "hidden" });
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await page.keyboard.press("Space");
    await panel.waitFor();
    assert.equal(await toggle.evaluate(el => getComputedStyle(el).position), "static");
    await toggle.click();
    await panel.waitFor({ state: "hidden" });
    await toggle.click();
    await panel.waitFor();
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-toggle-header.png` });
    await panel.getByRole("heading", { name: "Appearance", exact: true }).focus();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open settings");
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Rounded is one type with independent size and border choices at ${width}px`, async () => {
  const page = await open("components/table", width);
  try {
    let panel = await settings(page);
    let corners = await group(panel, "Main style");
    const choices = corners.getByRole("group", { name: "Corner type", exact: true });
    assert.equal(await choices.getByRole("radio").count(), 4);
    await choices.getByRole("radio", { name: /^Square / }).check();
    const size = corners.getByRole("group", { name: "Corner size", exact: true });
    for (const radio of await size.getByRole("radio").all()) assert(await radio.isDisabled(), "Square disables size adjustments");
    await choices.getByRole("radio", { name: /^Rounded / }).check();
    assert(await size.getByRole("radio", { name: "Off", exact: true }).isDisabled());
    const table = page.locator(".catalog-preview .table-wrap");
    for (const [size, radius] of [["Small", "8px"], ["Medium", "16px"], ["Large", "24px"]]) {
      await corners.getByRole("group", { name: "Corner size", exact: true }).getByRole("radio", { name: size, exact: true }).check();
      assert.equal(await table.evaluate(el => getComputedStyle(el).borderTopLeftRadius), radius);
    }
    await choices.getByRole("radio", { name: /^Square / }).check();
    assert(await size.getByRole("radio", { name: "Large", exact: true }).isChecked(), "Square keeps the last size for a later shape switch");
    await choices.getByRole("radio", { name: /^Asymmetric / }).check();
    assert(await size.getByRole("radio", { name: "Off", exact: true }).isDisabled());
    assert.equal(await table.evaluate(el => getComputedStyle(el).borderTopLeftRadius), "18px");
    await choices.getByRole("radio", { name: /^Rounded / }).check();
    assert(await size.getByRole("radio", { name: "Large", exact: true }).isChecked(), "Switching shapes retains an enabled size");
    const large = size.getByRole("radio", { name: "Large", exact: true });
    await large.focus(); await page.keyboard.press("Space"); await page.keyboard.press("ArrowRight");
    assert(await size.getByRole("radio", { name: "Small", exact: true }).isChecked(), "Keyboard navigation skips disabled Off");
    const borders = panel.getByRole("group", { name: "Border style", exact: true });
    assert.equal(await borders.getByRole("radio").count(), 9);
    for (const border of ["none", "dash", "solid"]) {
      await borders.locator(`input[value="${border}"]`).check();
      assert.equal(await table.evaluate(el => getComputedStyle(el).borderTopLeftRadius), "8px");
    }
    await page.reload();
    panel = await settings(page);
    corners = await group(panel, "Main style");
    assert(await corners.getByRole("radio", { name: /^Rounded / }).isChecked());
    assert(await corners.getByRole("group", { name: "Corner size", exact: true }).getByRole("radio", { name: "Small", exact: true }).isChecked());
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-corner-settings-${width}.png` });
    await panel.getByRole("button", { name: "Reset appearance", exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "pixel");
  } finally { await page.close(); }
});

test("Component options replace each other and open on arrival without resetting global appearance", async () => {
  const page = await open("components/table");
  try {
    let panel = await settings(page);
    await (await group(panel, "Colors")).getByRole("radio", { name: "Light theme", exact: true }).check();
    await group(panel, "Main style");
    for (const [route, title, control, value] of [["alert", "Alert options", "Appearance", "rail"], ["app-shell", "ApplicationShell options", /^Sidebar toggle placement/, "header"], ["form-field", "Inline fields options", /^Control size/, "lg"]]) {
      await close(page);
      await page.goto(`${url}#components/${route}`);
      panel = page.locator("#gallery-settings");
      await panel.waitFor();
      const options = panel.getByRole("region", { name: title, exact: true });
      assert(await options.isVisible());
      const sectionBox = await options.boundingBox();
      const scrollBox = await panel.getByRole("region", { name: "Settings options" }).boundingBox();
      assert(sectionBox.y >= scrollBox.y && sectionBox.y + sectionBox.height <= scrollBox.y + scrollBox.height + 1, "Current component controls scroll into view");
      assert.equal(await panel.locator(".gallery-component-settings > section").count(), 1);
      await options.getByRole("combobox", { name: control }).selectOption(value);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
      assert.equal(await page.locator(".catalog-preview .demo-settings-inline").count(), 0);
    }
    await page.goto(`${url}#intro`);
    assert.equal(await panel.locator(".gallery-component-settings").textContent(), "");
    assert.equal(await page.getByRole("link", { name: "Appearance", exact: true }).count(), 0);
    await close(page);
    await page.goto(`${url}#example/dashboard`);
    assert(await page.getByRole("button", { name: "Open settings", exact: true }).isVisible());
    await settings(page);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
  } finally { await page.close(); }
});

for (const colorScheme of ["light", "dark"]) test(`Alert has one live preview for every severity and appearance in ${colorScheme}`, async () => {
  const page = await open("components/alert", 1440, colorScheme);
  try {
    const panel = await settings(page);
    const alert = page.locator(".catalog-preview .alert");
    assert.equal(await alert.count(), 1);
    for (const appearance of ["tinted", "rail"]) for (const severity of ["info", "success", "warning", "error"]) {
      await panel.getByRole("combobox", { name: "Appearance", exact: true }).selectOption(appearance);
      await panel.getByRole("combobox", { name: "Severity", exact: true }).selectOption(severity);
      assert.equal(await alert.getAttribute("role"), "note");
      assert.equal(await alert.locator(".alert-title").textContent(), severity[0].toUpperCase() + severity.slice(1));
      assert.equal(await alert.evaluate(el => el.classList.contains("alert-rail")), appearance === "rail");
      if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-alert-${appearance}-${severity}-${colorScheme}.png` });
    }
    await close(page); await settings(page);
    assert.equal(await panel.getByRole("combobox", { name: "Severity", exact: true }).inputValue(), "error");
  } finally { await page.close(); }
});

for (const width of [320, 390]) test(`Small screens use a dismissible settings drawer with focus return at ${width}px`, async () => {
  const page = await open("components/table", width);
  try {
    const panel = await page.getByRole("dialog", { name: "Appearance", exact: true });
    await panel.waitFor();
    assert.equal(await panel.getAttribute("aria-modal"), "true");
    await panel.getByRole("combobox", { name: /^Density/ }).selectOption("compact");
    await page.keyboard.press("Escape");
    await panel.waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open settings");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole("button", { name: /work_mem/ }).click();
    await settings(page);
    assert.equal(await panel.getByRole("combobox", { name: /^Density/ }).inputValue(), "compact");
    const reset = panel.getByRole("button", { name: "Reset appearance", exact: true });
    await reset.focus(); await page.keyboard.press("Tab");
    assert(await panel.evaluate(el => el.contains(document.activeElement)));
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-settings-mobile-${width}.png` });
    await close(page);
    await page.getByRole("button", { name: "Show navigation", exact: true }).click();
    assert(await page.getByRole("navigation", { name: "Component categories" }).isVisible());
    await page.getByRole("button", { name: "Hide navigation", exact: true }).click();
    assert.equal(await page.getByRole("navigation", { name: "Component categories" }).isVisible(), false);
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Appearance usage copies current settings from any page at ${width}px`, async () => {
  const page = await open("components/alert", width);
  try {
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } }));
    const panel = await settings(page);
    await (await group(panel, "Colors")).getByRole("radio", { name: "Dark theme", exact: true }).check();
    await (await group(panel, "Layout")).getByRole("radio", { name: "Editorial", exact: true }).check();
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

test("Old Appearance bookmarks open settings on Intro", async () => {
  const page = await open("appearance");
  try {
    await page.waitForURL(`${url}#intro`);
    assert(await page.locator("#gallery-settings").isVisible());
    assert(await page.getByRole("heading", { name: "A shared foundation for your next interface.", exact: true }).isVisible());
  } finally { await page.close(); }
});

for (const width of [320, 1440]) test(`Appearance samples stay centered and isolated from full-size frame decorations at ${width}px`, async () => {
  const page = await open('components', width);
  try {
    const panel = await settings(page);
    await panel.getByRole('radio', { name: /^Rounded / }).check();
    await panel.getByRole('group', { name: 'Corner size', exact: true }).getByRole('radio', { name: 'Large', exact: true }).check();
    for (const sample of await panel.locator('.appearance-heading-sample').all()) {
      assert(await sample.evaluate(el => {
        const box = el.getBoundingClientRect();
        const text = el.querySelector('.appearance-heading-title').getBoundingClientRect();
        return Math.abs(text.x + text.width / 2 - box.x - box.width / 2) <= 1 && Math.abs(text.y + text.height / 2 - box.y - box.height / 2) <= 1;
      }), 'Aa is centered within its sample');
    }
    const frames = panel.getByRole('group', { name: 'Application frame', exact: true });
    assert.equal(await frames.locator('svg').count(), 2);
    assert.equal(await frames.locator('.card').count(), 0, 'Frame thumbnails do not inherit full-size card marks');
    for (const svg of await frames.locator('svg').all()) {
      assert(await svg.evaluate(el => {
        const box = el.getBBox(), view = el.viewBox.baseVal;
        return box.x >= view.x && box.y >= view.y && box.x + box.width <= view.width && box.y + box.height <= view.height;
      }), 'Frame drawing stays inside its viewBox');
    }
    if (width >= 1200) for (const frame of ['Default', 'Inset']) {
      await frames.getByRole('radio', { name: frame, exact: true }).check();
      const header = await page.locator('.catalog-header').boundingBox();
      const left = await page.locator('.catalog-sidebar-toggle').boundingBox();
      const right = await page.locator('.gallery-settings-trigger').boundingBox();
      const start = left.x - header.x, end = header.x + header.width - right.x - right.width;
      assert(Math.abs(start - end) <= 1 && start <= 8 && end <= 8, 'Header toggles have equal small outer margins');
      assert.equal(left.width, right.width, 'Both toggles use the same icon-button target');
    }
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Canvas choices and independent outer styles persist at ${width}px`, async () => {
  const page = await open('components/card', width);
  try {
    let panel = await settings(page);
    await panel.getByRole('group', { name: 'Application frame', exact: true }).getByRole('radio', { name: 'Inset', exact: true }).check();
    await panel.getByRole('radio', { name: 'Momoi watermark', exact: true }).check();
    await panel.getByRole('group', { name: 'Panel fill', exact: true }).getByRole('radio', { name: 'Translucent', exact: true }).check();
    await panel.locator('summary').filter({ hasText: 'Customize outer frame' }).click();
    await panel.getByRole('group', { name: 'Outer border', exact: true }).locator('input[value="brush"]').check();
    await panel.getByRole('group', { name: 'Apply frames to', exact: true }).locator('input[value="panels"]').check();
    await panel.getByRole('group', { name: 'Apply marks to', exact: true }).locator('input[value="outer"]').check();
    await panel.getByRole('group', { name: 'Outer marks', exact: true }).locator('input[value="none"]').check();
    assert(await panel.getByRole('group', { name: 'Outer corners', exact: true }).getByRole('radio').first().isDisabled(), 'Brush owns the outer contour');
    const selected = await page.evaluate(() => ({ ...document.documentElement.dataset }));
    assert.equal(selected.borderStyle, 'solid', 'Outer Brush does not change inner borders');
    assert.equal(selected.backgroundStyle, 'momoi');
    assert.equal(selected.panelFill, 'translucent');
    assert((await panel.locator('.appearance-usage').innerText()).includes('data-outer-border-style="brush"'));
    await page.reload(); panel = await settings(page);
    assert(await panel.getByRole('radio', { name: 'Momoi watermark', exact: true }).isChecked());
    await panel.locator('summary').filter({ hasText: 'Customize outer frame' }).click();
    assert(await panel.getByRole('group', { name: 'Outer border', exact: true }).locator('input[value="brush"]').isChecked());
    assert(await panel.getByRole('group', { name: 'Apply marks to', exact: true }).locator('input[value="outer"]').isChecked());
    await panel.getByRole('button', { name: 'Reset appearance', exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.backgroundStyle), 'fibers');
    assert(await panel.getByRole('group', { name: 'Outer border', exact: true }).locator('input[value="inherit"]').isChecked());
  } finally { await page.close(); }
});

test('Legacy selections remain explicit until replaced, and incompatible choices retain state', async () => {
  const page = await open('components/card');
  try {
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, borderStyle: 'bevel', cornerMarks: 'dots' }));
    await page.reload();
    const panel = await settings(page);
    assert(await panel.getByRole('radio', { name: /^Inset edge \(legacy\)/ }).isChecked());
    assert(await panel.getByRole('radio', { name: 'Corner dots (legacy)', exact: true }).isChecked());
    await panel.getByRole('group', { name: 'Border style', exact: true }).getByRole('radio', { name: /^Solid / }).check();
    assert.equal(await panel.getByRole('radio', { name: /^Inset edge \(legacy\)/ }).count(), 0);
    await panel.getByRole('radio', { name: /^Pixel classic / }).check();
    assert(await panel.getByRole('radio', { name: /^Dashed outline / }).isDisabled());
    assert(await panel.getByRole('group', { name: 'Corner marks', exact: true }).getByRole('radio', { name: 'Curved brackets', exact: true }).isDisabled());
    await panel.getByRole('radio', { name: /^Brush frame / }).check();
    assert(await panel.getByRole('radio', { name: /^Pixel classic / }).isChecked(), 'Brush retains the selected corner');
    assert(await panel.getByRole('radio', { name: /^Pixel classic / }).isDisabled());
  } finally { await page.close(); }
});

for (const [width, theme] of [[320, 'dark'], [390, 'light'], [1440, 'dark']]) test(`Visual settings reproduce the Blueprint study at ${width}px in ${theme}`, async () => {
  const page = await open('appearance', width, theme);
  try {
    let panel = await settings(page);
    await panel.getByRole('radio', { name: theme === 'dark' ? 'Dark theme' : 'Light theme', exact: true }).check();
    await panel.getByRole('button', { name: 'Blueprint', exact: true }).click();
    const saved = await page.evaluate(() => window.kisoAppearance.read());
    for (const [key, value] of Object.entries({ theme, accent: 'cobalt', paperTone: 'accent', backgroundStyle: 'guides', backgroundPlacement: 'inside', backgroundStrength: 'quiet', outerBorderStyle: 'double', borderStyle: 'solid', cornerStyle: 'square', cornerMarks: 'ticks', frameScope: 'panels', markScope: 'panels' })) assert.equal(saved[key], value, key);
    assert(await panel.evaluate(el => {
      const probe = document.createElement('span'); probe.style.color = 'var(--color-accent-surface)'; el.append(probe);
      const matches = getComputedStyle(el).backgroundColor === getComputedStyle(probe).color; probe.remove(); return matches;
    }), 'Settings share the selected accent paper on desktop and mobile');
    const paperSamples = panel.getByRole('group', { name: 'Paper tone', exact: true }).locator('.appearance-background-sample');
    const paperColors = await paperSamples.evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
    assert.notEqual(paperColors[0], paperColors[1], 'Theme paper and Accent paper retain distinct previews inside tinted settings');
    assert(await panel.getByRole('button', { name: 'Blueprint', exact: true }).getAttribute('aria-pressed') === 'true');
    assert(await panel.getByRole('group', { name: 'Canvas background', exact: true }).getByRole('radio', { name: 'Construction lines', exact: true }).isEnabled(), 'The module grid remains available');
    await panel.locator('summary').filter({ hasText: 'Customize outer frame' }).click();
    for (const label of ['Outer border', 'Outer corners', 'Outer marks', 'Apply frames to', 'Apply marks to', 'Paper tone', 'Pattern placement', 'Background strength', 'Panel fill']) {
      const choices = panel.getByRole('group', { name: label, exact: true });
      for (const option of await choices.locator('label.appearance-option').all()) {
        assert.equal(await option.locator('svg[aria-hidden="true"], .appearance-background-sample[aria-hidden="true"]').count(), 1, `${label} has a decorative preview for every choice`);
      }
    }
    const placement = panel.getByRole('group', { name: 'Pattern placement', exact: true });
    const inside = placement.getByRole('radio', { name: 'Inside frame', exact: true });
    await inside.focus(); await page.keyboard.press('ArrowRight');
    assert(await placement.getByRole('radio', { name: 'Both', exact: true }).isChecked());
    assert.equal(await page.evaluate(() => document.documentElement.dataset.backgroundPlacement), 'both');
    await page.keyboard.press('ArrowLeft');
    await panel.getByRole('group', { name: 'Panel fill', exact: true }).getByRole('radio', { name: 'Translucent', exact: true }).check();
    assert(await page.locator('.intro-composition .card').evaluate(el => getComputedStyle(el).backgroundColor.includes('0.65')), 'Blueprint panels can be translucent without a Momoi background');
    assert.equal(await page.locator('.intro-composition input').evaluate(el => getComputedStyle(el).opacity), '1');
    const borders = panel.getByRole('group', { name: 'Border style', exact: true });
    const thumbnail = borders.locator('label:has(input[value="double"]) svg');
    const before = await thumbnail.innerHTML();
    await panel.getByRole('group', { name: 'Apply frames to', exact: true }).getByRole('radio', { name: 'Outer only', exact: true }).check();
    assert.equal(await thumbnail.innerHTML(), before, 'Outer-only styling cannot erase option drawings');
    await panel.getByRole('button', { name: 'Blueprint', exact: true }).click();
    await page.reload(); panel = await settings(page);
    assert(await panel.getByRole('button', { name: 'Blueprint', exact: true }).getAttribute('aria-pressed') === 'true');
    await close(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (screenshots) await page.screenshot({ path: `${screenshots}/blueprint-study-${width}-${theme}.png`, fullPage: true });
    panel = await settings(page);
    await panel.getByRole('button', { name: 'Reset appearance', exact: true }).click();
  } finally { await page.close(); }
});

test('Editorial Intro does not scroll only to reveal bottom padding', async () => {
  const page = await open('intro', 1587, 'dark');
  try {
    await page.setViewportSize({ width: 1587, height: 934 });
    const navigation = page.getByRole('button', { name: 'Collapse navigation', exact: true });
    if (await navigation.count()) await navigation.click();
    const content = page.locator('.catalog-intro');
    const geometry = await content.evaluate(el => ({ content: el.scrollHeight, viewport: el.clientHeight }));
    assert(geometry.content <= geometry.viewport, `The complete Intro fits without a padding-only scrollbar: ${JSON.stringify(geometry)}`);
    await page.setViewportSize({ width: 1587, height: 600 });
    assert(await content.evaluate(el => el.scrollHeight > el.clientHeight), 'Short viewports still allow genuine content scrolling');
    await content.evaluate(el => el.scrollTop = el.scrollHeight);
    const last = page.locator('.intro-features section').last();
    const viewport = await content.boundingBox(), box = await last.boundingBox();
    assert(box.y >= viewport.y && box.y + box.height <= viewport.y + viewport.height);
    if (screenshots) await page.screenshot({ path: `${screenshots}/intro-short-viewport.png` });
  } finally { await page.close(); }
});

test('Intro keeps its reading width while scrolling at the frame edge', async () => {
  const page = await open('appearance', 1920);
  try {
    const panel = await settings(page);
    await panel.getByRole('group', { name: 'Application frame', exact: true }).getByRole('radio', { name: 'Inset', exact: true }).check();
    await close(page);
    const geometry = await page.evaluate(() => {
      const main = document.querySelector('.component-gallery > [data-slot="app-shell-main"]');
      const scroll = main.querySelector('.catalog-main');
      const frame = main.getBoundingClientRect(), content = scroll.getBoundingClientRect();
      return { gap: frame.right - content.right, readingWidth: main.querySelector('.intro-page').getBoundingClientRect().width, overflow: getComputedStyle(scroll).overflowY };
    });
    assert(geometry.gap <= 2, `Scrollbar is next to the border, gap was ${geometry.gap}px`);
    assert(geometry.readingWidth <= 1200, 'Text does not expand to viewport width');
    assert.equal(geometry.overflow, 'auto');
  } finally { await page.close(); }
});

test('Header toggle spacing stays stable as either rail opens and closes', async () => {
  const page = await open('intro', 1440);
  try {
    const spacing = () => page.evaluate(() => {
      const box = selector => document.querySelector(selector).getBoundingClientRect();
      const header = box('.catalog-header'), left = box('.catalog-sidebar-toggle');
      const right = box('.gallery-settings-trigger'), nav = box('.catalog-header > nav');
      return { start: left.left - header.left, end: header.right - right.right, gap: nav.left - left.right, leftY: left.y + left.height / 2, rightY: right.y + right.height / 2 };
    });
    const initial = await spacing();
    for (const width of [1440, 1200]) {
      await page.setViewportSize({ width, height: 900 });
      for (const preset of ['Blueprint', 'Pixel workshop', 'Manga board', 'Brush study', 'Momoi signature']) {
        const panel = await settings(page);
        await panel.getByRole('button', { name: preset, exact: true }).click();
        for (const navOpen of [true, false]) {
          const toggle = page.locator('.catalog-sidebar-toggle');
          if ((await toggle.getAttribute('aria-expanded') === 'true') !== navOpen) await toggle.click();
          for (const settingsOpen of [true, false]) {
            if (settingsOpen) await settings(page); else await close(page);
            const measured = await spacing();
            assert.equal(measured.gap, initial.gap, `${preset}/${width}: page links do not jump relative to the navigation toggle`);
            assert.equal(measured.start, measured.end, `${preset}/${width}: equal edge insets`);
            assert.equal(measured.leftY, measured.rightY, `${preset}/${width}: toggles share a center line`);
          }
        }
      }
    }
  } finally { await page.close(); }
});

test('Intro stacks within the space left by both rails', async () => {
  const page = await open('appearance', 1200);
  try {
    const panel = await settings(page);
    await panel.getByRole('button', { name: 'Blueprint', exact: true }).click();
    await page.getByRole('button', { name: 'Expand navigation', exact: true }).click();
    const copy = await page.locator('.intro-copy').boundingBox();
    const sample = await page.locator('.intro-composition').boundingBox();
    assert(sample.y >= copy.y + copy.height, 'A narrow content column stacks the hero instead of squeezing two columns');
    assert(Math.abs(copy.width - sample.width) <= 1);
  } finally { await page.close(); }
});

for (const [width, theme] of [[320, 'dark'], [390, 'light'], [1200, 'dark'], [1680, 'light']]) test(`Every gallery sample survives appearance transitions at ${width}px in ${theme}`, async () => {
  const page = await open('components', width, theme);
  const failures = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    const inspect = () => page.locator('.catalog-masonry > .catalog-section').evaluateAll(sections => sections.map(section => {
      const preview = section.querySelector('.catalog-preview');
      const box = section.getBoundingClientRect();
      // Ink and marks may extend into the card's padding. They must stay within
      // their allocated sample, not enter the neighboring masonry column.
      const paintRight = preview.getBoundingClientRect().right + preview.scrollWidth - preview.clientWidth;
      return { id: section.querySelector('h2').id, width: box.width, height: box.height, overflow: Math.max(0, paintRight - box.right) };
    }));
    const initial = await inspect();
    assert.equal(initial.length, 60, 'The sweep covers every current catalog sample');
    const baseline = Object.fromEntries(initial.map(item => [item.id, item.overflow]));
    for (const preset of ['Blueprint', 'Pixel workshop', 'Manga board', 'Brush study', 'Momoi signature', 'Pixel everywhere', 'Manga panels', 'Brush panels']) {
      const panel = await settings(page);
      await panel.getByRole('button', { name: preset.endsWith('panels') ? 'Blueprint' : preset, exact: true }).click();
      if (preset.endsWith('panels')) await panel.getByRole('group', { name: 'Border style', exact: true }).locator(`input[value="${preset.startsWith('Manga') ? 'manga' : 'brush'}"]`).check();
      // Exercise changes after applying a preset, not only static snapshots.
      for (const scope of ['all', 'panels', 'outer']) {
        await panel.getByRole('group', { name: 'Apply frames to', exact: true }).locator(`input[value="${scope}"]`).check();
        await panel.getByRole('group', { name: 'Apply marks to', exact: true }).locator(`input[value="${scope}"]`).check();
        await panel.getByRole('group', { name: 'Panel fill', exact: true }).getByRole('radio', { name: scope === 'panels' ? 'Solid' : 'Translucent', exact: true }).check();
        await panel.getByRole('group', { name: 'Visual style', exact: true }).getByRole('radio', { name: scope === 'panels' ? 'Editorial' : 'Default', exact: true }).check();
        await panel.getByRole('group', { name: 'Mark clearance', exact: true }).getByRole('radio', { name: scope === 'all' ? 'Drawing sheet' : 'Normal', exact: true }).check();
        const disclosure = panel.locator('.appearance-outer-customization');
        if (!await disclosure.getAttribute('open').then(value => value !== null)) await disclosure.locator('summary').click();
        const detail = panel.getByRole('group', { name: 'Border detail', exact: true });
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

for (const [width, theme] of [[390, 'light'], [1200, 'dark']]) test(`New frames retain editing, selection and modal actions at ${width}px in ${theme}`, async () => {
  const page = await open('components/form-field', width, theme);
  try {
    let panel = await settings(page);
    await close(page);
    const ram = page.getByRole('spinbutton', { name: 'RAM', exact: true });
    await ram.fill('24');
    const os = page.getByRole('combobox', { name: 'OS', exact: true });
    await os.click(); await page.getByRole('option', { name: 'macOS', exact: true }).click();
    for (const frame of ['pixel', 'manga', 'brush']) {
      panel = await settings(page);
      await panel.getByRole('button', { name: 'Blueprint', exact: true }).click();
      if (frame === 'pixel') await panel.getByRole('group', { name: 'Corner type', exact: true }).locator('input[value="pixel"]').check();
      else await panel.getByRole('group', { name: 'Border style', exact: true }).locator(`input[value="${frame}"]`).check();
      for (const scope of ['all', 'panels', 'outer']) {
        await panel.getByRole('group', { name: 'Apply frames to', exact: true }).locator(`input[value="${scope}"]`).check();
        await panel.getByRole('group', { name: 'Apply marks to', exact: true }).locator(`input[value="${scope}"]`).check();
        await panel.getByRole('group', { name: frame === 'pixel' ? 'Corner size' : 'Border detail', exact: true }).getByRole('radio', { name: scope === 'all' ? 'Large' : 'Small', exact: true }).check();
        await close(page);
        assert.equal(await ram.inputValue(), '24', `${frame}/${scope}: controlled value survives appearance changes`);
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
      panel = await settings(page);
      await panel.getByRole('button', { name: frame === 'pixel' ? 'Pixel everywhere' : 'Blueprint', exact: true }).click();
      if (frame !== 'pixel') await panel.getByRole('group', { name: 'Border style', exact: true }).locator(`input[value="${frame}"]`).check();
      await panel.getByRole('group', { name: frame === 'pixel' ? 'Corner size' : 'Border detail', exact: true }).getByRole('radio', { name: 'Large', exact: true }).check();
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
    const expanded = width >= 1024 ? 'Collapse navigation' : 'Hide navigation';
    const collapsed = width >= 1024 ? 'Expand navigation' : 'Show navigation';
    const nav = page.getByRole('navigation', { name: 'Component categories', exact: true });
    await page.getByRole('button', { name: collapsed, exact: true }).click();
    assert(await nav.isVisible());
    await page.getByRole('navigation', { name: 'Preview pages', exact: true }).getByRole('link', { name: 'Components', exact: true }).click();
    await page.waitForURL(`${url}#components`);
    await page.getByRole('button', { name: width >= 1024 ? expanded : collapsed, exact: true }).waitFor();
    if (width >= 1024) await page.getByRole('button', { name: expanded, exact: true }).click();
    await page.getByRole('navigation', { name: 'Preview pages', exact: true }).getByRole('link', { name: 'Intro', exact: true }).click();
    await page.waitForURL(`${url}#intro`);
    await page.getByRole('button', { name: collapsed, exact: true }).waitFor();
    await page.getByRole('button', { name: collapsed, exact: true }).click();
    assert(await nav.isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Main style, outer overrides and Pixel size remain distinct at ${width}px`, async () => {
  const page = await open('intro', width);
  try {
    let panel = await settings(page);
    const outer = panel.locator('.appearance-outer-customization');
    assert.equal(await outer.getAttribute('open'), null);
    assert.equal(await panel.getByRole('group', { name: 'Outer border', exact: true }).count(), 0, 'Collapsed overrides stay out of keyboard navigation');
    await panel.getByRole('group', { name: 'Corner type', exact: true }).locator('input[value="pixel"]').check();
    const size = panel.getByRole('group', { name: 'Corner size', exact: true });
    assert(await size.getByRole('radio', { name: 'Off', exact: true }).isDisabled());
    assert.equal(await panel.getByRole('group', { name: 'Border detail', exact: true }).count(), 0, 'Pixel has only one size control');
    const card = page.locator('.intro-composition .card');
    const geometries = [];
    for (const name of ['Small', 'Medium', 'Large']) {
      await size.getByRole('radio', { name, exact: true }).check();
      geometries.push(await card.evaluate(el => getComputedStyle(el, '::before').clipPath));
    }
    assert.equal(new Set(geometries).size, 3, 'All three choices change the rendered steps');
    await size.getByRole('radio', { name: 'Large', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    assert(await size.getByRole('radio', { name: 'Small', exact: true }).isChecked(), 'Arrow navigation skips Off');
    await outer.locator('summary').focus();
    await page.keyboard.press('Enter');
    await panel.getByRole('group', { name: 'Outer border', exact: true }).getByRole('radio', { name: 'Brush frame', exact: true }).check();
    const detail = panel.getByRole('group', { name: 'Border detail', exact: true });
    assert.equal(await detail.count(), 1);
    assert(await outer.getByRole('group', { name: 'Border detail', exact: true }).isVisible(), 'An outer-only ink adjustment stays with its override');
    await detail.getByRole('radio', { name: 'Large', exact: true }).check();
    assert.equal(await card.evaluate(el => getComputedStyle(el, '::before').clipPath), geometries[0], 'Brush detail does not resize Pixel');
    await outer.locator('summary').click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.outerBorderStyle), 'brush', 'Collapsing the disclosure does not reset the override');
    await page.reload(); panel = await settings(page);
    assert.equal(await panel.locator('.appearance-outer-customization').getAttribute('open'), null);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerSize), 'small');
    await panel.locator('.appearance-outer-customization summary').click();
    await panel.getByRole('group', { name: 'Outer border', exact: true }).getByRole('radio', { name: 'Same as main style', exact: true }).check();
    assert.equal(await panel.getByRole('group', { name: 'Border detail', exact: true }).count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.outerBorderStyle), 'inherit');
    await panel.getByRole('button', { name: 'Pixel workshop', exact: true }).click();
    const marks = panel.getByRole('group', { name: 'Mark size', exact: true });
    await marks.getByRole('radio', { name: 'Large', exact: true }).check();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.markSize), 'large', 'Outer-only marks retain an enabled size control');
    if (screenshots) await page.screenshot({ path: `${screenshots}/appearance-organization-${width}.png` });
  } finally { await page.close(); }
});
