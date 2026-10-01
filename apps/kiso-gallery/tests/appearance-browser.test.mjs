import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { appearanceCode } from "../src/appearance-settings.ts";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const screenshots = process.env.SCREENSHOT_DIR;
let server;
let browser;
let url;
before(async () => {
  if (screenshots) await mkdir(screenshots, { recursive: true });
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

for (const visualStyle of ["Default", "Editorial"]) {
  test(`Catalog cards preserve all border styles in ${visualStyle}`, async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    const panelStyle = element => {
      const style = getComputedStyle(element);
      const edge = getComputedStyle(element, "::before");
      const marks = getComputedStyle(element, "::after");
      return { radius: style.borderRadius, border: style.borderStyle,
        edge: [edge.content, edge.borderStyle, edge.borderWidth, edge.borderRadius, edge.boxShadow],
        marks: [marks.content, marks.opacity, marks.backgroundImage, marks.maskImage] };
    };
    try {
      await page.goto(`${url}#appearance`);
      await page.getByRole("group", { name: "Visual style", exact: true }).getByRole("radio", { name: visualStyle, exact: true }).check();
      for (const border of ["solid", "none", "rail", "dash", "bevel", "double", "base", "offset"]) {
        await page.goto(`${url}#appearance`);
        await page.locator("summary", { hasText: /^Borders$/ }).click();
        await page.getByRole('group', { name: 'Border style', exact: true }).locator(`input[value="${border}"]`).check();
        const expected = await page.locator(".appearance-preview-grid > .card").evaluate(panelStyle);
        await page.goto(`${url}#components`);
        const cards = page.locator(".catalog-masonry > .catalog-section");
        await cards.first().waitFor();
        const actual = await cards.first().evaluate(panelStyle);
        assert.deepEqual(actual, expected, `Catalog card follows ${border}`);
        if (screenshots && ["none", "dash"].includes(border)) await cards.first().screenshot({ path: `${screenshots}/catalog-${visualStyle}-${border}.png` });
      }
    } finally { await page.close(); }
  });
}

for (const width of [390, 1440]) for (const frame of ["Default", "Inset"]) {
  test(`Navigation to Intro resets the previous page scroll at ${width}px in ${frame}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 830 } });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(`${url}#appearance`);
      await page.getByRole("group", { name: "Application frame", exact: true }).getByRole("radio", { name: frame, exact: true }).check();
      await page.getByRole("group", { name: "Visual style", exact: true }).getByRole("radio", { name: "Editorial", exact: true }).check();
      await page.getByRole("link", { name: "Components", exact: true }).click();
      await page.locator(".catalog-section").first().waitFor();
      const scrolled = await page.evaluate(() => {
        const content = document.querySelector(".catalog-main");
        if (getComputedStyle(content).overflowY === "auto") content.scrollTop = 700;
        else window.scrollTo(0, 700);
        return content.scrollTop + window.scrollY;
      });
      assert(scrolled > 0, "The previous page is scrolled");
      await page.getByRole("link", { name: "Intro", exact: true }).click();
      const heading = page.getByRole("heading", { name: "A shared foundation for your next interface.", exact: true });
      await heading.waitFor();
      const scroll = await page.evaluate(() => ({ page: window.scrollY, content: document.querySelector(".catalog-main").scrollTop }));
      assert.deepEqual(scroll, { page: 0, content: 0 }, "Intro starts at the top in both scroll containers");
      assert(await heading.evaluate(el => el === document.activeElement), "Navigation still focuses the heading");
      const header = await page.locator(".catalog-header").boundingBox();
      const card = await page.locator(".intro-composition .card").boundingBox();
      assert(card.y >= header.y + header.height + 24, "The card stays clear of the header");
      if (screenshots) await page.screenshot({ path: `${screenshots}/intro-${frame}-${width}.png` });
    } finally { await page.close(); }
  });
}

for (const frame of ["Default", "Inset"]) {
  test(`Layout preview keeps shell backgrounds inside its corners in ${frame}`, async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(`${url}#appearance`);
      await page.getByRole("group", { name: "Application frame", exact: true }).getByRole("radio", { name: frame, exact: true }).check();
      for (const border of ["round", "asym"]) {
        await page.goto(`${url}#appearance`);
        await page.locator("summary", { hasText: /^Borders$/ }).click();
        await page.locator(`.appearance-choices input[value="${border}"]`).check();
        await page.getByRole("group", { name: "Corner size", exact: true }).getByRole("radio", { name: "Large", exact: true }).check();
        await page.goto(`${url}#example/dashboard`);
        const preview = page.locator(".layout-preview");
        const shell = preview.locator(":scope > .layout-shell");
        await shell.waitFor();
        assert.equal(await shell.evaluate(el => getComputedStyle(el).borderRadius), await preview.evaluate(el => getComputedStyle(el).borderRadius));
        assert(await shell.evaluate(el => {
          const box = el.getBoundingClientRect();
          return !el.contains(document.elementFromPoint(box.left + 1, box.top + 1));
        }), "No child paints or receives input outside the curved corner");
        assert.equal(await preview.evaluate(el => getComputedStyle(el).overflow), "visible", "Outer corner marks remain unclipped");
        if (screenshots) await page.screenshot({ path: `${screenshots}/preview-corners-${frame}-${border}.png` });
      }
    } finally { await page.close(); }
  });
}

test("Inset frame keeps its top border and gutter while the dashboard scrolls", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  try {
    await page.goto(`${url}#appearance`);
    await page.getByRole("group", { name: "Application frame", exact: true }).getByText("Inset", { exact: true }).click();
    await page.goto(`${url}#example/dashboard`);
    const frame = page.locator('main[data-slot="app-shell-main"]');
    const header = frame.locator(":scope > .topbar");
    const title = page.getByRole("heading", { name: "Layout examples", exact: true });
    await title.waitFor();
    const initialFrame = await frame.boundingBox();
    const initialHeader = await header.boundingBox();
    const initialTitle = await title.boundingBox();
    await page.mouse.move(initialHeader.x + initialHeader.width / 2, initialHeader.y + initialHeader.height + 100);
    await page.mouse.wheel(0, 550);
    await page.waitForFunction(top => document.querySelector(".layout-preview").getBoundingClientRect().top < top, initialTitle.y);
    if (screenshots) await page.screenshot({ path: `${screenshots}/inset-dashboard-scrolled.png` });
    assert.equal((await frame.boundingBox()).y, initialFrame.y, "The frame's top border stays in the viewport");
    assert.equal((await header.boundingBox()).y, initialHeader.y, "The header stays below the frame's top border");
  } finally { await page.close(); }
});

for (const width of [390, 1440]) {
  test(`Layout choices live in Appearance and persist across pages at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(`${url}#appearance`);
      const headingChoice = page.getByRole("group", { name: "Visual style", exact: true });
      const frameChoice = page.getByRole("group", { name: "Application frame", exact: true });
      await headingChoice.getByRole("radio", { name: "Default", exact: true }).focus();
      await page.keyboard.press("ArrowRight");
      assert(await headingChoice.getByRole("radio", { name: "Editorial", exact: true }).isChecked());
      await frameChoice.getByText("Inset", { exact: true }).click();
      assert(await frameChoice.getByRole("radio", { name: "Inset", exact: true }).isChecked());
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kiso-gallery-appearance")));
      assert.equal(saved.visualStyle, "editorial");
      assert.equal(saved.appShell, "inset");
      if (screenshots) await page.getByRole("complementary", { name: "Appearance options", exact: true }).screenshot({ path: `${screenshots}/appearance-layout-${width}.png` });

      await page.goto(`${url}#components/page-header`);
      const title = page.getByRole("heading", { name: "Your homelab", exact: true });
      await title.waitFor();
      assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), width > 1023 ? "48px" : "30px");
      assert.equal(await page.getByRole("button", { name: /^(default|editorial)$/i }).count(), 0);
      await page.reload();
      await title.waitFor();
      assert.equal(await title.evaluate(el => getComputedStyle(el).fontSize), width > 1023 ? "48px" : "30px");
      if (screenshots) await page.locator('.catalog-section[aria-label="PageHeader"]').screenshot({ path: `${screenshots}/page-header-${width}.png` });

      for (const route of ["components/app-shell", "example/settings", "example/dashboard", "example/list-detail"]) {
        await page.goto(`${url}#${route}`);
        const shell = page.locator(route.startsWith("components") ? ".gallery-shell-editorial" : ".layout-shell");
        await shell.waitFor();
        assert.equal(await shell.evaluate(el => getComputedStyle(el).paddingTop), "16px");
        assert.equal(await shell.locator(':scope > [data-slot="app-shell-main"]').evaluate(el => getComputedStyle(el).borderTopWidth), "1px");
        assert.equal(await page.getByRole("button", { name: /^(default|inset)$/i }).count(), 0);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow on ${route}`);
        if (route === "example/dashboard") {
          assert.equal(await page.locator(".layout-stats .stat-value").first().evaluate(el => getComputedStyle(el).fontSize), width > 1023 ? "43.2px" : "30px");
          if (screenshots) await page.locator(".layout-preview").screenshot({ path: `${screenshots}/dashboard-editorial-${width}.png` });
        }
      }
      await page.goto(`${url}#example/login`);
      await page.locator(".layout-login").waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Overflow on login");
      await page.goto(`${url}#appearance`);
      await page.getByRole("button", { name: "Reset appearance" }).click();
      assert(await headingChoice.getByRole("radio", { name: "Default", exact: true }).isChecked());
      assert(await frameChoice.getByRole("radio", { name: "Default", exact: true }).isChecked());
      await page.reload();
      await headingChoice.waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.dataset.visualStyle), "default");
      assert.equal(await page.evaluate(() => document.documentElement.dataset.appShell), "default");
    } finally { await page.close(); }
  });
}

for (const frame of ["default", "inset"]) {
  test(`Appearance options scroll independently of the live preview in ${frame}`, async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await page.goto(`${url}#appearance`);
      if (frame === "inset") await page.getByRole("group", { name: "Application frame", exact: true }).getByText("Inset", { exact: true }).click();
      const preview = page.getByRole("region", { name: "Live preview", exact: true });
      const settings = page.getByRole("region", { name: "Appearance settings", exact: true });
      const previewBox = await preview.boundingBox();
      const settingsBox = await settings.boundingBox();
      assert(previewBox.x + previewBox.width <= settingsBox.x, "Examples sit to the left of the options");
      await page.getByLabel("Service name", { exact: true }).fill("api-staging");
      const colors = settings.locator("summary", { hasText: /^Colors$/ });
      await colors.focus();
      await page.keyboard.press("Enter");
      assert.equal(await colors.locator("..").getAttribute("open"), null);
      const layout = settings.locator("summary", { hasText: /^Layout$/ });
      assert.notEqual(await layout.locator("..").getAttribute("open"), null, "Groups open independently");
      const borders = settings.locator("summary", { hasText: /^Borders$/ });
      await borders.click();
      await settings.getByRole("radio", { name: /^Wide / }).check();
      assert.equal(await preview.locator(".card").first().evaluate(el => getComputedStyle(el).borderRadius), "16px");
      await borders.focus();
      await page.keyboard.press("Space");
      assert.equal(await borders.locator("..").getAttribute("open"), null);
      assert(await borders.evaluate(el => el === document.activeElement));
      await page.keyboard.press("Enter");
      assert(await settings.getByRole("radio", { name: /^Wide / }).isChecked());
      assert.equal(await page.getByLabel("Service name", { exact: true }).inputValue(), "api-staging");
      await settings.evaluate(el => { el.scrollTop = 0; });
      await page.mouse.move(settingsBox.x + settingsBox.width / 2, settingsBox.y + 100);
      await page.mouse.wheel(0, 400);
      await page.waitForFunction(() => document.querySelector(".appearance-controls-scroll").scrollTop > 0);
      assert.deepEqual(await preview.boundingBox(), previewBox, "The preview stays visible while options scroll");
      assert.equal(await page.evaluate(() => scrollY), 0);
      assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight));
      if (screenshots) await page.screenshot({ path: `${screenshots}/workbench-${frame}.png` });
      assert.equal(await settings.getByRole("region", { name: "Use in code", exact: true }).count(), 0);
      assert(await preview.getByRole("button", { name: "Copy HTML", exact: true }).isVisible());
    } finally { await page.close(); }
  });
}

for (const width of [390, 1440]) {
  test(`Highlighted usage follows the examples and copies the current source at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.setDefaultTimeout(5000);
    await page.route("https://fonts.googleapis.com/**", route => route.abort());
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", { value: { writeText: async text => { window.copiedText = text; } } });
    });
    try {
      await page.goto(`${url}#appearance`);
      const preview = page.getByRole("region", { name: "Live preview", exact: true });
      const usage = preview.getByRole("region", { name: "Use in code", exact: true });
      const examples = preview.locator(".appearance-preview-grid");
      const exampleBox = await examples.boundingBox();
      assert((await usage.boundingBox()).y >= exampleBox.y + exampleBox.height);
      for (const theme of ["light", "dark"]) {
        await page.getByRole("radio", { name: `${theme === "light" ? "Light" : "Dark"} theme`, exact: true }).click();
        await page.getByRole("group", { name: "Visual style", exact: true }).getByRole("radio", { name: "Editorial", exact: true }).check();
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("kiso-gallery-appearance")));
        const code = appearanceCode(saved);
        const html = usage.locator('code[data-language="html"]');
        const javascript = usage.getByRole("region", { name: "Change settings with JavaScript", exact: true }).locator("pre code");
        assert.equal(await html.textContent(), code.html);
        assert.equal(await javascript.textContent(), code.javascript);
        const colors = await html.locator("span").evaluateAll(elements => [...new Set(elements.map(el => getComputedStyle(el).color))]);
        assert(colors.length >= 3, "Tags, strings, and comments have distinct colors");
        await usage.getByRole("button", { name: "Copy HTML", exact: true }).click();
        assert.equal(await page.evaluate(() => window.copiedText), code.html);
        await usage.getByRole("button", { name: "Copy JavaScript", exact: true }).click();
        assert.equal(await page.evaluate(() => window.copiedText), code.javascript);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (screenshots) await usage.getByRole("region", { name: "Set the initial HTML", exact: true }).screenshot({ path: `${screenshots}/usage-${theme}-${width}.png` });
      }
    } finally { await page.close(); }
  });
}
