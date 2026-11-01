import assert from "node:assert/strict";
import { test } from "./shard.mjs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

// An offset or cast border paints its shadow on the node's ::before, below
// and right of the frame. Edges must paint above it, or a head that arrives
// from below or the right hides under the shadow. Group titles stay above
// edges so a line never strikes through a title.
// The test starts its own server and browser: with one test, most CI shards
// register none, and hooks would start a browser no test closes.
test("edge heads paint above node shadows and below group titles", async () => {
  const server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(5000);
  try {
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.goto(url);
    await page.evaluate(() => window.kisoAppearance.save({ ...window.kisoAppearance.read(), borderStyle: "offset", cornerStyle: "rounded" }));
    await page.goto(`${url}#components/diagram`);
    await page.reload();
    await page.getByRole("tab", { name: "Groups", exact: true }).click();
    const order = await page.locator(".diagram-canvas").filter({ visible: true }).first().evaluate(canvas => {
      const layer = (element, pseudo) => Number(getComputedStyle(element, pseudo).zIndex) || 0;
      const edges = canvas.querySelector(".diagram-edges");
      const node = canvas.querySelector(".diagram-node");
      const title = canvas.querySelector(".diagram-group-title");
      return {
        shadow: getComputedStyle(node, "::before").boxShadow,
        edges: layer(edges), node: layer(node, "::before"), title: layer(title),
        after: Boolean(node.compareDocumentPosition(edges) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    assert.notEqual(order.shadow, "none", "The offset border casts a shadow");
    assert(order.edges >= order.node && order.after, `Edges (z ${order.edges}) paint after the node frame (z ${order.node})`);
    assert(order.title > order.edges, `Group titles (z ${order.title}) paint above edges (z ${order.edges})`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.httpServer.close(resolve));
  }
});
