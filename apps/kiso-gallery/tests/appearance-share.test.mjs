import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { preview } from "vite";
import { settingsText, shareCode, shareLink, shareText, readShare } from "../src/appearance-share.ts";

const source = readFileSync(new URL("../public/appearance-init.js", import.meta.url), "utf8");
const window = { matchMedia: () => ({ matches: false, addEventListener() {} }) };
runInNewContext(source, { window, document: { documentElement: { dataset: {} } }, localStorage: { getItem: () => null, setItem() {} } });
const { defaults, options } = window.kisoAppearance;
const kit = { defaults, options };
const plain = value => JSON.parse(JSON.stringify(value));

test("a share code holds only the settings that differ from the defaults", () => {
  assert.equal(shareText(defaults, kit), '{"v":1,"s":{}}');
  assert.deepEqual(JSON.parse(shareText({ ...defaults, accent: "teal" }, kit)), { v: 1, s: { accent: "teal" } });
  assert.match(shareCode({ ...defaults, accent: "teal" }, kit), /^[A-Za-z0-9_-]+$/);
});

test("copied settings carry every value, defaults included", () => {
  const copied = JSON.parse(settingsText(defaults));
  assert.equal(copied.s.cornerSize, defaults.cornerSize);
  assert.deepEqual(Object.keys(copied.s).sort(), Object.keys(defaults).sort());
});

test("a look round-trips through a link, a code and copied JSON, phone overrides included", () => {
  const look = { ...defaults, theme: "dark", accent: "gold", borderStyle: "manga", phoneBackgroundStyle: "grid", phoneCornerStyle: "rounded", phonePanelFill: "translucent" };
  const link = shareLink(look, kit, {}, "https://example.test/gallery/?x=1#components/button");
  assert.equal(new URL(link).hash, "#components/button");
  for (const input of [link, shareCode(look, kit), shareText(look, kit), settingsText(look)]) {
    const result = readShare(input, kit);
    assert.deepEqual(plain(result.settings), look);
    assert.deepEqual(result.skipped, []);
  }
});

test("an invalid value is skipped and the rest applies", () => {
  const result = readShare(JSON.stringify({ v: 1, s: { accent: "teal", borderStyle: "wavy", phoneCornerStyle: 3 } }), kit);
  assert.equal(result.settings.accent, "teal");
  assert.equal(result.settings.borderStyle, defaults.borderStyle);
  assert.equal(result.settings.phoneCornerStyle, "inherit");
  assert.deepEqual(result.skipped, ["borderStyle (invalid value)", "phoneCornerStyle (invalid value)"]);
});

test("an unknown key is skipped and the rest applies", () => {
  const result = readShare('{"v":1,"s":{"accent":"red","sparkle":"max","toString":"y"}}', kit);
  assert.equal(result.settings.accent, "red");
  assert.deepEqual(result.skipped, ["sparkle (unknown setting)", "toString (unknown setting)"]);
});

test("a link from before the chart split keeps its look", () => {
  const result = readShare(JSON.stringify({ v: 1, s: { chartStyle: "halftone", chartLine: "curved" } }), kit);
  assert.equal(result.settings.chartLine, "curved");
  assert.equal(result.settings.chartFill, "dots");
  assert.deepEqual(result.skipped, []);
});

test("a newer version still applies what is valid and says so", () => {
  const result = readShare(JSON.stringify({ v: 9, s: { accent: "lime" } }), kit);
  assert.equal(result.settings.accent, "lime");
  assert.equal(result.skipped.length, 1);
});

test("a malformed code never throws and applies nothing", () => {
  for (const input of ["", "   ", "%%%", "not base64!", "e30", "W10", "bnVsbA", "{", '{"v":1}', '{"v":1,"s":[]}', "?appearance=%E0%A4%A", "https://x.test/?appearance=@@"]) {
    const result = readShare(input, kit);
    assert.equal(result.settings, null, input);
    assert(result.error, input);
  }
});

const schema = { diagram: { edges: ["orthogonal", "curve"], direction: ["right", "down", "grid"] } };

test("demo options travel in their own key, through a link, a code and copied JSON", () => {
  const diagram = { edges: "curve", direction: "down" };
  assert.deepEqual(JSON.parse(shareText(defaults, kit, { diagram, table: {} })), { v: 1, s: {}, diagram });
  assert.deepEqual(JSON.parse(settingsText(defaults, { diagram })).diagram, diagram);
  for (const input of [shareLink(defaults, kit, { diagram }, "https://example.test/"), shareCode(defaults, kit, { diagram }), settingsText(defaults, { diagram })]) {
    const result = readShare(input, kit, schema);
    assert.deepEqual(plain(result.demos), { diagram });
    assert.deepEqual(result.skipped, []);
  }
});

test("a bad demo option is skipped and the rest applies", () => {
  const result = readShare(JSON.stringify({ v: 1, s: {}, diagram: { edges: "zigzag", direction: "grid", glow: "on" }, sparkle: {} }), kit, schema);
  assert.deepEqual(plain(result.demos), { diagram: { direction: "grid" } });
  assert.deepEqual(result.skipped, ["diagram.edges (invalid value)", "diagram.glow (unknown setting)", "sparkle (unknown setting)"]);
});

test("every demo with options in the panel keeps them where Share can read them", () => {
  const folder = new URL("../../../kiso/blocks/react-prototype/src/", import.meta.url);
  const demos = readdirSync(folder).filter(file => file.endsWith(".tsx") && readFileSync(new URL(file, folder), "utf8").includes("<DemoSettings "));
  assert(demos.length >= 7);
  for (const file of demos) assert.match(readFileSync(new URL(file, folder), "utf8"), /useDemoOptions</, `${file} keeps panel options in local state`);
});

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
async function open(path, width = 1440, colorScheme = "dark") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.goto(`${url}${path}`);
  return page;
}

test("opening a share link applies and saves the look, then cleans the URL", async () => {
  const look = { ...defaults, accent: "teal", borderStyle: "dash", phoneBackgroundStyle: "grid" };
  const page = await open(`?appearance=${shareCode(look, kit)}&keep=1#components/button`);
  try {
    await page.waitForFunction(() => document.documentElement.dataset.accent === "teal");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.borderStyle), "dash");
    assert.deepEqual(await page.evaluate(() => window.kisoAppearance.read()), look);
    assert.equal(new URL(page.url()).search, "?keep=1");
    assert.equal(new URL(page.url()).hash, "#components/button");
    await page.getByText("Appearance applied", { exact: true }).waitFor();
    await page.reload();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), "teal");
  } finally { await page.context().close(); }
});

test("a share link with bad parts applies the rest and names what it skipped", async () => {
  const code = Buffer.from(JSON.stringify({ v: 1, s: { accent: "gold", borderStyle: "wavy", sparkle: 1 } })).toString("base64url");
  const page = await open(`?appearance=${code}`);
  try {
    await page.waitForFunction(() => document.documentElement.dataset.accent === "gold");
    await page.getByText("Appearance applied, 2 skipped", { exact: true }).waitFor();
    await page.getByText("Skipped: borderStyle (invalid value), sparkle (unknown setting).", { exact: true }).waitFor();
  } finally { await page.context().close(); }
});

test("a malformed share link leaves the gallery working", async () => {
  const page = await open("?appearance=%%%garbage#components/button");
  try {
    await page.getByText("Appearance not applied", { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), defaults.accent);
    assert.equal(new URL(page.url()).search, "");
    await page.getByRole("button", { name: "Open settings", exact: true }).waitFor();
  } finally { await page.context().close(); }
});

for (const [width, colorScheme] of [[1440, "light"], [1440, "dark"], [390, "light"], [390, "dark"]]) {
  test(`Share actions copy a link, copy settings and paste them at ${width}px ${colorScheme}`, async () => {
    const page = await open("#components/button", width, colorScheme);
    try {
      if (!await page.locator("#gallery-settings").isVisible()) await page.getByRole("button", { name: "Open settings", exact: true }).click();
      await page.locator("#gallery-settings").waitFor();
      const menu = page.locator("#gallery-settings").getByRole("button", { name: "Share", exact: true });
      await menu.click();
      if (screenshots) await page.screenshot({ path: `${screenshots}/share-menu-${width}-${colorScheme}.png` });
      await page.getByRole("menuitem", { name: "Copy link" }).click();
      await page.getByText("Link copied", { exact: true }).waitFor();
      const link = await page.evaluate(() => navigator.clipboard.readText());
      assert(new URL(link).searchParams.get("appearance") !== null);
      assert.equal(new URL(link).hash, "#components/button");
      await menu.click();
      await page.getByRole("menuitem", { name: "Copy settings" }).click();
      await page.getByText("Settings copied", { exact: true }).waitFor();
      assert.equal(JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).s.cornerSize, "small", "Copied settings include values equal to the defaults");
      await page.evaluate(() => navigator.clipboard.writeText('{"v":1,"s":{"accent":"red","bogus":"x"}}'));
      await menu.click();
      await page.getByRole("menuitem", { name: "Paste settings" }).click();
      await page.getByText("Appearance applied, 1 skipped", { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.accent), "red");
      if (screenshots) await page.screenshot({ path: `${screenshots}/share-pasted-${width}-${colorScheme}.png` });
    } finally { await page.context().close(); }
  });
}

test("Share copies the Diagram options and Paste sets them", async () => {
  const page = await open("#components/diagram");
  try {
    const options = page.locator("#gallery-settings .gallery-component-settings");
    const pick = (label, name) => options.getByRole("group", { name: label, exact: true }).getByRole("radio", { name, exact: true }).check({ force: true });
    await pick("Node corners", "Rounded");
    await pick("Edge shape", "Curve");
    await pick("Layout", "Top to bottom");
    const menu = page.locator("#gallery-settings").getByRole("button", { name: "Share", exact: true });
    await menu.click();
    await page.getByRole("menuitem", { name: "Copy settings" }).click();
    await page.getByText("Settings copied", { exact: true }).waitFor();
    assert.deepEqual(JSON.parse(await page.evaluate(() => navigator.clipboard.readText())).diagram, { cornerStyle: "rounded", edges: "curve", direction: "down" });
    await page.evaluate(() => navigator.clipboard.writeText('{"v":1,"s":{},"diagram":{"edges":"straight","arrow":"dot"}}'));
    await menu.click();
    await page.getByRole("menuitem", { name: "Paste settings" }).click();
    await page.getByText("Appearance applied", { exact: true }).waitFor();
    assert(await options.getByRole("group", { name: "Edge shape", exact: true }).getByRole("radio", { name: "Straight", exact: true }).isChecked());
    assert(await options.getByRole("group", { name: "Arrowhead", exact: true }).getByRole("radio", { name: "Dot", exact: true }).isChecked());
    assert.equal(await page.locator(".diagram").first().getAttribute("data-direction"), "right", "A pasted look replaces the earlier options");
  } finally { await page.context().close(); }
});

// Every option a demo puts in the panel must travel with Share and clear on
// Reset. Changing each control and counting the copied keys catches a demo
// that keeps an option to itself.
for (const [route, scope] of [["diagram", "diagram"], ["alert", "alert"], ["table", "table"], ["pane-grid", "paneGrid"],
  ["scope-switcher", "scopeSwitcher"], ["form-field", "inlineFields"], ["app-shell", "applicationShell"]]) {
  test(`every ${route} option in the panel is shared and reset`, async () => {
    const page = await open(`#components/${route}`);
    try {
      const panel = page.locator("#gallery-settings");
      // PaneGrid does not open the panel by itself; wait for it to slide in.
      if (!await panel.isVisible()) await page.getByRole("button", { name: "Open settings", exact: true }).click();
      await panel.waitFor();
      await panel.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
      const section = panel.locator(".gallery-component-settings");
      await section.locator("select, fieldset").first().waitFor();
      let controls = 0;
      for (const select of await section.locator("select").all()) {
        const values = await select.locator("option").evaluateAll(options => options.map(option => option.value));
        await select.selectOption(values.find(value => value !== "inherit" && value !== values[0]) ?? values[1]);
        controls++;
      }
      for (const group of await section.getByRole("group").all()) {
        const radio = group.locator("input[type=radio]:not(:checked):not(:disabled):not([value=inherit])").last();
        await radio.check({ force: true });
        controls++;
      }
      const copied = async () => {
        await panel.getByRole("button", { name: "Share", exact: true }).click();
        await page.getByRole("menuitem", { name: "Copy settings" }).click();
        await page.getByText("Settings copied", { exact: true }).last().waitFor();
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      };
      assert(controls > 0);
      assert.equal(Object.keys((await copied())[scope] ?? {}).length, controls, "Each changed control is in the copied settings");
      await panel.getByRole("button", { name: "Reset appearance" }).click();
      assert.deepEqual(Object.keys(await copied()), ["v", "s"], "Reset clears every demo option");
    } finally { await page.context().close(); }
  });
}
