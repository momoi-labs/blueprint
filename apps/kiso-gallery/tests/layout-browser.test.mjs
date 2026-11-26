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
  await page.locator(".catalog-pane").first().waitFor({ timeout: 30_000 });
  titles = await page.locator(".catalog-pane").evaluateAll(elements => Object.fromEntries(elements.map(el => [`components/${el.dataset.paneId}`, el.querySelector(".grid-pane-title").textContent.trim()])));
  routes = Object.keys(titles);
  assert(routes.length > 0, "Discover the entire rendered catalog, not a fixed subset");
  await page.close();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

async function open(width, frame = "default", theme = "dark", hasTouch = false, saved = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme, hasTouch });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  // Only the page sets the appearance; the preview frames inside it share
  // its storage and follow what the test saves later.
  await page.addInitScript(({ frame, theme, saved }) => { if (window === window.top) localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ appShell: frame, theme, ...saved })); }, { frame, theme, saved });
  return page;
}
async function options(page, open) {
  const panel = page.locator("#gallery-settings");
  if (await panel.isVisible() !== open) {
    if (open) await page.locator('a[href="#gallery-settings"]').click();
    else await panel.getByRole("button", { name: "Close options", exact: true }).click();
  }
  await panel.waitFor({ state: open ? "visible" : "hidden" });
}
const optionsLinkFocused = page => page.waitForFunction(() => document.activeElement?.getAttribute("href") === "#gallery-settings");
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
async function assertOptionsPanel(page) {
  const main = await page.locator('.component-gallery > [data-slot="app-shell-main"]').boundingBox();
  assert.equal(await page.locator(".gallery-settings-trigger").count(), 0, "The header has no settings gear");
  const panel = page.locator(".component-gallery > .app-shell-panel");
  if (await panel.isVisible()) {
    const frameMargin = await page.locator('.component-gallery > [data-slot="app-shell-main"]').evaluate(el => parseFloat(getComputedStyle(el).marginRight));
    assert.equal(main.x + main.width + frameMargin, (await panel.boundingBox()).x, "Only the frame's reserved margin separates preview and options");
  }
}

const widths = [320, 390, 768, 1024, 1199, 1200, 1440, 1920];
for (const [index, width] of widths.entries()) test(`Every catalog detail and layout fits at ${width}px`, async () => {
  const page = await open(width, index % 2 ? "inset" : "default", index % 2 ? "light" : "dark", width < 1024);
  const failures = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    for (const route of [...routes, "intro", "example", "example/login", "example/crud", "example/dashboard", "example/charts"]) {
      await page.goto(`${url}#${route}`);
      if (titles[route]) await page.locator('.catalog-heading [data-slot="page-header-title"]').filter({ hasText: titles[route] }).waitFor();
      else await page.locator(route === "intro" ? ".catalog-intro" : ".catalog-layouts").waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await assertOptionsPanel(page);
      const issues = await layoutIssues(page, route.startsWith("components/") ? ".catalog-preview" : ".catalog-main");
      if (issues.length) failures.push({ route, issues });
    }
    // Alone in a tab, below 1024px the example's sidebar is a drawer, so its
    // main area takes the whole shell.
    if (width < 1024) for (const example of ["crud", "dashboard", "charts"]) {
      await page.goto(`${url}?frame#example/${example}`);
      const shell = await page.locator(".app-shell").evaluate(el => {
        const main = el.querySelector(":scope > main");
        const css = getComputedStyle(main);
        return { shell: el.clientWidth, main: main.getBoundingClientRect().width + parseFloat(css.marginLeft) + parseFloat(css.marginRight) };
      });
      if (shell.main < shell.shell - 2) failures.push({ route: `?frame#example/${example}`, issues: [`example main is ${shell.main}px of a ${shell.shell}px shell`] });
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
      {
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await assertOptionsPanel(page);
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
          assert.deepEqual(await layoutIssues(page, ".catalog-preview"), [], `${width}px, collapsed=${collapsed}`);
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
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
    await options(page, true);
    await page.getByRole("combobox", { name: /^Density/ }).selectOption("spacious");
    await page.getByRole("button", { name: /work_mem/ }).click();
    for (const width of [1199, 1200, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await options(page, true);
      assert.equal(await page.getByRole("combobox", { name: /^Density/ }).inputValue(), "spacious");
      if (width < 1200) {
        const dialog = page.getByRole("dialog", { name: "Demo options", exact: true });
        await dialog.waitFor();
        assert(await dialog.evaluate(el => el.contains(document.activeElement)), "Drawer receives focus after resizing");
      }
      await options(page, false);
      await optionsLinkFocused(page);
      assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
      assert.notEqual(await page.locator("body").evaluate(el => getComputedStyle(el).overflow), "hidden");
      await options(page, true);
    }
  } finally { await page.close(); }
});

for (const width of fullSweep ? [320, 1200, 1920] : [1200]) test(`Settings choices and code remain reachable at ${width}px`, async () => {
  const page = await open(width, "inset", width === 1200 ? "light" : "dark", width === 320);
  try {
    await page.goto(`${url}#theme`);
    const panel = page.locator(".gen-workspace");
    await panel.waitFor();
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } }));
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
        if (!choices.length && ["Corner type", "Corner size", "Mark size"].includes(groupName)) continue;
        assert(choices.length > 0, `${groupName} must expose its choices`);
        for (const radio of choices) {
          if (await radio.isDisabled()) continue;
          await radio.check();
          assert(await radio.isChecked());
          const issues = await layoutIssues(page, ".gen-scroll:not([hidden])");
          assert.deepEqual(issues, [], `${style}/${groupName}/${await radio.getAttribute("value")}`);
        }
      }
      const region = panel.locator(".gen-scroll:not([hidden])");
      assert(await region.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "Settings never need sideways scrolling");
      await tab(panel, "Code");
      for (const code of await panel.locator("pre > code").all()) {
        await code.scrollIntoViewIfNeeded();
        assert(await code.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "Code wraps within its panel");
      }
      const copy = panel.getByRole("button", { name: "Copy JavaScript", exact: true });
      await copy.click();
      assert((await page.evaluate(() => window.copiedText)).includes("Object.assign(root.dataset, attributes)"));
      await page.locator(".catalog-generator").getByRole("button", { name: "Reset", exact: true }).click();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.visualStyle), "default");
    }
  } finally { await page.close(); }
});

test("The StepBar table keeps its last column reachable on a narrow preview", async () => {
  const page = await open(320);
  try {
    await page.goto(`${url}#components/step-bar`);
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
    await options(page, true);
    await page.getByRole("combobox", { name: /^Density/ }).selectOption("spacious");
    await options(page, false);
    await assertOptionsPanel(page);
    await page.getByRole("button", { name: /work_mem/ }).click();
    assert.equal(await page.getByRole("button", { name: /work_mem/ }).getAttribute("aria-expanded"), "true");
    assert.deepEqual(await layoutIssues(page, ".catalog-preview"), []);
    await options(page, true);
    assert.equal(await page.getByRole("combobox", { name: /^Density/ }).inputValue(), "spacious");
    await page.keyboard.press("Escape");
    await optionsLinkFocused(page);
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
  for (const [example, selector] of [["login", ".layout-login"], ["dashboard", ".app-shell"]]) {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    try {
      for (const page of [desktop, phone]) await page.addInitScript(value => {
        localStorage.setItem("kiso-gallery-appearance", JSON.stringify(value));
        localStorage.setItem("kiso-gallery-layout-device", "desktop");
      }, appearance);
      await desktop.goto(`${url}?frame#example/${example}`);
      await phone.goto(`${url}?phone-frame#example/${example}`);
      for (const page of [desktop, phone]) await page.locator(selector).waitFor();
      const drawn = await desktop.evaluate(layer, selector);
      // The static dashboard preview skips the Momoi signature, which its panels would clip.
      if (background === "momoi" && example === "dashboard") assert.equal(drawn.drawn, false, "The static dashboard preview draws no signature");
      else assert.deepEqual(await phone.evaluate(layer, selector), drawn, `${example} on a phone`);
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
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.locator("h1").first().waitFor();
      const header = await page.locator(".catalog-header").boundingBox();
      const trailRoom = await page.evaluate(() => {
        const css = getComputedStyle(document.documentElement);
        return parseFloat(css.getPropertyValue("--size-touch-min")) + parseFloat(css.getPropertyValue("--spacing-sm"));
      });
      assert((await page.locator("h1").first().boundingBox()).y <= header.y + header.height + trailRoom,
        `${route}: the heading follows the header with room for one touchable breadcrumb row`);
      assert.deepEqual(await small(), [], `${route}: chrome targets`);
    }
    await page.getByRole("button", { name: "Browse", exact: true }).click();
    await page.getByRole("navigation", { name: "Component categories" }).waitFor();
    assert.deepEqual(await small(), [], "Browse sheet targets");
    await page.keyboard.press("Escape");
    await page.goto(`${url}#components/table`);
    await options(page, true);
    assert.deepEqual(await small(), [], "Options drawer targets");
  } finally { await page.close(); }
});

// A frame's corner marks sit outside its border. On a phone the page padding is
// the only space between them and the screen edge, so it must keep one mark
// length (--corner-mark-tick) clear. Checks the gallery page and the phone frame.
const markPresets = {
  "Default": { appShell: "default" },
  "Pixel everywhere": { cornerStyle: "pixel", cornerSize: "small", backgroundStyle: "fibers", visualStyle: "editorial", frameScope: "all", markScope: "panels" },
  "All frames": { frameScope: "all", markScope: "all" },
};
for (const width of [390, 320]) for (const theme of fullSweep ? ["light", "dark"] : ["light"]) test(`Corner marks keep their clearance from the screen edge at ${width}px in ${theme}`, async () => {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme, hasTouch: true });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  const failures = [];
  try {
    for (const [preset, settings] of Object.entries(markPresets)) for (const path of ["", "?phone-frame"]) for (const route of ["login", "dashboard"]) {
      await page.goto(`${url}${path}#example/${route}`);
      await page.evaluate(settings => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, theme: "system", cornerStyle: "square", cornerSize: "medium", backgroundStyle: "solid", visualStyle: "default", appShell: "inset", frameScope: "panels", ...settings }), settings);
      await page.reload();
      await page.locator(path ? ".layout-phone-document" : ".catalog-layouts").waitFor();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const close = await page.evaluate(() => {
        const found = [];
        for (const el of document.querySelectorAll("*")) {
          const marks = getComputedStyle(el, "::after");
          // Only marks that reach outside their frame matter; internal guides stay inside it.
          if (marks.content === "none" || marks.position !== "absolute" || Number(marks.opacity) === 0 || !(parseFloat(marks.left) < 0 || parseFloat(marks.right) < 0)) continue;
          const box = el.getBoundingClientRect();
          if (!box.width) continue;
          const clearance = parseFloat(getComputedStyle(el).getPropertyValue("--corner-mark-tick"));
          const left = box.left + parseFloat(marks.left), right = document.documentElement.clientWidth - (box.right - parseFloat(marks.right));
          if (Math.min(left, right) < clearance - 0.5) found.push(`${el.className} marks ${left.toFixed(1)}px left, ${right.toFixed(1)}px right, need ${clearance}px`);
        }
        return found;
      });
      if (close.length) failures.push({ preset, path: path || "gallery", route, close });
    }
    assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
  } finally { await page.close(); }
});

// Panels cover the corner of a nested preview, and previews cover the page's
// corner, so the Momoi signature must not show as a fragment behind either.
for (const width of [1440, 390]) for (const theme of ["light", "dark"]) test(`Layout previews draw no partial Momoi glyph at ${width}px in ${theme}`, async () => {
  const page = await open(width, "default", theme);
  try {
    // Saved before the page loads, so the preview frame reads it on its own
    // load instead of racing a storage event.
    await page.addInitScript(() => { if (window === window.top) { const key = "kiso-gallery-appearance"; localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)), backgroundStyle: "momoi", cornerStyle: "rounded", outerCornerStyle: "asym", cornerMarks: "none", panelFill: "translucent", markScope: "outer" })); } });
    await page.goto(`${url}#example/dashboard`);
    await page.waitForFunction(() => document.documentElement.dataset.backgroundStyle === "momoi");
    // The dialog draws the example in a frame of its own.
    const frame = page.frameLocator(".layout-dialog iframe");
    await frame.locator('html[data-background-style="momoi"] .app-shell').waitFor();
    const shells = root => [...root.ownerDocument.querySelectorAll(".app-shell")].map(el => [el.className, getComputedStyle(el, "::before").content]);
    const layers = [...await page.locator("html").evaluate(shells), ...await frame.locator("html").evaluate(shells)];
    assert(layers.length >= 2, "The preview shell is drawn beside the page shell");
    assert.deepEqual(layers.filter(([, content]) => content !== "none"), [], "No shell behind the preview draws the signature");
  } finally { await page.close(); }
});

for (const width of [390, 900]) test(`Navigation overlays the page from the left at ${width}px`, async () => {
  const page = await open(width, "inset");
  try {
    await page.goto(`${url}#intro`);
    const trigger = page.getByRole("button", { name: width < 700 ? "Browse" : "Open navigation", exact: true });
    await trigger.waitFor();
    const main = page.locator(".component-gallery > main");
    const before = await main.boundingBox();
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Categories", exact: true });
    await drawer.waitFor();
    const drawerStyle = el => {
      const s = getComputedStyle(el);
      const header = getComputedStyle(el.querySelector('[data-slot="dialog-header"], .gallery-settings-heading'));
      return { width: s.width, background: s.backgroundColor, headerPadding: header.padding };
    };
    const navigationStyle = await drawer.evaluate(drawerStyle);
    assert.deepEqual(await main.boundingBox(), before, "Navigation does not move the page");
    assert.equal((await drawer.boundingBox()).x, 0, "Navigation opens at the left edge");
    assert(await drawer.evaluate(el => el.contains(document.activeElement)), "Focus enters the drawer");
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    await page.waitForFunction(el => el === document.activeElement, await trigger.elementHandle());
    await trigger.click();
    await page.getByRole("dialog", { name: "Categories", exact: true }).getByRole("link", { name: /^Forms/ }).click();
    await drawer.waitFor({ state: "hidden" });
    assert(page.url().endsWith("#components"), "Choosing a category navigates and closes the drawer");
    await page.goto(`${url}#components/table`);
    await options(page, true);
    const demoOptions = page.getByRole("dialog", { name: "Demo options", exact: true });
    await demoOptions.waitFor();
    assert.deepEqual(await demoOptions.evaluate(drawerStyle), navigationStyle, "Both drawers share width, paper and header spacing");
    const bounds = await demoOptions.boundingBox();
    assert(Math.abs(bounds.x + bounds.width - width) < 1, "Demo options open at the right edge");
    await page.keyboard.press("Escape");
    await demoOptions.waitFor({ state: "hidden" });
    await optionsLinkFocused(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});


// A floating bar spans both columns, so the surface behind it is one color.
for (const frame of ["inset", "default"]) for (const theme of ["light", "dark"]) test(`The floating bar sits on one surface over both columns in ${frame}/${theme}`, async () => {
  const page = await open(1440, frame, theme, false, { headerVariant: "floating" });
  try {
    await page.goto(`${url}#components`);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.locator(".catalog-header[data-catalog-bar='page'] .catalog-header-brand").waitFor();
    const x = await page.evaluate(() => {
      const sidebar = document.querySelector(".component-gallery > .catalog-sidebar").getBoundingClientRect();
      return { sidebar: Math.round(sidebar.right - 4), main: Math.round(sidebar.right + 4) };
    });
    const shot = (await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 8 } })).toString("base64");
    const [sidebar, main] = await page.evaluate(async ({ shot, x }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${shot}`;
      await image.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width: image.width, height: image.height });
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return [x.sidebar, x.main].map(left => [...context.getImageData(left, 4, 1, 1).data.slice(0, 3)]);
    }, { shot, x });
    assert(main.every((channel, at) => Math.abs(channel - sidebar[at]) <= 2), `${frame}/${theme}: the top over main ${main} continues the top over the sidebar ${sidebar}`);
  } finally { await page.close(); }
});

test("gallery lockups stay compact and use the accent with navigation open", async () => {
  const page = await open(1440);
  try {
    await page.goto(`${url}#components`);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // With a default or plain header, the sidebar header owns the brand.
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.read(), headerVariant: "default" }));
    const navigation = page.locator(".catalog-sidebar");
    await navigation.locator(".kiso-brand").waitFor();
    assert.equal(await page.locator(".catalog-header-brand").count(), 0, "An open desktop sidebar owns the brand");
    for (const theme of ["light", "dark"]) for (const accent of ["snes", "gold"]) {
      await page.evaluate(({ theme, accent }) => window.kisoAppearance.save({ ...window.kisoAppearance.read(), theme, accent }), { theme, accent });
      const brand = navigation.locator(".kiso-brand");
      await brand.waitFor();
      const actual = await brand.evaluate(el => ({
        height: el.getBoundingClientRect().height,
        symbol: getComputedStyle(el.querySelector(".kiso-brand-symbol path")).fill,
        ink: getComputedStyle(el).color,
      }));
      assert.equal(actual.height, 24, `${theme}/${accent}`);
      assert.notEqual(actual.symbol, actual.ink, `${theme}/${accent}: the symbol retains the accent`);
    }
    await page.getByRole("button", { name: "Collapse navigation", exact: true }).click();
    // The closed sidebar is the icon rail, and the rail keeps the mark.
    await page.locator(".component-gallery .catalog-sidebar[data-collapsed='true'] .sidebar-rail-mark .kiso-brand").waitFor();
    assert.equal(await page.locator(".catalog-header-brand").count(), 0, "The rail owns the brand on desktop");
    // The floating header keeps the brand in the full-width pill instead.
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.read(), headerVariant: "floating" }));
    await page.locator(".catalog-header[data-catalog-bar='page'] .catalog-header-brand .kiso-brand").waitFor();
    assert.equal(await page.locator(".catalog-sidebar .kiso-brand").count(), 0, "The floating rail has no mark");
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.locator(".catalog-header-brand .kiso-brand").waitFor();
      assert.equal(await navigation.isVisible(), false);
    }
  } finally { await page.close(); }
});

test("The shop app runs from sign in to sign out in one shell", async () => {
  const page = await open(1440, "default", "light");
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const shell = page.locator(".app-shell[data-shell-layout]");
  const at = async (hash, heading) => {
    await page.getByRole("heading", { level: 1, name: heading, exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.location.hash), hash);
  };
  try {
    await page.goto(`${url}?phone-frame#example/login`);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await at("#example/dashboard", "Overview");
    for (const [link, hash, heading] of [["Charts", "#example/charts", "Charts"], ["Reports", "#example/reports", "Reports"], ["Products", "#example/crud/list", "Products"]]) {
      await shell.locator(".sidebar").getByRole("link", { name: link, exact: true }).click();
      await at(hash, heading);
      assert.equal((await shell.locator(".topbar [aria-current=page]").innerText()).trim(), heading, "The breadcrumb follows the page");
    }
    await page.getByRole("button", { name: "Create product", exact: true }).click();
    await at("#example/crud/create", "New product");
    await page.getByLabel("Name", { exact: true }).fill("Caltrops, pocket tin");
    await page.getByLabel("SKU", { exact: true }).fill("CAL-0050");
    await page.getByLabel("Price (USD)", { exact: true }).fill("9.50");
    await page.getByRole("button", { name: "Create product", exact: true }).click();
    await at("#example/crud/detail", "Caltrops, pocket tin");
    await page.getByRole("tab", { name: "Orders", exact: true }).click();
    await page.getByText("No orders yet").first().waitFor();
    assert.equal(await page.evaluate(() => window.location.hash), "#example/crud/detail/full/orders");
    await page.getByRole("button", { name: "Edit product", exact: true }).click();
    await at("#example/crud/edit", "Edit Caltrops, pocket tin");
    await shell.locator(".topbar").getByRole("link", { name: "Products", exact: true }).click();
    await at("#example/crud/list", "Products");
    await page.getByRole("link", { name: "Caltrops, pocket tin", exact: true }).waitFor();
    await shell.locator(".sidebar").getByRole("link", { name: "Reports", exact: true }).click();
    await page.getByRole("link", { name: "September 2026", exact: true }).click();
    await at("#example/report/2026-09", "Tabi & Smoke, September 2026");
    await page.emulateMedia({ media: "print" });
    assert.equal(await shell.locator(".sidebar, .topbar").evaluateAll(parts => parts.filter(part => part.getClientRects().length).length), 0, "The printed report drops the shell");
    await page.emulateMedia({ media: "screen" });
    await shell.getByRole("button", { name: "Account", exact: true }).click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.locator(".layout-login").waitFor();
    assert.equal(await page.evaluate(() => window.location.hash), "#example/login");
    for (const [route, heading] of [["dashboard", "Overview"], ["crud", "Products"], ["crud/detail/full/nodes", "Shuriken, four point"], ["charts", "Charts"], ["report", "Tabi & Smoke, September 2026"]]) {
      await page.goto(`${url}?phone-frame#example/${route}`);
      await page.getByRole("heading", { level: 1, name: heading, exact: true }).waitFor();
    }
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test("The examples dialog follows the app and shows the code of the page in view", async () => {
  const page = await open(1440, "default", "light");
  try {
    await page.goto(`${url}#example`);
    await page.locator(".layout-row").first().getByRole("link", { name: "Open app", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Tabi & Smoke", exact: true });
    const frame = page.frameLocator(".layout-dialog iframe");
    await frame.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForFunction(() => window.location.hash === "#example/dashboard");
    await frame.locator(".app-shell .sidebar").getByRole("link", { name: "Reports", exact: true }).click();
    await page.waitForFunction(() => window.location.hash === "#example/reports");
    await dialog.getByRole("tab", { name: "Code", exact: true }).click();
    assert(await dialog.getByRole("radio", { name: "reports.tsx", exact: true }).isChecked());
    assert(await dialog.getByRole("radio", { name: /^Terminal/ }).isVisible(), "Reports has its terminal code");
    await dialog.getByRole("combobox", { name: /^Page/ }).click();
    await page.getByRole("option", { name: "Products", exact: true }).click();
    await dialog.getByRole("radio", { name: "crud.tsx", exact: true }).waitFor();
    assert(await dialog.getByRole("radio", { name: /^Terminal/ }).isVisible(), "Products keeps its terminal code");
    await dialog.getByRole("tab", { name: "Preview", exact: true }).click();
    await frame.getByRole("heading", { level: 1, name: "Products", exact: true }).waitFor();
    await frame.getByRole("link", { name: "Kunai, classic", exact: true }).click();
    await dialog.getByRole("tab", { name: "Code", exact: true }).click();
    await dialog.getByRole("tab", { name: "Preview", exact: true }).click();
    assert(await frame.getByRole("heading", { level: 1, name: "Kunai, classic", exact: true }).isVisible(), "The preview keeps its state behind the Code tab");
    await dialog.getByRole("radio", { name: "TUI", exact: true }).check();
    await dialog.locator(".tui-screen, .layout-stage pre").first().waitFor();
  } finally { await page.close(); }
});

test("An app page opens with the preview in place and no scroller moved", async () => {
  const page = await open(1440, "default", "light");
  try {
    await page.goto(`${url}#example/charts`);
    const frame = page.frameLocator(".layout-dialog iframe");
    const place = async heading => {
      await frame.getByRole("heading", { level: 1, name: heading, exact: true }).waitFor();
      await page.waitForTimeout(300);
      return page.evaluate(() => {
        const preview = document.querySelector(".layout-dialog iframe");
        const scrolled = root => [...root.querySelectorAll("*")].filter(element => element.scrollTop > 0).length;
        return { top: Math.round(preview.getBoundingClientRect().top), scrolled: scrolled(document) + scrolled(preview.contentDocument) };
      });
    };
    const first = await place("Charts");
    assert.equal(first.scrolled, 0, "Charts opens at the top");
    for (const name of ["Products", "Reports", "Overview", "Charts"]) {
      await frame.locator(".app-shell .sidebar").getByRole("link", { name, exact: true }).click();
      assert.deepEqual(await place(name), first, `${name} keeps the preview where Charts had it`);
    }
    await page.getByRole("dialog").getByRole("radio", { name: "TUI", exact: true }).check();
    await page.locator(".layout-dialog .tui-screen").first().waitFor();
  } finally { await page.close(); }
});

test("The terminal switch shows Reports and each monthly report", async () => {
  const page = await open(1440, "default", "light");
  try {
    for (const [route, text] of [["reports", "Monthly reports"], ["report/2026-08", "Tabi & Smoke, August 2026"]]) {
      await page.goto(`${url}#example/${route}`);
      await page.reload();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("radio", { name: "TUI", exact: true }).check();
      await dialog.locator(".tui-screen").filter({ hasText: text }).waitFor();
    }
  } finally { await page.close(); }
});

for (const [name, path, saved] of [
  ["auto spacing", "?phone-frame#example/crud", {}],
  ["compact spacing", "?phone-frame#example/crud", { appShellOuter: "compact" }],
  ["no borders", "?phone-frame#example/crud", { borderStyle: "none", outerBorderStyle: "inherit" }],
  ["dialog preview", "#example/dashboard", {}],
]) test(`The full brand bar starts with the top bar on a patterned canvas, ${name}`, async () => {
  const page = await open(1440, "inset", "light", false, { brandBar: "full", backgroundStyle: "construction", outerBorderStyle: "solid", ...saved });
  try {
    await page.goto(`${url}${path}`);
    const root = path.startsWith("?") ? page : page.frameLocator(".layout-dialog iframe");
    const shell = root.locator('html[data-brand-bar="full"] .app-shell[data-shell-layout]');
    await shell.locator(".topbar").waitFor();
    const [fill, bar] = await shell.evaluate(el => {
      const header = el.querySelector(":scope > .sidebar > .sidebar-header");
      const top = header.getBoundingClientRect().top + parseFloat(getComputedStyle(header, "::after").top);
      return [top, el.querySelector(":scope > main").getBoundingClientRect().top];
    });
    assert.equal(fill, bar, "The brand fill starts at the top edge of the main panel");
  } finally { await page.close(); }
});

test("Sidebar icons keep their position when collapsing and expanding", async () => {
  const page = await open(1440, "default", "light");
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const measure = (rootSelector, expandedMark, collapsedMark) => page.evaluate(({ rootSelector, expandedMark, collapsedMark }) => {
    const sidebar = document.querySelector(`${rootSelector} > .sidebar`);
    const collapsed = sidebar.getAttribute("data-collapsed") === "true";
    const icons = [...sidebar.querySelectorAll(".nav-item .sidebar-link-icon")].map((el, index) => {
      const box = (el.querySelector("svg") || el).getBoundingClientRect();
      const label = el.closest(".nav-item")?.querySelector(".sidebar-link-label")?.textContent?.trim() || String(index);
      return { label, x: box.x, y: box.y };
    });
    const markEl = sidebar.querySelector(collapsed ? collapsedMark : expandedMark);
    const markBox = markEl ? markEl.getBoundingClientRect() : null;
    return { collapsed, icons, mark: markBox ? { x: markBox.x, y: markBox.y } : null };
  }, { rootSelector, expandedMark, collapsedMark });
  try {
    await page.goto(`${url}?frame#example/dashboard`);
    await page.locator(".app-shell[data-shell-layout] .sidebar .sidebar-link-icon").first().waitFor();
    for (const appShell of ["default", "inset"]) {
      for (const backgroundStyle of ["solid", "construction"]) {
        for (const brandBar of ["separate", "full"]) {
          await page.evaluate(cfg => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, theme: "light", ...cfg }), { appShell, backgroundStyle, brandBar });
          if (await page.locator(".app-shell[data-shell-layout] > .sidebar").getAttribute("data-collapsed") === "true") {
            await page.locator(".topbar .sidebar-toggle").first().click();
          }
          await settle();
          const before = await measure(".app-shell[data-shell-layout]", ".sidebar-header .sidebar-expanded-content .shop-mark", ".sidebar-rail-mark .shop-mark");
          assert(before.icons.length >= 4, "ConsoleShell renders its navigation icons");
          await page.locator(".topbar .sidebar-toggle").first().click();
          await settle();
          const after = await measure(".app-shell[data-shell-layout]", ".sidebar-header .sidebar-expanded-content .shop-mark", ".sidebar-rail-mark .shop-mark");
          assert.equal(after.collapsed, true);
          const tag = `ConsoleShell ${appShell}/${backgroundStyle}/${brandBar}`;
          assert(Math.abs(after.mark.x - before.mark.x) <= 0.5 && Math.abs(after.mark.y - before.mark.y) <= 0.5, `${tag} brand mark shifted`);
          for (let i = 0; i < before.icons.length; i++) {
            const dx = after.icons[i].x - before.icons[i].x;
            const dy = after.icons[i].y - before.icons[i].y;
            assert(Math.abs(dx) <= 0.5 && Math.abs(dy) <= 0.5, `${tag} ${before.icons[i].label} shifted (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
          }
          await page.locator(".topbar .sidebar-toggle").first().click();
          await settle();
          const reopened = await measure(".app-shell[data-shell-layout]", ".sidebar-header .sidebar-expanded-content .shop-mark", ".sidebar-rail-mark .shop-mark");
          for (let i = 0; i < before.icons.length; i++) {
            const dx = reopened.icons[i].x - before.icons[i].x;
            const dy = reopened.icons[i].y - before.icons[i].y;
            assert(Math.abs(dx) <= 0.5 && Math.abs(dy) <= 0.5, `${tag} reopen ${before.icons[i].label} shifted (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
          }
        }
      }
    }

    await page.goto(`${url}#components`);
    await page.locator(".catalog-sidebar .sidebar-link-icon").first().waitFor();
    for (const headerVariant of ["default", "floating"]) {
      for (const appShell of ["default", "inset"]) {
        for (const backgroundStyle of ["solid", "construction"]) {
          await page.evaluate(cfg => window.kisoAppearance.save({ ...window.kisoAppearance.defaults, theme: "light", ...cfg }), { headerVariant, appShell, backgroundStyle });
          if (await page.locator(".catalog-sidebar").getAttribute("data-collapsed") === "true") {
            await page.locator(".catalog-sidebar-toggle").first().click();
          }
          await settle();
          const before = await measure(".component-gallery", ".catalog-sidebar-header .sidebar-expanded-content .kiso-brand-symbol", ".sidebar-rail-mark .kiso-brand-symbol");
          assert(before.icons.length > 0, "Gallery sidebar renders its navigation icons");
          await page.locator(".catalog-sidebar-toggle").first().click();
          await settle();
          const after = await measure(".component-gallery", ".catalog-sidebar-header .sidebar-expanded-content .kiso-brand-symbol", ".sidebar-rail-mark .kiso-brand-symbol");
          assert.equal(after.collapsed, true);
          const tag = `Gallery ${headerVariant}/${appShell}/${backgroundStyle}`;
          if (headerVariant === "default") {
            assert(Math.abs(after.mark.x - before.mark.x) <= 0.5 && Math.abs(after.mark.y - before.mark.y) <= 0.5, `${tag} brand mark shifted`);
          }
          for (let i = 0; i < before.icons.length; i++) {
            const dx = after.icons[i].x - before.icons[i].x;
            const dy = after.icons[i].y - before.icons[i].y;
            assert(Math.abs(dx) <= 0.5 && Math.abs(dy) <= 0.5, `${tag} ${before.icons[i].label} shifted (${dx.toFixed(2)}, ${dy.toFixed(2)})`);
          }
          await page.locator(".catalog-sidebar-toggle").first().click();
        }
      }
    }
  } finally { await page.close(); }
});

test("Background canvas stays visible across narrow and tall scrolling pages", async () => {
  const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const diffPixels = async (page, first, second) => page.evaluate(async ({ a, b }) => {
    const decode = async src => {
      const image = new Image();
      image.src = `data:image/png;base64,${src}`;
      await image.decode();
      const canvas = Object.assign(document.createElement("canvas"), { width: image.width, height: image.height });
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, image.width, image.height).data;
    };
    const da = await decode(a);
    const db = await decode(b);
    let changed = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) >= 6) changed++;
    }
    return changed;
  }, { a: first.toString("base64"), b: second.toString("base64") });
  const scrollPage = async (page, y) => {
    await page.evaluate(offset => {
      const scroller = document.querySelector('.component-gallery > [data-slot="app-shell-main"] > .catalog-main');
      if (scroller && getComputedStyle(scroller).overflowY !== "visible" && scroller.scrollHeight > scroller.clientHeight + 50) scroller.scrollTop = offset;
      else window.scrollTo(0, offset);
    }, y);
    await settle(page);
  };
  const cases = [
    [390, "inset", { accent: "snes", backgroundStyle: "glow", headerVariant: "floating", panelFill: "glass", appShellOuter: "full" }, 10000],
    [800, "inset", { accent: "snes", backgroundStyle: "glow", headerVariant: "floating", panelFill: "glass", appShellOuter: "full" }, 20000],
    [800, "default", { accent: "snes", backgroundStyle: "glow", headerVariant: "default", panelFill: "glass" }, 20000],
    [1280, "default", { accent: "snes", backgroundStyle: "glow", headerVariant: "default", panelFill: "glass" }, 20000],
    [800, "inset", { accent: "snes", backgroundStyle: "enso", headerVariant: "floating", panelFill: "glass", appShellOuter: "full" }, 500],
    [800, "inset", { accent: "snes", backgroundStyle: "momoi", headerVariant: "default", panelFill: "glass", appShellOuter: "full" }, 200],
    [800, "inset", { accent: "snes", backgroundStyle: "momoi", backgroundPlacement: "inside", headerVariant: "default", panelFill: "glass", appShellOuter: "full" }, 200],
  ];
  for (const [width, frame, saved, minPixels] of cases) {
    const page = await open(width, frame, "light", width < 1024, { ...saved, backgroundStrength: "quiet" });
    try {
      await page.goto(`${url}#components`);
      await page.locator(".catalog-pane").first().waitFor({ timeout: 30_000 });
      await settle(page);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${saved.backgroundStyle}/${frame}/${width}: horizontal overflow`);
      if (saved.backgroundPlacement === "inside") {
        const insideBounds = await page.evaluate(() => {
          const shell = document.querySelector(".component-gallery");
          const layer = getComputedStyle(shell, "::before");
          const top = parseFloat(layer.marginTop);
          const height = parseFloat(layer.height);
          const bottom = parseFloat(layer.marginBottom);
          return { top, height, bottom, viewport: innerHeight };
        });
        assert(insideBounds.top > 0, `inside placement keeps frame margin (${insideBounds.top}px)`);
        assert(insideBounds.top + insideBounds.height + insideBounds.bottom <= insideBounds.viewport + 1, `inside canvas fits initial viewport (${insideBounds.top + insideBounds.height + insideBounds.bottom}px > ${insideBounds.viewport}px)`);
      }
      for (const offset of [0, 2000]) {
        await scrollPage(page, offset);
        await page.evaluate(() => { document.documentElement.dataset.backgroundStrength = "quiet"; });
        await settle(page);
        const quiet = await page.screenshot();
        await page.evaluate(() => { document.documentElement.dataset.backgroundStrength = "visible"; });
        await settle(page);
        const visible = await page.screenshot();
        const changed = await diffPixels(page, quiet, visible);
        assert(changed >= minPixels, `${saved.backgroundStyle}/${frame}/${width}@${offset}: expected >= ${minPixels} painted pixels, got ${changed}`);
      }
    } finally { await page.close(); }
  }
  const nested = await open(1280, "inset", "light", false, { accent: "snes", backgroundStyle: "glow", backgroundStrength: "visible", headerVariant: "floating", panelFill: "glass" });
  try {
    await nested.goto(`${url}#components/app-shell`);
    await nested.locator(".gallery-shell-preview").first().waitFor({ timeout: 30_000 });
    await settle(nested);
    const bounds = await nested.evaluate(() => {
      const preview = document.querySelector(".gallery-shell-preview");
      preview.setAttribute("data-background-canvas", "");
      const rect = preview.getBoundingClientRect();
      const layer = getComputedStyle(preview, "::before");
      return { shellHeight: rect.height, layerHeight: parseFloat(layer.height), position: layer.position };
    });
    assert(bounds.shellHeight <= 420, `nested shell kept its preview height (${bounds.shellHeight}px)`);
    assert(bounds.layerHeight <= bounds.shellHeight + 1, `nested canvas stayed inside its frame (${bounds.layerHeight}px > ${bounds.shellHeight}px)`);
    assert.notEqual(bounds.position, "fixed");
  } finally { await nested.close(); }
});
