import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
let server, browser, url, routes, titles;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
  const page = await open(1440);
  await page.goto(`${url}#components`);
  await page.locator(".catalog-section-heading a").first().waitFor();
  titles = await page.locator(".catalog-section-heading a").evaluateAll(elements => Object.fromEntries(elements.map(el => [el.hash.slice(1), el.firstChild.textContent.trim()])));
  routes = Object.keys(titles);
  assert(routes.length > 0, "Discover the entire rendered catalog, not a fixed subset");
  await page.close();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

async function open(width, frame = "default", theme = "dark", hasTouch = false) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme, hasTouch });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.addInitScript(({ frame, theme }) => localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ appShell: frame, theme })), { frame, theme });
  return page;
}
async function settings(page, open) {
  const panel = page.locator("#gallery-settings");
  if (await panel.isVisible() !== open) {
    await page.getByRole("button", { name: open ? "Open settings" : "Close settings", exact: true }).click();
  }
  await panel.waitFor({ state: open ? "visible" : "hidden" });
}
async function layoutIssues(page, selector) {
  return page.locator(selector).evaluateAll(roots => {
    const issues = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push("document overflows horizontally");
    const header = document.querySelector(".catalog-header");
    const headerBox = header.getBoundingClientRect();
    for (const control of header.querySelectorAll("button, input, a")) {
      if (control.closest('[data-placement="floating"]')) continue;
      const box = control.getBoundingClientRect();
      if (box.width && box.height && (box.left < headerBox.left - 1 || box.right > headerBox.right + 1 || box.top < headerBox.top - 1 || box.bottom > headerBox.bottom + 1)) {
        issues.push(`Control outside header: ${control.getAttribute("aria-label") || control.textContent}`);
      }
    }
    for (const root of roots) {
      const bounds = root.getBoundingClientRect();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode, el = node.parentElement;
        if (!node.textContent.trim() || el.closest("[hidden],script,style,svg")) continue;
        if (getComputedStyle(el).visibility === "hidden") continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height || (rect.left >= bounds.left - 2 && rect.right <= bounds.right + 2)) continue;
        // Wide code/tables own their scroll range. Ellipsized labels and
        // visually hidden accessible names also stay inside their owners.
        let contained = false;
        for (let parent = el; parent && parent !== root.parentElement; parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX) || style.position === "fixed") { contained = true; break; }
        }
        if (!contained) issues.push(`Text outside preview: ${node.textContent.trim().slice(0, 70)}`);
      }
    }
    return issues;
  });
}
async function assertSettingsToggle(page) {
  const main = await page.locator('.component-gallery > [data-slot="app-shell-main"]').boundingBox();
  const trigger = page.locator(".gallery-settings-trigger");
  const toggle = await trigger.boundingBox();
  const header = await page.locator(".catalog-header").boundingBox();
  const search = await page.getByRole("searchbox", { name: "Find a component", exact: true }).boundingBox();
  assert.equal(await trigger.getAttribute("data-placement"), "header");
  assert(toggle.x >= header.x && toggle.x + toggle.width <= header.x + header.width + 1);
  assert(toggle.y >= header.y && toggle.y + toggle.height <= header.y + header.height + 1);
  assert(toggle.x >= search.x + search.width, "The gear stays to the right of search at every width");
  const minimum = await page.evaluate(() => matchMedia("(pointer: coarse)").matches ? 44 : 24);
  assert(toggle.width >= minimum && toggle.height >= minimum, "The settings gear keeps its pointer target");
  const panel = page.locator(".component-gallery > .app-shell-panel");
  if (await panel.isVisible()) {
    const frameMargin = await page.locator('.component-gallery > [data-slot="app-shell-main"]').evaluate(el => parseFloat(getComputedStyle(el).marginRight));
    assert.equal(main.x + main.width + frameMargin, (await panel.boundingBox()).x, "Only the frame's reserved margin separates preview and settings");
  }
}

const widths = [320, 390, 768, 1024, 1199, 1200, 1440, 1920];
for (const [index, width] of widths.entries()) test(`Every catalog detail and layout fits at ${width}px`, async () => {
  const page = await open(width, index % 2 ? "inset" : "default", index % 2 ? "light" : "dark", width < 1024);
  const failures = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    for (const route of [...routes, "intro", "example/dashboard", "example/list-detail", "example/settings", "example/login"]) {
      await page.goto(`${url}#${route}`);
      if (titles[route]) await page.locator('.catalog-heading [data-slot="page-header-title"]').filter({ hasText: titles[route] }).waitFor();
      else await page.locator(route === "intro" ? ".catalog-intro" : ".catalog-layouts").waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await settings(page, width >= 1200);
      await assertSettingsToggle(page);
      const issues = await layoutIssues(page, route.startsWith("components/") ? ".catalog-preview" : ".catalog-main");
      if (issues.length) failures.push({ route, issues });
    }
    assert.deepEqual(errors, [], "No render or lifecycle exceptions");
    assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
  } finally { await page.close(); }
});

for (const frame of ["default", "inset"]) test(`Catalog uses available space and all card actions stay reachable in ${frame}`, async () => {
  const page = await open(1920, frame);
  try {
    await page.goto(`${url}#components`);
    for (const width of [1920, 1200, 1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const panelOpen of width >= 1200 ? [true, false] : [false]) {
        await settings(page, panelOpen);
        await assertSettingsToggle(page);
        for (const collapsed of width >= 1200 ? [false, true] : [false]) {
          if (width >= 1200) {
            const button = page.getByRole("button", { name: collapsed ? "Collapse navigation" : "Expand navigation", exact: true });
            if (await button.isVisible()) await button.click();
          }
          // ResizeObserver must finish the card heights before checking overlap.
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const grid = await page.locator(".catalog-masonry").evaluate(el => ({ width: el.clientWidth, columns: getComputedStyle(el).gridTemplateColumns.split(" ").length }));
          assert.equal(grid.columns, grid.width >= 960 ? 4 : grid.width >= 560 ? 2 : 1);
          const overlap = await page.locator(".catalog-masonry > section").evaluateAll(cards => {
            const boxes = cards.map(el => ({ name: el.getAttribute("aria-labelledby"), box: el.getBoundingClientRect() }));
            return boxes.flatMap((a, i) => boxes.slice(i + 1).filter(b => a.box.left < b.box.right - 1 && a.box.right > b.box.left + 1 && a.box.top < b.box.bottom - 1 && a.box.bottom > b.box.top + 1).map(b => [a.name, b.name]));
          });
          assert.deepEqual(overlap, [], "Masonry cards must not overlap after rail changes");
          assert.deepEqual(await layoutIssues(page, ".catalog-preview"), [], `${width}px, panel=${panelOpen}, collapsed=${collapsed}`);
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await settings(page, true);
    for (const link of await page.locator(".catalog-section-heading a").all()) {
      await link.evaluate(el => el.scrollIntoView({ block: "center" }));
      assert(await link.evaluate(el => {
        const box = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(box.right - 4, box.y + box.height / 2));
      }), `Card action must receive pointer input: ${await link.textContent()}`);
    }
  } finally { await page.close(); }
});

test("Resizing between panel and drawer retains values, focus and page scrolling", async () => {
  const page = await open(1440, "inset");
  try {
    await page.goto(`${url}#components/table`);
    await settings(page, true);
    await page.getByRole("combobox", { name: /^Density/ }).selectOption("spacious");
    await page.getByRole("button", { name: /work_mem/ }).click();
    for (const width of [1199, 1200, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await settings(page, true);
      assert.equal(await page.getByRole("combobox", { name: /^Density/ }).inputValue(), "spacious");
      if (width < 1200) {
        const dialog = page.getByRole("dialog", { name: "Appearance", exact: true });
        await dialog.waitFor();
        assert(await dialog.evaluate(el => el.contains(document.activeElement)), "Drawer receives focus after resizing");
      }
      await settings(page, false);
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open settings");
      assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
      assert.notEqual(await page.locator("body").evaluate(el => getComputedStyle(el).overflow), "hidden");
      await settings(page, true);
    }
  } finally { await page.close(); }
});

for (const width of [320, 1200, 1920]) test(`Settings choices and code remain reachable at ${width}px`, async () => {
  const page = await open(width, "inset", width === 1200 ? "light" : "dark", width === 320);
  try {
    await page.goto(`${url}#components`);
    await settings(page, true);
    const panel = page.locator("#gallery-settings");
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } }));
    assert.equal(await panel.locator("details:not([open])").count(), 1, "Only outer overrides are collapsed");
    if (width === 320) {
      for (const button of await panel.getByRole("group", { name: "Accent", exact: true }).getByRole("button").all()) {
        assert((await button.boundingBox()).height >= 44, "Compact accent options retain their touch targets");
      }
    }
    for (const style of ["Default", "Editorial"]) {
      await panel.getByRole("group", { name: "Visual style", exact: true }).getByRole("radio", { name: style, exact: true }).check();
      for (const groupName of ["Border style", "Corner type", "Corner size", "Corner marks", "Mark size"]) {
        const group = panel.getByRole("group", { name: groupName, exact: true });
        const choices = await group.getByRole("radio").all();
        assert(choices.length > 0, `${groupName} must expose its choices`);
        for (const radio of choices) {
          if (await radio.isDisabled()) continue;
          await radio.check();
          assert(await radio.isChecked());
          const issues = await layoutIssues(page, ".appearance-controls-scroll");
          assert.deepEqual(issues, [], `${style}/${groupName}/${await radio.inputValue()}`);
        }
      }
      const region = panel.getByRole("region", { name: "Settings options" });
      assert(await region.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "Settings never need sideways scrolling");
      for (const code of await panel.locator("pre > code").all()) {
        await code.scrollIntoViewIfNeeded();
        assert(await code.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "Code wraps within its panel");
      }
      const copy = panel.getByRole("button", { name: "Copy JavaScript", exact: true });
      await copy.click();
      assert((await page.evaluate(() => window.copiedText)).includes("Object.assign(root.dataset, attributes)"));
      await panel.getByRole("button", { name: "Reset appearance", exact: true }).click();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.visualStyle), "editorial");
    }
  } finally { await page.close(); }
});

test("The StepBar table keeps its last column reachable on a narrow preview", async () => {
  const page = await open(320);
  try {
    await page.goto(`${url}#components/step-bar`);
    await settings(page, false);
    const scroll = page.locator('.catalog-preview [data-slot="table-container"]');
    await scroll.scrollIntoViewIfNeeded();
    await scroll.evaluate(el => el.scrollLeft = el.scrollWidth);
    const box = await scroll.boundingBox();
    const cell = await scroll.getByRole("cell", { name: "192.168.5.22", exact: true }).boundingBox();
    assert(cell.x >= box.x && cell.x + cell.width <= box.x + box.width + 1);
    assert.equal(await scroll.evaluate(el => el.scrollWidth - el.clientWidth - el.scrollLeft), 0,
      "The last column is reachable whether the table fits or needs scrolling");
  } finally { await page.close(); }
});

test("The workspace remains usable at an equivalent 200% layout zoom", async () => {
  // A 1920x1080 display at 200% has a 960x540 CSS viewport and DPR 2.
  // This checks layout magnification, not native browser or text-only zoom.
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
  try {
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.goto(`${url}#components/table`);
    await settings(page, true);
    await page.getByRole("combobox", { name: /^Density/ }).selectOption("spacious");
    await settings(page, false);
    await assertSettingsToggle(page);
    await page.getByRole("button", { name: /work_mem/ }).click();
    assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
    assert.deepEqual(await layoutIssues(page, ".catalog-preview"), []);
    await settings(page, true);
    assert.equal(await page.getByRole("combobox", { name: /^Density/ }).inputValue(), "spacious");
    await page.getByRole("button", { name: "Reset appearance", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Open settings");
  } finally { await page.close(); }
});
