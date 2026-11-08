import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { chromium } from "playwright";
import { toggleSettings } from "./settings-tabs.mjs";

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

for (const width of [390, 1440]) {
  test(`SiteSection takes its options from the panel at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.goto(`${url}#components/site-section`);
      const section = page.locator("main .site-section").first();
      await section.waitFor();
      const panel = page.locator("#gallery-settings");
      if (!await panel.isVisible()) await toggleSettings(page);
      const options = panel.locator(".gallery-component-settings");
      await options.getByLabel("Tone").selectOption("accent");
      await options.getByLabel("Body layout").selectOption("grid");
      assert.equal(await section.getAttribute("data-tone"), "accent");
      assert.equal(await section.locator(".site-section-body").getAttribute("data-layout"), "grid");
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No sideways scroll");
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  });
}

test("Spark charts open on the pinned moment", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${url}#components/chart`);
    const spark = page.locator(".chart-spark-demo");
    await spark.locator("[data-slot=chart]").first().waitFor();
    assert.equal(await spark.locator(".chart-spark-tick[data-pinned]").count(), 2);
    assert.equal(await spark.locator(".chart-pin-readout").count(), 0);
  } finally { await page.close(); }
});

test("SiteHeader sticks, follows the band under it and folds into a menu", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${url}#components/site-header`);
    const frame = page.locator(".site-demo-frame").first();
    const header = frame.locator(".site-header");
    await header.waitFor();
    assert.equal(await header.getAttribute("data-tone"), "inverse");
    await frame.evaluate(element => element.scrollTop = element.scrollHeight);
    await page.waitForTimeout(200);
    assert.notEqual(await header.getAttribute("data-tone"), "inverse");
    const offset = await header.evaluate(element => element.getBoundingClientRect().top - element.parentElement.getBoundingClientRect().top);
    assert(offset < 2, `The header stays at the top, ${offset}px`);

    const phone = page.locator(".site-demo-phone .site-header").first();
    assert.equal(await phone.locator(".site-header-nav").isVisible(), false);
    const toggle = phone.getByRole("button", { name: "Open menu" });
    await toggle.click();
    assert.equal(await phone.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded"), "true");
    assert(await phone.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Report" }).isVisible());
    await page.keyboard.press("Escape");
    assert.equal(await phone.locator(".site-header-nav").isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Open menu");
  } finally { await page.close(); }
});

test("A prompted command copies without its prompt", async () => {
  const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  try {
    await page.goto(`${url}#components/code-block`);
    const block = page.locator(".code-block[data-layout=inline]").filter({ hasText: "install.sh" });
    assert.equal(await block.locator(".code-block-prompt").getAttribute("aria-hidden"), "true");
    await block.getByRole("button", { name: "Copy command" }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "curl -fsSL https://pg-probe.dev/install.sh | sh");
  } finally { await context.close(); }
});
