import assert from "node:assert/strict";
import { before, after } from "node:test";
import { test } from "./shard.mjs";
import { field, tab } from "./settings-tabs.mjs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium, devices } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
// Pull requests run one representative case per sweep; main and nightly set KISO_FULL_SWEEP=1.
const fullSweep = process.env.KISO_FULL_SWEEP === "1";
let server, browser, url, routes, titles;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
  const page = await open(1440);
  await page.goto(`${url}#components`);
  await page.locator(".catalog-pane").first().waitFor();
  titles = await page.locator(".catalog-pane").evaluateAll(elements => Object.fromEntries(elements.map(el => [`components/${el.dataset.paneId}`, el.querySelector(".grid-pane-title").textContent.trim()])));
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
  if (open) await panel.evaluate(el => el.querySelectorAll("section.appearance-section > details:not(.appearance-outer-customization)").forEach(details => { details.open = true; }));
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
  const search = await page.locator('[aria-label="Find a component"]').boundingBox();
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
      // Below 1024px the example's sidebar is a drawer, so its main area takes the whole shell.
      if (width < 1024 && await page.locator(".layout-shell").count()) {
        const shell = await page.locator(".layout-shell").evaluate(el => ({ shell: el.clientWidth, main: el.querySelector(":scope > main").getBoundingClientRect().width }));
        if (shell.main < shell.shell - 2) issues.push(`example main is ${shell.main}px of a ${shell.shell}px shell`);
      }
      // The gallery scrolls the example card, so its header must not stick to the gallery.
      if (await page.locator(".layout-preview > .layout-shell > main > .topbar").count()) {
        const position = await page.locator(".layout-preview > .layout-shell > main > .topbar").evaluate(el => getComputedStyle(el).position);
        if (position !== "static") issues.push(`example header is ${position}`);
      }
      if (issues.length) failures.push({ route, issues });
    }
    assert.deepEqual(errors, [], "No render or lifecycle exceptions");
    assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
  } finally { await page.close(); }
});

for (const frame of fullSweep ? ["default", "inset"] : ["inset"]) test(`Catalog uses available space and all card actions stay reachable in ${frame}`, async () => {
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
          // PaneGrid picks its columns from its own width: 12, then 6 up to 1024px, then 1 up to 640px.
          const grid = await page.locator(".catalog-pane-grid > .pane-grid-body").evaluate(el => ({ width: el.clientWidth, columns: Number(el.dataset.columns) }));
          assert.equal(grid.columns, grid.width > 1024 ? 12 : grid.width > 640 ? 6 : 1);
          const overlap = await page.locator(".catalog-pane-grid > .pane-grid-body > .catalog-pane").evaluateAll(cards => {
            const boxes = cards.map(el => ({ name: el.dataset.paneId, box: el.getBoundingClientRect() }));
            return boxes.flatMap((a, i) => boxes.slice(i + 1).filter(b => a.box.left < b.box.right - 1 && a.box.right > b.box.left + 1 && a.box.top < b.box.bottom - 1 && a.box.bottom > b.box.top + 1).map(b => [a.name, b.name]));
          });
          assert.deepEqual(overlap, [], "Masonry cards must not overlap after rail changes");
          assert.deepEqual(await layoutIssues(page, ".catalog-preview"), [], `${width}px, panel=${panelOpen}, collapsed=${collapsed}`);
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await settings(page, true);
    for (const link of await page.locator(".catalog-open").all()) {
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

for (const width of fullSweep ? [320, 1200, 1920] : [1200]) test(`Settings choices and code remain reachable at ${width}px`, async () => {
  const page = await open(width, "inset", width === 1200 ? "light" : "dark", width === 320);
  try {
    await page.goto(`${url}#components`);
    await settings(page, true);
    const panel = page.locator("#gallery-settings");
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } }));
    assert.equal(await panel.locator("details:not([open])").count(), 1, "Only outer overrides are collapsed");
    if (width === 320) {
      for (const button of await (await field(panel, "Accent")).getByRole("button").all()) {
        assert((await button.boundingBox()).height >= 44, "Compact accent options retain their touch targets");
      }
    }
    for (const style of ["Default", "Editorial"]) {
      await (await field(panel, "Visual style")).getByRole("radio", { name: style, exact: true }).check();
      for (const groupName of ["Border style", "Corner type", "Corner size", "Corner marks", "Mark size"]) {
        const group = await field(panel, groupName);
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
      await tab(panel, "Code");
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

// The phone preview must draw what the desktop preview draws for the same
// appearance. Only the documented phone changes may differ (Momoi size and
// corner inset), so compare what is painted, not where.
for (const background of ["momoi", "momoi-repeat", "grid", "fibers", "solid"]) test(`Desktop and phone previews draw the same ${background} background`, async () => {
  const appearance = { version: 2, theme: "dark", accent: "tangerine", paperTone: "accent", backgroundStyle: background };
  const layer = selector => {
    const element = document.querySelector(selector);
    const style = getComputedStyle(element, "::before");
    return { drawn: style.content !== "none", mask: style.maskImage, image: style.backgroundImage, repeat: style.maskRepeat, color: style.backgroundColor, opacity: style.opacity,
      paper: getComputedStyle(element).backgroundColor };
  };
  for (const [example, selector] of [["login", ".layout-login"], ["dashboard", ".layout-shell"]]) {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      for (const page of [desktop, phone]) await page.addInitScript(value => {
        localStorage.setItem("kiso-gallery-appearance", JSON.stringify(value));
        localStorage.setItem("kiso-gallery-layout-device", "desktop");
      }, appearance);
      await desktop.goto(`${url}#example/${example}`);
      await phone.goto(`${url}?phone-frame#example/${example}`);
      for (const page of [desktop, phone]) await page.locator(selector).waitFor();
      assert.deepEqual(await phone.evaluate(layer, selector), await desktop.evaluate(layer, selector), `${example} on a phone`);
    } finally { await desktop.close(); await phone.close(); }
  }
});

// The phone header is one row, so the page starts on the first screen, and
// every control in the chrome keeps a touch target.
for (const width of [390, 320]) test(`The phone chrome is compact and touchable at ${width}px`, async () => {
  const page = await browser.newPage({ ...devices["iPhone 13"], viewport: { width, height: 844 } });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  const small = () => page.evaluate(() => [...document.querySelectorAll(".catalog-header :is(a, button, input, summary), .bottom-nav :is(a, button), .catalog-heading :is(a, button, summary), .catalog-code summary, [role=dialog] :is(a, button, summary, input)")]
    .filter(el => el.getBoundingClientRect().width && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).opacity !== "0" && el.getBoundingClientRect().height < 44)
    .map(el => `${el.className} ${(el.getAttribute("aria-label") || el.textContent).trim()}`));
  try {
    for (const route of ["components", "components/button"]) {
      await page.goto(`${url}#${route}`);
      await page.locator("h1").first().waitFor();
      assert((await page.locator("h1").first().boundingBox()).y < 120, `${route}: the page heading starts in the first 120px`);
      assert.deepEqual(await small(), [], `${route}: chrome targets`);
    }
    await page.getByRole("button", { name: "Browse", exact: true }).click();
    await page.getByRole("navigation", { name: "Component categories" }).waitFor();
    assert.deepEqual(await small(), [], "Browse sheet targets");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open settings", exact: true }).click();
    await page.locator("#gallery-settings").waitFor();
    assert.deepEqual(await small(), [], "Settings drawer targets");
  } finally { await page.close(); }
});
