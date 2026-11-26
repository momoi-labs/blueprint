import assert from "node:assert/strict";
import { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { test } from "./shard.mjs";
import { openGenerator, tab } from "./settings-tabs.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const pgconfigHtml = `<html lang="en"
  data-accent="cobalt"
  data-border-style="solid"
  data-corner-style="square"
  data-corner-marks="none"
  data-corner-size="off"
  data-mark-size="large"
  data-visual-style="default"
  data-app-shell="default"
>`;

const attributeSet = markup => new Set(markup.match(/[\w-]+="[^"]*"/g));

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

async function open(width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: "dark" });
  page.setDefaultTimeout(10_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.goto(`${url}#theme`);
  await page.locator(".catalog-generator").waitFor();
  return page;
}

async function importViaDialog(page, panel, input) {
  await panel.getByRole("button", { name: "Import", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Import project config" });
  await dialog.waitFor();
  await dialog.getByRole("textbox").fill(input);
  await dialog.getByRole("button", { name: "Import", exact: true }).click();
  return dialog;
}

test("importing pgconfig HTML and exporting immediately is lossless with zero injected defaults", async () => {
  const page = await open();
  try {
    const panel = await openGenerator(page);
    const dialog = await importViaDialog(page, panel, pgconfigHtml);
    await dialog.waitFor({ state: "detached" });
    await page.getByText("Project imported", { exact: true }).waitFor();
    const status = panel.locator(".gen-project-bar");
    await status.waitFor();
    assert.match(await status.innerText(), /Project config/);
    assert.match(await status.innerText(), /8 fields/);
    assert.match(await status.innerText(), /1 preserved/);
    await tab(panel, "Code");
    const exportedHtml = (await panel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.deepEqual(attributeSet(exportedHtml), attributeSet(pgconfigHtml));
    assert.ok(exportedHtml.includes('lang="en"'));
    assert.ok(!exportedHtml.includes("data-shadow-style="));
    assert.ok(!exportedHtml.includes("data-panel-fill="));
    const exportedJson = JSON.parse(await panel.locator(".gen-export-json [data-slot='code-block'] code").innerText());
    assert.equal(exportedJson.v, 3);
    assert.deepEqual(exportedJson.appearance, {
      accent: "cobalt",
      borderStyle: "solid",
      cornerStyle: "square",
      cornerMarks: "none",
      cornerSize: "off",
      markSize: "large",
      visualStyle: "default",
    });
    assert.deepEqual(exportedJson.structure, { appShell: "default" });
  } finally { await page.close(); }
});

test("editing a control and clicking a preset in project mode change only defined fields and preserve rest attributes", async () => {
  const page = await open();
  try {
    const panel = await openGenerator(page);
    const minimal = '<html lang="en" data-theme="dark" data-accent="cobalt">';
    const dialog = await importViaDialog(page, panel, minimal);
    await dialog.waitFor({ state: "detached" });
    const sparsePreview = await page.evaluate(() => window.kisoAppearance.read());
    assert.equal(sparsePreview.accent, "cobalt");
    assert.equal(sparsePreview.shadowStyle, "auto");
    assert.equal(sparsePreview.panelFill, "solid");
    assert.equal(sparsePreview.backgroundStyle, "solid");
    assert.equal(sparsePreview.cornerStyle, "square");
    assert.equal(sparsePreview.appShell, "default");
    assert.equal(sparsePreview.frameScope, "panels");
    await tab(panel, "Frame");
    await panel.getByRole("group", { name: "Corner type", exact: true }).locator('input[value="rounded"]').check({ force: true });
    await tab(panel, "Gallery");
    await panel.getByRole("radiogroup", { name: "Landing bands", exact: true }).getByRole("radio", { name: "Inside frame", exact: true }).click();
    await tab(panel, "Code");
    const afterEdit = (await panel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.deepEqual(attributeSet(afterEdit), new Set(['lang="en"', 'data-theme="dark"', 'data-accent="cobalt"', 'data-corner-style="rounded"']));
    await tab(panel, "Look");
    const presetButton = panel.getByLabel("Presets").getByRole("button", { name: "Drafting sheet", exact: true });
    await presetButton.focus();
    await presetButton.press("Enter");
    await tab(panel, "Code");
    const afterPreset = (await panel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.deepEqual(attributeSet(afterPreset), new Set([
      'lang="en"',
      'data-theme="dark"',
      'data-accent="cobalt"',
      'data-corner-style="rounded"',
      'data-shadow-style="none"',
      'data-background-style="dots"',
      'data-corner-marks="none"',
      'data-outer-corner-marks="ticks"',
      'data-mark-scope="outer"',
    ]));
    assert.ok(!afterPreset.includes("data-border-style="));
    assert.ok(!afterPreset.includes("data-app-shell="));
    assert.ok(!afterPreset.includes("data-panel-fill="));
    await panel.getByRole("button", { name: "Clear project", exact: true }).click();
    await panel.locator(".gen-project-bar").waitFor({ state: "detached" });
    const afterClear = (await panel.locator(".gen-export [data-slot='code-block'] code").innerText()).trim();
    assert.ok(afterClear.includes("data-border-style="));
    assert.ok(!afterClear.includes('data-theme="dark"'));
  } finally { await page.close(); }
});

test("importing JSON v3 with diverging TUI renders the Rust snippet and divergence alert", async () => {
  const page = await open();
  try {
    const panel = await openGenerator(page);
    const pgProbeV3 = JSON.stringify({
      v: 3,
      kiso: { "@momoi-labs/kiso": "^1.1.0", "@momoi-labs/kiso-react": "^0.23.0" },
      appearance: { accent: "gold", panelFill: "solid", borderStyle: "solid", cornerStyle: "rounded" },
      structure: { appShell: "default", pageWidth: "contained" },
      tui: { accent: "gold", mode: "dark", look: { fill: "translucent", border: "none" } },
    });
    const dialog = await importViaDialog(page, panel, pgProbeV3);
    await dialog.waitFor({ state: "detached" });
    const v3Preview = await page.evaluate(() => window.kisoAppearance.read());
    assert.equal(v3Preview.accent, "gold");
    assert.equal(v3Preview.panelFill, "solid");
    assert.equal(v3Preview.shadowStyle, "auto");
    assert.equal(v3Preview.backgroundStyle, "solid");
    assert.equal(v3Preview.cornerMarks, "ticks");
    await tab(panel, "Code");
    const rustSection = panel.locator(".gen-export-rust");
    await rustSection.waitFor();
    const rustCode = (await rustSection.locator("[data-slot='code-block'] code").innerText()).trim();
    assert.equal(rustCode, "Theme::new(kiso_tokens::GOLD_DARK).with_look(Look { fill: PanelFill::Translucent, ..Look::DEFAULT })");
    const warningAlert = rustSection.locator('[data-slot="alert"][data-variant="warning"]');
    await warningAlert.waitFor();
    assert.match(await warningAlert.innerText(), /Web panelFill is "solid" but TUI fill is "translucent"\./);
    await panel.getByRole("button", { name: "Reset", exact: true }).click();
    await panel.locator(".gen-project-bar").waitFor({ state: "detached" });
    await rustSection.waitFor({ state: "detached" });
  } finally { await page.close(); }
});

test("invalid input in the Import dialog shows an inline error and leaves state unchanged", async () => {
  const page = await open();
  try {
    const panel = await openGenerator(page);
    const before = await page.evaluate(() => window.kisoAppearance.read());
    const dialog = await importViaDialog(page, panel, "not valid html or json");
    const message = dialog.locator('[data-slot="validation-message"]');
    await message.waitFor();
    assert.ok((await message.innerText()).length > 0);
    assert.equal(await dialog.getByRole("textbox").getAttribute("aria-invalid"), "true");
    assert.equal(await panel.locator(".gen-project-bar").count(), 0);
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), before);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), before);
  } finally { await page.close(); }
});
