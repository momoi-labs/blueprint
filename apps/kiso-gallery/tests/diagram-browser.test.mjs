import assert from "node:assert/strict";
import { test } from "./shard.mjs";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

async function withGallery(run, { width = 1440, theme = "light" } = {}) {
  const server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 1000 }, colorScheme: theme, permissions: ["clipboard-read", "clipboard-write"] });
  page.setDefaultTimeout(5000);
  try {
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.goto(`${url}#components/diagram`);
    await run(page);
  } finally {
    await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
}

// An offset or cast border paints its shadow on the node's frame, below
// and right of the frame. Edges must paint above it, or a head that arrives
// from below or the right hides under the shadow. Group titles stay above
// edges so a line never strikes through a title.
// Each test starts its own server and browser, so empty CI shards run no hooks.
test("edge heads paint above node shadows and below group titles", () => withGallery(async page => {
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.read(), borderStyle: "offset", cornerStyle: "rounded", shadowStyle: "hard" }));
    await page.reload();
    await page.getByRole("tab", { name: "Groups", exact: true }).click();
    const order = await page.locator(".diagram-canvas").filter({ visible: true }).first().evaluate(canvas => {
      const layer = (element, pseudo) => Number(getComputedStyle(element, pseudo).zIndex) || 0;
      const edges = canvas.querySelector(".diagram-edges");
      const node = canvas.querySelector(".diagram-node");
      const title = canvas.querySelector(".diagram-group-title");
      return {
        shadow: getComputedStyle(node).boxShadow,
        edges: layer(edges), node: Math.max(layer(node), layer(node, "::before")), title: layer(title),
        after: Boolean(node.compareDocumentPosition(edges) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    assert.notEqual(order.shadow, "none", "The offset border casts a shadow");
    assert(order.edges >= order.node && order.after, `Edges (z ${order.edges}) paint after the node frame (z ${order.node})`);
    assert(order.title > order.edges, `Group titles (z ${order.title}) paint above edges (z ${order.edges})`);
}));

test("Diagram options reach Basic, Groups and Interactive", () => withGallery(async page => {
  const options = page.locator("#gallery-settings .gallery-component-settings");
  const pick = (label, name) => options.getByRole("group", { name: label, exact: true }).getByRole("radio", { name, exact: true }).check({ force: true });
  await pick("Node shadow", "Soft");
  await pick("Node corners", "Rounded");
  await pick("Node border", "Offset outline");
  await pick("Node corner size", "Large");
  await pick("Node corner marks", "Diagonal ticks");
  await pick("Background", "Dot grid");
  await pick("Strength", "Visible");
  await pick("Edge shape", "Sketch");
  await pick("Arrowhead", "Dot");
  await pick("Layout", "Top to bottom");
  for (const name of ["Basic", "Groups", "Interactive"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    const diagram = page.locator(".diagram").filter({ visible: true });
    await diagram.locator('.diagram-edges > path[data-shape="sketch"]').first().waitFor({ state: "attached" });
    assert.equal(await diagram.getAttribute("data-direction"), "down", name);
    assert.equal(await diagram.getAttribute("data-background-style"), "dots", name);
    assert.equal(await diagram.getAttribute("data-background-strength"), "visible", name);
    assert.deepEqual(await diagram.locator(".diagram-lanes").evaluate(lanes => ({
      border: lanes.dataset.borderStyle, corners: lanes.dataset.cornerStyle, size: lanes.dataset.cornerSize, marks: lanes.dataset.cornerMarks,
    })), { border: "offset", corners: "rounded", size: "large", marks: "diagonal" }, name);
    const heads = await diagram.locator('.diagram-edges > path[marker-end]').evaluateAll(paths => paths.map(path => path.getAttribute("marker-end")));
    assert(heads.length > 0 && heads.every(head => head.includes("-dot-")), `${name}: every arrow uses the chosen head`);
    assert.equal(await diagram.locator('.diagram-lanes').getAttribute('data-shadow-style'), 'soft', name);
    assert.match(await diagram.locator('.diagram-node').first().evaluate(node => getComputedStyle(node).boxShadow), /3px 3px 8px 0px$/, name);
    const radius = await diagram.locator(".diagram-node").first().evaluate(node => getComputedStyle(node).borderTopLeftRadius);
    assert.equal(radius, "24px", `${name}: the frame renders its selected corners`);
    if (name === "Basic") assert.equal(await diagram.locator('[data-status="failed"]').evaluate(node => getComputedStyle(node).borderTopStyle), "dashed", "An explicit node override still wins");
  }
}));

for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
  test(`Usage stays inside the preview with highlighted, copyable code at ${width}px ${theme}`, () => withGallery(async page => {
    const settings = page.locator("#gallery-settings");
    if (await settings.isVisible()) {
      await page.getByRole("button", { name: "Close settings", exact: true }).click();
      await settings.waitFor({ state: "hidden" });
    }
    const usage = page.locator(".catalog-preview > .catalog-code");
    await usage.locator("summary").click();
    const block = usage.locator(".code-block");
    await block.waitFor();
    assert(await block.locator(".code-keyword").count() > 0);
    assert(await block.locator(".code-string").count() > 0);
    const colors = await block.evaluate(el => ["code-keyword", "code-string"].map(role => getComputedStyle(el.querySelector(`.${role}`)).color));
    assert.notEqual(colors[0], colors[1], "Syntax roles have different colors");
    const bounds = await block.boundingBox();
    const frame = await page.locator(".catalog-preview").boundingBox();
    assert(bounds.x >= frame.x && bounds.x + bounds.width <= frame.x + frame.width + 1 && bounds.y + bounds.height <= frame.y + frame.height + 1, "Code stays inside the preview frame");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Long code scrolls locally, not the page");
    const source = await block.locator("pre code").evaluate(code => code.textContent.slice(0, -1));
    await block.getByRole("button", { name: "Copy example", exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), source);
    if (process.env.SCREENSHOT_DIR) {
      await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/diagram-usage-${width}-${theme}.png`, fullPage: true });
    }
  }, { width, theme }));
}
