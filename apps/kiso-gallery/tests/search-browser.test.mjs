import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const engines = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const engine = process.env.BROWSER || "chromium";
const screenshots = process.env.SCREENSHOT_DIR;
let server;
let browser;
let url;

before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  server = await preview({
    root: fileURLToPath(new URL("../", import.meta.url)),
    configFile: false,
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0 },
  });
  url = `http://127.0.0.1:${server.httpServer.address().port}/#components/search`;
  browser = await engines[engine].launch();
  console.log(`Gallery search: ${engine} ${browser.version()}; bundled gallery; fallback fonts`);
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

for (const width of [390, 1280]) for (const colorScheme of ["light", "dark"]) {
  test(`Gallery search matches project names at ${width}/${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(url);
      const input = page.getByRole("searchbox", { name: "Search example projects" });
      await input.waitFor();
      const results = page.locator(".gallery-results li");
      const empty = page.getByText("No matching projects.", { exact: true });
      assert.deepEqual(await results.allTextContents(), ["Website", "Brand guide", "Website refresh"]);
      for (const [index, query] of ["Website", "website", "WEBSITE", "guide", "unknown"].entries()) {
        await input.fill(query);
        if (screenshots) await input.locator("..").locator("..").screenshot({ path: `${screenshots}/search-${width}-${colorScheme}-${index}.png` });
        const expected = query === "guide" ? ["Brand guide"] : query === "unknown" ? [] : ["Website", "Website refresh"];
        assert.deepEqual(await results.allTextContents(), expected, `Results for ${query}`);
        assert.equal(await empty.count(), expected.length === 0 ? 1 : 0);
        assert(await input.evaluate(element => element === document.activeElement), "Filtering retains input focus");
      }
      await input.fill("");
      assert.deepEqual(await results.allTextContents(), ["Website", "Brand guide", "Website refresh"]);
      assert.equal(await empty.count(), 0);
      assert(await input.evaluate(element => element === document.activeElement), "Clearing retains input focus");
      if (screenshots) await input.locator("..").locator("..").screenshot({ path: `${screenshots}/search-${width}-${colorScheme}-cleared.png` });
    } finally {
      await page.close();
    }
  });
}
