import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { test } from "./shard.mjs";
import { openGenerator, tab } from "./settings-tabs.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const tuiData = JSON.parse(await readFile(new URL("../src/generated/tui-gallery.json", import.meta.url), "utf8"));
const hex = rgb => `#${rgb.match(/\d+/g).slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("")}`;
const attributeSet = markup => new Set(markup.match(/[\w-]+="[^"]*"/g));

const pgconfigHtml = `<html lang="en" data-theme="dark"
  data-accent="cobalt"
  data-border-style="solid"
  data-corner-style="square"
  data-corner-marks="none"
  data-corner-size="off"
  data-mark-size="large"
  data-visual-style="default"
  data-app-shell="default"
>`;

let server, browser, url;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

async function open(path = "#theme", width = 1440, colorScheme = "dark") {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
  page.setDefaultTimeout(10_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.goto(`${url}${path}`);
  return page;
}

async function importViaDialog(page, panel, input) {
  await panel.getByRole("button", { name: "Import", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Import project config" });
  await dialog.waitFor();
  await dialog.getByRole("textbox").fill(input);
  await dialog.getByRole("button", { name: "Import", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
}

async function openLookPanel(page) {
  const panel = page.locator("#gallery-settings");
  const lookRegion = panel.locator(".gallery-look");
  if (!await lookRegion.isVisible()) {
    await page.locator(".look-chip").click();
    await lookRegion.waitFor();
  }
  return panel;
}

test("generator changes sync across components, layouts iframe, TUI, Look drawer, and reload", async () => {
  const page = await open("#theme");
  try {
    const panel = await openGenerator(page);

    await tab(panel, "Look");
    await panel.getByRole("group", { name: "Accent", exact: true }).getByRole("button", { name: "SNES", exact: true }).click();
    await panel.getByRole("radiogroup", { name: "Neutral", exact: true }).getByRole("radio", { name: "Zinc", exact: true }).click();
    await panel.getByRole("radiogroup", { name: "Technical text", exact: true }).getByRole("radio", { name: "Mono", exact: true }).click();

    await tab(panel, "Layout");
    await panel.getByRole("radiogroup", { name: "Application frame", exact: true }).getByRole("radio", { name: "Default", exact: true }).click();
    await panel.getByRole("radiogroup", { name: "Page width", exact: true }).getByRole("radio", { name: "Full", exact: true }).click();

    await tab(panel, "Frame");
    await panel.getByRole("group", { name: "Border style", exact: true }).locator('input[value="dash"]').check({ force: true });
    await panel.getByRole("radiogroup", { name: "Panel shadow", exact: true }).getByRole("radio", { name: "Hard", exact: true }).click();
    await panel.getByRole("group", { name: "Corner type", exact: true }).locator('input[value="asym"]').check({ force: true });
    await panel.getByRole("radiogroup", { name: "Panel fill", exact: true }).getByRole("radio", { name: "Solid", exact: true }).click();

    await tab(panel, "Canvas");
    await panel.getByRole("group", { name: "Canvas background", exact: true }).locator('input[value="grid"]').check({ force: true });
    await panel.getByRole("radiogroup", { name: "Paper tone", exact: true }).getByRole("radio", { name: "Accent paper", exact: true }).click();
    await panel.getByRole("radiogroup", { name: "Chart line", exact: true }).getByRole("radio", { name: "Stepped", exact: true }).click();

    await tab(panel, "Phone");
    await panel.getByRole("radiogroup", { name: "Same as desktop", exact: true }).getByRole("radio", { name: "Override", exact: true }).click();
    await panel.getByRole("group", { name: "Phone border", exact: true }).locator('input[value="rail"]').check({ force: true });
    await panel.getByRole("group", { name: "Phone background", exact: true }).locator('input[value="dots"]').check({ force: true });

    await tab(panel, "Gallery");
    await panel.getByRole("radiogroup", { name: "Theme", exact: true }).getByRole("radio", { name: "Light theme", exact: true }).click();

    await panel.getByRole("radiogroup", { name: "Preview device", exact: true }).getByRole("radio", { name: "Phone", exact: true }).click();
    const phoneFrame = () => page.frames().find(frame => frame.url().includes("phone-frame"));
    await page.frameLocator(".gen-frame iframe").locator(".layout-stats").waitFor();
    await phoneFrame().waitForFunction(() => document.documentElement.dataset.borderStyle === "rail" && document.documentElement.dataset.backgroundStyle === "dots");

    const expectedDataset = {
      theme: "light",
      accent: "snes",
      neutral: "zinc",
      technicalText: "mono",
      appShell: "default",
      pageWidth: "full",
      borderStyle: "dash",
      shadowStyle: "hard",
      cornerStyle: "asym",
      panelFill: "solid",
      backgroundStyle: "grid",
      paperTone: "accent",
      chartLine: "stepped",
    };

    const readDataset = () => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, document.documentElement.dataset[key]])), Object.keys(expectedDataset));
    assert.deepEqual(await readDataset(), expectedDataset);

    await page.evaluate(() => { window.location.hash = "#components/button"; });
    await page.locator(".catalog-preview").waitFor();
    assert.deepEqual(await readDataset(), expectedDataset);

    const lookPanel = await openLookPanel(page);
    await tab(lookPanel, "Look");
    assert.equal(await lookPanel.getByRole("group", { name: "Accent", exact: true }).getByRole("button", { name: "SNES", exact: true }).getAttribute("aria-pressed"), "true");
    assert.equal(await lookPanel.getByRole("radiogroup", { name: "Neutral", exact: true }).getByRole("radio", { name: "Zinc", exact: true }).getAttribute("aria-checked"), "true");
    await tab(lookPanel, "Frame");
    assert.equal(await lookPanel.getByRole("group", { name: "Border style", exact: true }).locator('input[value="dash"]').isChecked(), true);
    assert.equal(await lookPanel.getByRole("radiogroup", { name: "Panel shadow", exact: true }).getByRole("radio", { name: "Hard", exact: true }).getAttribute("aria-checked"), "true");
    await tab(lookPanel, "Phone");
    assert.equal(await lookPanel.getByRole("group", { name: "Phone border", exact: true }).locator('input[value="rail"]').isChecked(), true);

    await page.evaluate(() => { window.location.hash = "#example/dashboard"; });
    await page.locator(".layout-dialog").waitFor();
    await page.frameLocator(".layout-dialog iframe").locator(".layout-stats").waitFor();
    const layoutFrame = page.frames().find(frame => frame.url().includes("phone-frame#example/dashboard"));
    assert.ok(layoutFrame);
    const frameDataset = await layoutFrame.evaluate(keys => Object.fromEntries(keys.map(key => [key, document.documentElement.dataset[key]])), Object.keys(expectedDataset));
    assert.deepEqual(frameDataset, expectedDataset);

    await page.evaluate(() => { window.location.hash = "#tui/theme"; });
    await page.locator(".tui-term").waitFor();
    const snesLight = tuiData.tokens["snes-light"];
    const brandSpan = page.locator(".tui-row span", { hasText: "tui-kiso" }).first();
    assert.equal(hex(await brandSpan.evaluate(el => getComputedStyle(el).backgroundColor)), snesLight.primary);
    assert.equal(hex(await page.locator(".tui-term").evaluate(el => getComputedStyle(el).backgroundColor)), snesLight.background);
    assert.match(await page.locator(".tui-term").textContent(), /Accent\s+snes/);

    const tuiLookPanel = await openLookPanel(page);
    await tab(tuiLookPanel, "Gallery");
    await tuiLookPanel.getByRole("radiogroup", { name: "Theme", exact: true }).getByRole("radio", { name: "Dark theme", exact: true }).click();
    const snesDark = tuiData.tokens["snes-dark"];
    await page.waitForFunction(expected => {
      const rgb = getComputedStyle(document.querySelector(".tui-term")).backgroundColor;
      const toHex = value => `#${value.match(/\d+/g).slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("")}`;
      return toHex(rgb) === expected;
    }, snesDark.background);
    assert.equal(hex(await brandSpan.evaluate(el => getComputedStyle(el).backgroundColor)), snesDark.primary);

    await page.reload();
    await page.locator(".tui-term").waitFor();
    assert.deepEqual(await readDataset(), { ...expectedDataset, theme: "dark" });
    const persisted = await page.evaluate(() => window.kisoAppearance.read());
    assert.equal(persisted.phoneBorderStyle, "rail");
    assert.equal(persisted.phoneBackgroundStyle, "dots");
  } finally { await page.close(); }
});

test("imported project config persists across routes, syncs Look panel edits and presets losslessly, and survives reload", async () => {
  const page = await open("#theme");
  try {
    const panel = await openGenerator(page);
    await importViaDialog(page, panel, pgconfigHtml);
    await panel.locator(".gen-project-bar").waitFor();

    await page.evaluate(() => { window.location.hash = "#components/button"; });
    await page.locator(".catalog-preview").waitFor();

    const lookPanel = await openLookPanel(page);
    const projectBar = lookPanel.locator(".gallery-look-project");
    await projectBar.waitFor();
    assert.match(await projectBar.innerText(), /Project config/);
    assert.match(await projectBar.innerText(), /8 fields/);
    assert.match(await projectBar.innerText(), /2 preserved/);

    await tab(lookPanel, "Frame");
    await lookPanel.getByRole("group", { name: "Corner type", exact: true }).locator('input[value="rounded"]').check({ force: true });

    await tab(lookPanel, "Gallery");
    await lookPanel.getByRole("radiogroup", { name: "Theme", exact: true }).getByRole("radio", { name: "Light theme", exact: true }).click();
    await lookPanel.getByRole("radiogroup", { name: "Landing bands", exact: true }).getByRole("radio", { name: "Inside frame", exact: true }).click();

    await tab(lookPanel, "Look");
    const presetButton = lookPanel.getByLabel("Presets").getByRole("button", { name: "Drafting sheet", exact: true });
    await presetButton.focus();
    await presetButton.press("Enter");

    await lookPanel.getByRole("link", { name: "Preview and export", exact: true }).click();
    const returnedPanel = await openGenerator(page);
    await returnedPanel.locator(".gen-project-bar").waitFor();

    await tab(returnedPanel, "Code");
    const expectedAttributes = new Set([
      'lang="en"',
      'data-theme="dark"',
      'data-accent="cobalt"',
      'data-border-style="solid"',
      'data-corner-style="rounded"',
      'data-corner-marks="none"',
      'data-corner-size="medium"',
      'data-mark-size="large"',
      'data-visual-style="default"',
      'data-app-shell="default"',
      'data-shadow-style="none"',
      'data-background-style="dots"',
      'data-outer-corner-marks="ticks"',
      'data-mark-scope="outer"',
    ]);
    const exportedHtml = (await returnedPanel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.deepEqual(attributeSet(exportedHtml), expectedAttributes);
    assert.ok(!exportedHtml.includes("data-panel-fill="));
    assert.ok(!exportedHtml.includes("data-landing-bands="));
    assert.ok(!exportedHtml.includes("data-header-width="));

    await page.reload();
    const reloadedPanel = await openGenerator(page);
    await reloadedPanel.locator(".gen-project-bar").waitFor();
    await tab(reloadedPanel, "Code");
    const reloadedHtml = (await reloadedPanel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.deepEqual(attributeSet(reloadedHtml), expectedAttributes);

    await page.evaluate(() => { window.location.hash = "#components/button"; });
    await page.locator(".catalog-preview").waitFor();
    const afterReloadLook = await openLookPanel(page);
    await afterReloadLook.locator(".gallery-look-project").waitFor();
    await afterReloadLook.getByRole("button", { name: "Clear project", exact: true }).click();
    await afterReloadLook.locator(".gallery-look-project").waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => localStorage.getItem("kiso-gallery-project-config")), null);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), "cobalt");

    await afterReloadLook.getByRole("link", { name: "Preview and export", exact: true }).click();
    const clearedPanel = await openGenerator(page);
    assert.equal(await clearedPanel.locator(".gen-project-bar").count(), 0);
  } finally { await page.close(); }
});

test("opening a v3 share link enters project mode with Kiso fallbacks across components and theme", async () => {
  const v3Payload = {
    v: 3,
    kiso: { "@momoi-labs/kiso": "^1.15.0" },
    appearance: { accent: "gold", cornerStyle: "rounded", phone: { borderStyle: "none" } },
    structure: { pageWidth: "contained" },
    tui: { accent: "gold", mode: "dark", look: { fill: "translucent" } },
  };
  const code = Buffer.from(JSON.stringify(v3Payload)).toString("base64url");
  const page = await open(`?appearance=${code}#components/button`);
  try {
    await page.locator(".catalog-preview").waitFor();
    await page.waitForFunction(() => document.documentElement.dataset.accent === "gold");
    assert.equal(new URL(page.url()).search, "");
    assert.equal(new URL(page.url()).hash, "#components/button");

    const previewSettings = await page.evaluate(() => window.kisoAppearance.read());
    assert.equal(previewSettings.accent, "gold");
    assert.equal(previewSettings.cornerStyle, "rounded");
    assert.equal(previewSettings.phoneBorderStyle, "none");
    assert.equal(previewSettings.pageWidth, "contained");
    assert.equal(previewSettings.shadowStyle, "auto");
    assert.equal(previewSettings.cornerMarks, "none");
    assert.equal(previewSettings.panelFill, "solid");
    assert.equal(previewSettings.backgroundStyle, "solid");
    assert.equal(previewSettings.frameScope, "panels");
    assert.equal(previewSettings.appShell, "default");

    const lookPanel = await openLookPanel(page);
    const projectBar = lookPanel.locator(".gallery-look-project");
    await projectBar.waitFor();
    assert.match(await projectBar.innerText(), /4 fields/);
    assert.match(await projectBar.innerText(), /TUI/);

    await lookPanel.getByRole("link", { name: "Preview and export", exact: true }).click();
    const genPanel = await openGenerator(page);
    await genPanel.locator(".gen-project-bar").waitFor();
    await tab(genPanel, "Code");
    const exportedHtml = (await genPanel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.ok(exportedHtml.includes('data-accent="gold"'));
    assert.ok(exportedHtml.includes('data-corner-style="rounded"'));
    assert.ok(exportedHtml.includes('data-page-width="contained"'));
    assert.ok(exportedHtml.includes('const phone = {"borderStyle":"none"};'));
    assert.ok(!exportedHtml.includes("data-shadow-style="));
    assert.ok(!exportedHtml.includes("data-panel-fill="));
    await genPanel.locator(".gen-export-rust").waitFor();

    await page.reload();
    const reloaded = await openGenerator(page);
    await reloaded.locator(".gen-project-bar").waitFor();
  } finally { await page.close(); }
});

test("Reset in theme clears both settings and projectConfig across theme and components", async () => {
  const page = await open("#theme");
  try {
    const panel = await openGenerator(page);
    await importViaDialog(page, panel, pgconfigHtml);
    await panel.locator(".gen-project-bar").waitFor();
    assert.ok(await page.evaluate(() => localStorage.getItem("kiso-gallery-project-config") !== null));

    await panel.getByRole("button", { name: "Reset", exact: true }).click();
    await panel.locator(".gen-project-bar").waitFor({ state: "detached" });
    assert.equal(await page.evaluate(() => localStorage.getItem("kiso-gallery-project-config")), null);
    assert.deepEqual(
      await page.evaluate(() => window.kisoAppearance.read()),
      await page.evaluate(() => window.kisoAppearance.defaults),
    );

    await page.evaluate(() => { window.location.hash = "#components/button"; });
    await page.locator(".catalog-preview").waitFor();
    const lookPanel = await openLookPanel(page);
    assert.equal(await lookPanel.locator(".gallery-look-project").count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), "snes");
  } finally { await page.close(); }
});

test("v3 project demos restore across reload, cross-tab storage, drift recovery, and clearProject", async () => {
  const v3WithDemos = {
    v: 3,
    appearance: { accent: "gold" },
    structure: { pageWidth: "contained" },
    demos: { diagram: { edges: "curve", direction: "down" } },
  };
  const code = Buffer.from(JSON.stringify(v3WithDemos)).toString("base64url");
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const isCurved = async page => page.locator("#gallery-settings .gallery-component-settings").getByRole("group", { name: "Edge shape", exact: true }).getByRole("radio", { name: "Curve", exact: true }).isChecked();
  try {
    const first = await context.newPage();
    first.setDefaultTimeout(10_000);
    await first.route("https://fonts.googleapis.com/**", route => route.abort());
    await first.goto(`${url}?appearance=${code}#components/diagram`);
    await first.locator('.diagram[data-direction="down"]').first().waitFor();
    assert.equal(await isCurved(first), true);

    await first.evaluate(() => {
      const appearance = JSON.parse(localStorage.getItem("kiso-gallery-appearance"));
      localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ ...appearance, accent: "red", theme: "light", cornerMarks: "ticks" }));
      localStorage.setItem("kiso-accent", "red");
      localStorage.setItem("kiso-theme", "light");
    });
    await first.reload();
    await first.locator('.diagram[data-direction="down"]').first().waitFor();
    assert.equal(await isCurved(first), true);
    assert.equal(await first.evaluate(() => document.documentElement.dataset.accent), "gold");
    assert.equal(await first.evaluate(() => document.documentElement.dataset.cornerMarks), "none");
    assert.equal(await first.evaluate(() => document.documentElement.dataset.theme), "light");

    const second = await context.newPage();
    second.setDefaultTimeout(10_000);
    await second.route("https://fonts.googleapis.com/**", route => route.abort());
    await second.goto(`${url}#components/diagram`);
    await second.locator('.diagram[data-direction="down"]').first().waitFor();
    assert.equal(await isCurved(second), true);

    await first.evaluate(() => { window.location.hash = "#theme"; });
    const panel = await openGenerator(first);
    await panel.getByRole("button", { name: "Clear project", exact: true }).click();
    await panel.locator(".gen-project-bar").waitFor({ state: "detached" });

    const secondLook = await openLookPanel(second);
    assert.equal(await secondLook.locator(".gallery-look-project").count(), 0);
    assert.equal(await second.locator('.diagram[data-direction="down"]').count() > 0, true);
    assert.equal(await second.evaluate(() => document.documentElement.dataset.accent), "gold");

    const updatedProject = {
      v: 3,
      appearance: { accent: "teal" },
      structure: {},
      demos: { diagram: { edges: "straight", direction: "right" } },
    };
    await importViaDialog(first, panel, JSON.stringify(updatedProject));
    await panel.locator(".gen-project-bar").waitFor();

    await second.waitForFunction(() => document.documentElement.dataset.accent === "teal" && document.querySelector(".diagram")?.getAttribute("data-direction") === "right");

    await second.locator("#gallery-settings").getByRole("radio", { name: "This page", exact: true }).click();
    const demoPanel = second.locator("#gallery-settings .gallery-component-settings");
    const curveRadio = demoPanel.getByRole("group", { name: "Edge shape", exact: true }).getByRole("radio", { name: "Curve", exact: true });
    const downRadio = demoPanel.getByRole("group", { name: "Layout", exact: true }).getByRole("radio", { name: "Top to bottom", exact: true });
    await Promise.all([curveRadio.check({ force: true }), downRadio.check({ force: true })]);
    await second.waitForFunction(() => {
      const saved = JSON.parse(localStorage.getItem("kiso-gallery-project-config") || "null");
      return saved?.demos?.diagram?.edges === "curve" && saved?.demos?.diagram?.direction === "down";
    });
  } finally { await context.close(); }
});

test("incoming v3 share URL works when localStorage is blocked", async () => {
  const v3Payload = {
    v: 3,
    appearance: { accent: "gold", cornerStyle: "rounded" },
    structure: { pageWidth: "contained" },
    demos: { diagram: { edges: "curve", direction: "down" } },
  };
  const code = Buffer.from(JSON.stringify(v3Payload)).toString("base64url");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  page.setDefaultTimeout(10_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.addInitScript(() => {
    const deny = () => { throw new DOMException("Blocked", "SecurityError"); };
    Storage.prototype.getItem = deny;
    Storage.prototype.setItem = deny;
    Storage.prototype.removeItem = deny;
  });
  try {
    await page.goto(`${url}?appearance=${code}#components/diagram`);
    await page.locator('.diagram[data-direction="down"]').first().waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), "gold");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.cornerMarks), "none");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.shadowStyle), "auto");
    const lookPanel = await openLookPanel(page);
    await lookPanel.locator(".gallery-look-project").waitFor();
    assert.match(await lookPanel.locator(".gallery-look-project").innerText(), /3 fields/);
  } finally { await page.close(); }
});
