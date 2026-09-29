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
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/#components/modal-dialog`;
  browser = await engines[engine].launch();
  console.log(`Gallery dialogs: ${engine} ${browser.version()}; bundled gallery; fallback fonts`);
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

for (const width of [390, 1280]) for (const colorScheme of ["light", "dark"]) {
  test(`Dialog triggers remain aligned after saving at ${width}/${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(url);
      const edit = page.getByRole("button", { name: "Edit project", exact: true });
      const remove = page.getByRole("button", { name: "Remove project", exact: true });
      await edit.waitFor();
      const aligned = async () => {
        const first = await edit.boundingBox();
        const second = await remove.boundingBox();
        assert(Math.abs(first.y - second.y) < 0.5, `Trigger tops: ${first.y} vs ${second.y}`);
      };
      await aligned();
      const feedback = await page.getByRole("status").elementHandle();
      await edit.click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Updated project");
      await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await page.getByRole("status").textContent(), "Example changes saved.");
      assert(await feedback.evaluate(element => element.isConnected), "The feedback live region stays mounted");
      await page.waitForFunction(() => document.activeElement?.textContent === "Edit project");
      await aligned();
    } finally { await page.close(); }
  });

  test(`Task and confirmation content clears the footer at ${width}/${colorScheme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(url);
      await page.getByRole("button", { name: "Edit project", exact: true }).waitFor();
      if (screenshots) await page.locator(".demo-row").screenshot({ path: `${screenshots}/triggers-${width}-${colorScheme}.png` });
      for (const [name, role] of [["Edit project", "dialog"], ["Remove project", "alertdialog"]]) {
        await page.getByRole("button", { name, exact: true }).click();
        const dialog = page.getByRole(role);
        await dialog.waitFor();
        if (screenshots) await dialog.screenshot({ path: `${screenshots}/${role}-${width}-${colorScheme}.png` });
        const gap = await dialog.evaluate(element => {
          const last = element.querySelector(".dialog-body")?.lastElementChild ?? element.querySelector(".dialog-header").lastElementChild;
          return element.querySelector(".dialog-footer").getBoundingClientRect().top - last.getBoundingClientRect().bottom;
        });
        assert(Math.abs(gap - 16) < 0.5, `${name}: ${gap}px before footer`);
        await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
      }
    } finally { await page.close(); }
  });
}
