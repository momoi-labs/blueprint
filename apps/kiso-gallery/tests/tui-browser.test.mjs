import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before } from "node:test";
import { test } from "./shard.mjs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const data = JSON.parse(await readFile(new URL("../src/generated/tui-gallery.json", import.meta.url), "utf8"));
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

async function open(route, { width = 1440, accent = "violet", theme = "dark" } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.addInitScript(({ accent, theme }) => localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ accent, theme })), { accent, theme });
  await page.goto(`${url}#${route}`);
  await page.locator(".tui-term").waitFor();
  return page;
}

const hex = rgb => `#${rgb.match(/\d+/g).slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("")}`;

test("The TUI tab lists every gallery page and draws the first", async () => {
  const page = await open("tui");
  try {
    // The screen lists the components itself, so the site's navigation
    // starts closed, and opens on demand.
    assert.equal(await page.locator("#component-navigation").isVisible(), false, "The navigation starts closed");
    await page.evaluate(() => { location.hash = "components"; });
    await page.locator("#component-navigation").waitFor({ state: "visible" });
    await page.evaluate(() => { location.hash = "tui"; });
    await page.locator("#component-navigation").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Expand navigation" }).click();
    const links = page.getByRole("navigation", { name: "Terminal components" }).getByRole("link");
    assert.deepEqual(await links.allTextContents(), data.pages.map(p => p.name));
    assert.match(await page.locator(".tui-term").textContent(), /Token colors at this depth/);
    const columns = await page.locator(".tui-row").first().evaluate(row =>
      [...row.children].reduce((sum, span) => sum + parseFloat(span.style.width), 0));
    assert.equal(columns, data.pages[0].states[0].size[0], "Each row fills the screen's columns");
    for (const selector of [".tui-stage", ".tui-run"]) {
      const scrolls = await page.locator(selector).evaluate(el => {
        const style = getComputedStyle(el);
        const can = value => value === "auto" || value === "scroll";
        return (can(style.overflowY) && el.scrollHeight > el.clientHeight) || (can(style.overflowX) && el.scrollWidth > el.clientWidth);
      });
      assert(!scrolls, `${selector} does not scroll on its own`);
    }
    const [screen, stage] = await page.locator(".tui-screen").evaluate(el => [el.getBoundingClientRect(), el.parentElement.getBoundingClientRect()].map(r => r.left + r.width / 2));
    assert(Math.abs(screen - stage) <= 1, "The screen sits in the middle of its panel");
  } finally {
    await page.close();
  }
});

test("Keys on the screen move through pages and states, and keep the focus", async () => {
  const page = await open("tui/form");
  try {
    const focused = () => page.locator(".tui-screen").evaluate(el => el === document.activeElement);
    assert(await focused(), "The screen has the focus when the page opens");
    await page.keyboard.press("ArrowRight");
    await page.getByRole("group", { name: /Form, Changed select/ }).waitFor();
    assert.equal(new URL(page.url()).hash, "#tui/form/form-select");
    await page.keyboard.press("ArrowDown");
    await page.getByRole("group", { name: /Modal, Default/ }).waitFor();
    assert.equal(new URL(page.url()).hash, "#tui/modal");
    assert(await focused(), "The screen keeps the focus");
    await page.getByRole("navigation", { name: "Modal states" }).getByRole("link", { name: "Help over a page" }).click();
    await page.getByRole("group", { name: /Modal, Help over a page/ }).waitFor();
    assert.equal(await page.getByRole("link", { name: "Help over a page" }).getAttribute("aria-current"), "page");
    assert(await focused(), "A state link gives the focus to the screen");
    await page.getByRole("button", { name: "Expand navigation" }).click();
    await page.getByRole("navigation", { name: "Terminal components" }).getByRole("link", { name: "Menu" }).click();
    await page.getByRole("group", { name: /Menu, Default/ }).waitFor();
    assert(await focused(), "A component link gives the focus to the screen");
  } finally {
    await page.close();
  }
});

test("j, k and the wheel scroll the screen's page, then the wheel scrolls the site", async () => {
  const page = await open("tui/theme", { width: 1440 });
  try {
    const frames = data.pages[0].states[0].scroll.length;
    assert(frames > 0, "The Theme page scrolls");
    const text = () => page.locator(".tui-text").textContent();
    const site = () => page.evaluate(() => document.querySelector(".catalog-main").scrollTop + scrollY);
    const first = await text();
    await page.keyboard.press("j");
    assert.notEqual(await text(), first, "j scrolls the page");
    await page.keyboard.press("k");
    assert.equal(await text(), first, "k scrolls it back");
    assert.equal(new URL(page.url()).hash, "#tui/theme", "j and k stay on the component");
    const box = await page.locator(".tui-term").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const before = await site();
    await page.mouse.wheel(0, 30);
    await page.waitForTimeout(100);
    assert.notEqual(await text(), first, "The wheel scrolls the page on the screen");
    assert.equal(await site(), before, "and not the site");
    for (let i = 0; i < frames + 2; i++) await page.mouse.wheel(0, 30);
    await page.waitForTimeout(300);
    assert(await site() > before, "At the page's end, the wheel scrolls the site");
  } finally {
    await page.close();
  }
});

test("A click on a name in the screen's sidebar opens that component", async () => {
  const page = await open("tui/theme", { width: 1440 });
  try {
    const menu = page.locator('.tui-link[data-page="menu"]');
    const [link, name] = await Promise.all([menu.boundingBox(), page.locator(".tui-row span", { hasText: /^Menu\s*$/ }).first().boundingBox()]);
    assert(Math.abs(link.y - name.y) <= 1 && Math.abs(link.x - name.x) <= 1, "The link lies over the name");
    await menu.click();
    await page.getByRole("group", { name: /Menu, Default/ }).waitFor();
    assert.equal(new URL(page.url()).hash, "#tui/menu");
    assert(await page.locator(".tui-screen").evaluate(el => el === document.activeElement), "The screen keeps the focus");
  } finally {
    await page.close();
  }
});

test("A TUI page named as a component does not open that component's options", async () => {
  const page = await open("tui/table", { width: 1440 });
  try {
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#gallery-settings").isVisible(), false, "Appearance stays closed");
    assert.equal(await page.locator(".catalog-pane, .catalog-section").count(), 0, "No component demo is drawn");
  } finally {
    await page.close();
  }
});

test("A screen reader reads the screen's text, not its drawn lines", async () => {
  const page = await open("tui/form/form-typing");
  try {
    const tree = await page.getByRole("group", { name: /Form, Typing/ }).ariaSnapshot();
    for (const text of ["Container image ghcr.io/kiso/app", "Another application is called this.", "tab next"]) {
      assert(tree.includes(text), `The tree has "${text}"`);
    }
    assert(!/[─━│╭╮╯╰▀▄█▌░]/.test(tree), "Drawn characters stay out of the tree");
  } finally {
    await page.close();
  }
});

test("The screen follows the accent and theme", async () => {
  for (const [accent, theme] of [["teal", "light"], ["gold", "dark"]]) {
    const page = await open("tui/theme", { accent, theme });
    try {
      const tokens = data.tokens[`${accent}-${theme}`];
      const brand = page.locator(".tui-row span", { hasText: "tui-kiso" }).first();
      assert.equal(hex(await brand.evaluate(el => getComputedStyle(el).backgroundColor)), tokens.primary, `Brand fill in ${accent} ${theme}`);
      assert.equal(hex(await page.locator(".tui-term").evaluate(el => getComputedStyle(el).backgroundColor)), tokens.background);
      assert.match(await page.locator(".tui-term").textContent(), new RegExp(`Accent\\s+${accent}`), "Rows that name the accent follow it");
    } finally {
      await page.close();
    }
  }
});

test("The screen keeps what a theme changes on its own", async () => {
  // The picker previews the accent before nocturne, and the terminal takes
  // its colors, as OSC 11 does.
  let page = await open("tui/themepicker/theme-picker", { accent: "nocturne", theme: "dark" });
  try {
    const background = hex(await page.locator(".tui-term").evaluate(el => getComputedStyle(el).backgroundColor));
    assert.equal(background, data.tokens["cobalt-dark"].background);
  } finally {
    await page.close();
  }
  // A status word on the selected row turns bold where its color alone
  // would be too faint on the fill.
  page = await open("tui/table", { accent: "violet", theme: "dark" });
  try {
    // The table's selected row is the last "Failed" on the page.
    const failed = page.locator(".tui-row span", { hasText: /^Failed/ }).last();
    assert.equal(await failed.evaluate(el => getComputedStyle(el).fontWeight), "700");
  } finally {
    await page.close();
  }
});

test("A phone opens the TUI gallery from Browse and scrolls the screen, not the page", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  page.setDefaultTimeout(5000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  try {
    await page.goto(`${url}#intro`);
    await page.getByRole("button", { name: "Browse" }).click();
    await page.getByRole("navigation", { name: "More pages" }).getByRole("link", { name: /TUI gallery/ }).click();
    await page.locator(".tui-term").waitFor();
    assert.equal(new URL(page.url()).hash, "#tui");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "The page does not overflow");
    const left = await page.locator(".tui-screen").evaluate(el => el.getBoundingClientRect().left - el.parentElement.getBoundingClientRect().left);
    assert(left >= 0, "The stage scrolls from the screen's left edge");
  } finally {
    await page.close();
  }
});
