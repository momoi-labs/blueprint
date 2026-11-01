import assert from "node:assert/strict";
import { after, before } from "node:test";
import { test } from "./shard.mjs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
let server;
let browser;
let url;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

// An offset or cast border paints its shadow on the node's ::before, below
// and right of the frame. Edges must paint above it, or a head that arrives
// from below or the right hides under the shadow. Group titles stay above
// edges so a line never strikes through a title.
test("edge heads paint above node shadows and below group titles", async () => {
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
  } finally { await page.close(); }
});
