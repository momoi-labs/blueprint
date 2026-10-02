import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir } from "node:fs/promises";
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

for (const [width, frame, theme] of [
  [1440, "Default", "light"], [1440, "Default", "dark"],
  [1440, "Inset", "light"], [1440, "Inset", "dark"], [320, "Inset", "dark"],
]) test(`Appearance stays compact with reset above scrolling options at ${width}px in ${frame}/${theme}`, async () => {
  const page = await open("components", width, theme);
  try {
    const panel = await settings(page);
    await panel.getByRole("group", { name: "Application frame", exact: true }).getByRole("radio", { name: frame, exact: true }).check();
    assert(await panel.getByRole("heading", { name: "Appearance", exact: true }).isVisible());
    assert.equal(await panel.locator("details").count(), 0);
    for (const name of ["Colors", "Layout", "Borders", "Corner style", "Corner marks", "Use in code"]) {
      assert(await panel.getByRole("region", { name, exact: true }).isVisible());
    }
    if (width >= 1200) {
      assert.equal(await panel.evaluate(el => getComputedStyle(el).backgroundColor),
        await page.locator(".catalog-sidebar").evaluate(el => getComputedStyle(el).backgroundColor), "Both sidebars share a background");
      if (frame === "Inset") assert.equal(await panel.evaluate(el => getComputedStyle(el).borderInlineStartWidth), "0px");
    }
    const borders = panel.getByRole("group", { name: "Border style", exact: true });
    assert.equal(await borders.getByRole("radio").count(), 8);
    assert((await borders.boundingBox()).height <= 260, "Eight border choices fit in four compact rows");
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
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "square");
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
    assert.equal(await width(), start);
    const scroll = panel.getByRole("region", { name: "Settings options" });
    const previewBox = await page.locator(".catalog-preview").boundingBox();
    await group(panel, "Borders");
    await scroll.evaluate(el => el.scrollTop = 200);
    assert(await scroll.evaluate(el => el.scrollTop > 0));
    assert.deepEqual(await page.locator(".catalog-preview").boundingBox(), previewBox);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

test("The settings gear starts after search in the header and can opt into floating placement", async () => {
  const page = await open("components/alert");
  try {
    const panel = await settings(page);
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
    await (await group(panel, "Layout")).getByRole("combobox", { name: "Settings toggle", exact: true }).selectOption("floating");
    const edge = await panel.boundingBox();
    const box = await toggle.boundingBox();
    assert.equal(box.x + box.width, edge.x);
    assert(Math.abs(box.y + box.height / 2 - 450) < 1);
    await toggle.focus(); await page.keyboard.press("Enter");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal((await toggle.boundingBox()).x + (await toggle.boundingBox()).width, 1440);
    await page.keyboard.press("Space");
    await panel.waitFor();
    await (await group(panel, "Layout")).getByRole("combobox", { name: "Settings toggle", exact: true }).selectOption("header");
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
    let corners = await group(panel, "Corner style");
    const choices = corners.getByRole("group", { name: "Corner type", exact: true });
    assert.equal(await choices.getByRole("radio").count(), 3);
    await choices.getByRole("radio", { name: /^Rounded / }).check();
    const table = page.locator(".catalog-preview .table-wrap");
    for (const [size, radius] of [["Small", "8px"], ["Medium", "16px"], ["Large", "24px"], ["Off", "0px"]]) {
      await corners.getByRole("group", { name: "Corner size", exact: true }).getByRole("radio", { name: size, exact: true }).check();
      assert.equal(await table.evaluate(el => getComputedStyle(el).borderTopLeftRadius), radius);
    }
    await corners.getByRole("group", { name: "Corner size", exact: true }).getByRole("radio", { name: "Small", exact: true }).check();
    const borders = await group(panel, "Borders");
    assert.equal(await borders.getByRole("radio").count(), 8);
    for (const border of ["none", "dash", "solid"]) {
      await borders.locator(`input[value="${border}"]`).check();
      assert.equal(await table.evaluate(el => getComputedStyle(el).borderTopLeftRadius), "8px");
    }
    await page.reload();
    panel = await settings(page);
    corners = await group(panel, "Corner style");
    assert(await corners.getByRole("radio", { name: /^Rounded / }).isChecked());
    assert(await corners.getByRole("radio", { name: "Small", exact: true }).isChecked());
    if (screenshots) await page.screenshot({ path: `${screenshots}/gallery-corner-settings-${width}.png` });
    await panel.getByRole("button", { name: "Reset appearance", exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerStyle), "square");
  } finally { await page.close(); }
});

test("Component options replace each other and open on arrival without resetting global appearance", async () => {
  const page = await open("components/table");
  try {
    let panel = await settings(page);
    await (await group(panel, "Colors")).getByRole("radio", { name: "Light theme", exact: true }).check();
    await group(panel, "Borders");
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
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kiso-gallery-appearance")));
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
