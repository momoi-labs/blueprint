import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { preview } from "vite";
import { chromium } from "playwright";

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

for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
  test(`landing in the gallery at ${width}px, ${theme}`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme });
    try {
      await page.addInitScript(theme => localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ theme })), theme);
      await page.goto(`${url}#intro`);
      await page.locator(".intro-contrast").waitFor();
      const check = async () => {
        assert.equal(await page.locator(".intro-contrast").evaluate(el => getComputedStyle(el).colorScheme), theme === "light" ? "dark" : "light");
        assert(await page.locator(".intro-cta").isVisible());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.equal(await page.locator(".hero-panel .card").count(), 3);
        assert.equal(await page.locator(".studio-showcase-grid > section").count(), 3);
        assert.equal(await page.locator('table[aria-label="Example projects"]').count(), 1);
        const routes = await page.locator(".intro-page a").evaluateAll(links => [...new Set(links.map(link => link.getAttribute("href")))]);
        assert.deepEqual(routes.sort(), ["#appearance", "#components", "#components/form-field", "#example", "#example/crud", "https://github.com/momoi-labs/blueprint"]);
        assert(await page.locator(".studio-hero h1").innerText().then(text => text.includes("Small pieces.")));
      };
      await check();
      await page.goto(`${url}?phone-frame#example/landing`);
      await page.locator(".intro-contrast").waitFor();
      await check();
      await page.locator('.component-orbit').getByRole('switch', { name: 'Auto-save', exact: true }).click();
      assert.equal(await page.locator('.component-orbit-center strong').innerText(), '1');
      await page.getByRole("button", { name: "Apply changes", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "Preferences applied." }).waitFor();
      assert.equal(await page.locator(".intro-page h1").count(), 1);
    } finally { await page.close(); }
  });
}

test("landing catalog exposes source and only web devices", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(`${url}#example`);
    const row = page.locator(".layout-row").filter({ has: page.getByRole("heading", { name: "Landing page", exact: true }) });
    await row.getByRole("link", { name: "Open", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Code", exact: true }).click();
    assert(await dialog.getByRole("radio", { name: "landing.css", exact: true }).isVisible());
    await dialog.getByRole("tab", { name: "Preview", exact: true }).click();
    assert.equal(await dialog.getByRole("radio", { name: "TUI", exact: true }).count(), 0);
    assert(await dialog.locator("iframe").isVisible());
  } finally { await page.close(); }
});

test("landing follows Full and Contained without a second width limit", async () => {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  try {
    const widths = {};
    for (const pageWidth of ["full", "contained"]) {
      await page.goto(url);
      await page.evaluate(pageWidth => localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ pageWidth, pageAlign: "center", appShell: "default" })), pageWidth);
      await page.reload();
      await page.locator(".studio-landing").waitFor();
      const geometry = await page.locator(".studio-landing").evaluate(root => ({
        width: root.getBoundingClientRect().width,
        contentWidth: (() => { const el = root.querySelector(".studio-wrap"), style = getComputedStyle(el); return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight); })(),
        wraps: [...root.querySelectorAll(".studio-wrap")].map(el => el.getBoundingClientRect().width),
        bands: [...root.querySelectorAll(".intro-contrast, .intro-cta")].map(el => el.getBoundingClientRect().width),
        radius: getComputedStyle(root).borderRadius,
      }));
      for (const width of [...geometry.wraps, ...geometry.bands]) assert(Math.abs(width - geometry.width) <= 1, `${pageWidth}: section fills the landing`);
      assert.equal(geometry.radius, "0px", "The landing is a page, not a nested card");
      assert.equal(geometry.width, 1920, "Both modes keep backgrounds edge to edge");
      widths[pageWidth] = geometry.contentWidth;
    }
    assert(widths.full > widths.contained + 200, JSON.stringify(widths));
    assert(widths.full > 1280, "Full does not retain the prototype's content cap");

  } finally { await page.close(); }
});

for (const headerVariant of ["default", "floating", "plain"]) test(`Intro integrates the ${headerVariant} header into its full panel`, async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.addInitScript(headerVariant => localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ pageWidth: "full", appShell: "default", headerVariant })), headerVariant);
    await page.goto(`${url}#intro`);
    await page.locator(".studio-hero").waitFor();
    const geometry = await page.evaluate(() => {
      const header = document.querySelector(".catalog-header");
      const hero = document.querySelector(".studio-hero");
      const main = header.parentElement;
      const box = el => { const { left, right, top, bottom } = el.getBoundingClientRect(); return { left, right, top, bottom }; };
      return { header: box(header), hero: box(hero), main: box(main), headerColor: getComputedStyle(header).backgroundColor, heroColor: getComputedStyle(hero.parentElement).backgroundColor, radius: getComputedStyle(header).borderRadius, shadow: getComputedStyle(header).boxShadow };
    });
    assert(Math.abs(geometry.header.left - geometry.hero.left) <= 1, JSON.stringify(geometry));
    assert(Math.abs(geometry.header.right - geometry.hero.right) <= 16, JSON.stringify(geometry));
    assert(Math.abs(geometry.header.bottom - geometry.hero.top) <= 1, JSON.stringify(geometry));
    assert.equal(geometry.headerColor, geometry.heroColor);
    assert.equal(geometry.radius, "0px");
    assert.equal(geometry.shadow, "none");
    await page.locator('.studio-hero a[href="#components"]').click();
    await page.waitForURL(`${url}#components`);
    await page.locator(".catalog-landing").waitFor({ state: "detached" });
  } finally { await page.close(); }
});

for (const panelFill of ["glass", "translucent"]) test(`Inset Intro reveals the canvas with ${panelFill} panels`, async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
  try {
    await page.addInitScript(panelFill => localStorage.setItem("kiso-gallery-appearance", JSON.stringify({
      theme: "dark", accent: "snes", appShell: "inset", appShellOuter: "full", pageWidth: "full", pageAlign: "center",
      headerVariant: "floating", panelFill, backgroundStyle: "glow", backgroundPlacement: "both",
      outerBorderStyle: "none", outerCornerStyle: "square", outerCornerMarks: "none", outerShadowStyle: "none",
    })), panelFill);
    await page.goto(`${url}#intro`);
    await page.locator(".studio-hero").waitFor();
    const surfaces = await page.evaluate(() => [
      document.querySelector('.component-gallery > [data-slot="app-shell-main"]'),
      document.querySelector(".catalog-header"), document.querySelector(".studio-landing"),
    ].map(el => ({ background: getComputedStyle(el).backgroundColor, x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y })));
    for (const surface of surfaces) assert.equal(surface.background, "rgba(0, 0, 0, 0)", JSON.stringify(surfaces));
    assert.equal(surfaces[0].x, 0, "Full Intro reaches the shell edge");
    assert.equal(surfaces[0].y, 0);
    const band = await page.locator(".studio-cta").boundingBox();
    assert.equal(band.x, 0, "The colored section has no outer strip");
    assert.equal(band.width, 1440);
    assert(await page.locator(".hero-panel-project .card").evaluate(el => getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)"), "Cards keep their own surface");
  } finally { await page.close(); }
});

for (const panelFill of ["solid", "glass"]) test(`Intro preserves canvas choices with ${panelFill} cards`, async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(url);
    for (const backgroundStyle of ["rings", "grid", "glow", "momoi"]) {
      await page.evaluate(settings => window.kisoAppearance.save({ ...window.kisoAppearance.read(), ...settings }), { panelFill, backgroundStyle, backgroundPlacement: "both", appShell: "inset", pageWidth: "full" });
      await page.reload();
      await page.locator(".studio-hero").waitFor();
      const paint = await page.evaluate(() => {
        const shell = document.querySelector(".component-gallery");
        return { canvas: getComputedStyle(shell, "::before").backgroundImage, mask: getComputedStyle(shell, "::before").maskImage, surfaces: [shell.querySelector('main'), shell.querySelector('.studio-landing'), shell.querySelector('.catalog-header')].map(el => getComputedStyle(el).backgroundColor) };
      });
      assert(paint.canvas !== "none" || paint.mask !== "none", `${backgroundStyle}: canvas paints`);
      assert(paint.surfaces.every(color => color === "rgba(0, 0, 0, 0)"), `${backgroundStyle}/${panelFill}: ${JSON.stringify(paint)}`);
    }
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Hero stack keeps the selected examples usable at ${width}px`, async () => {
  const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: "reduce" });
  try {
    await page.goto(`${url}#intro`);
    const project = page.locator('.hero-panel-project');
    await project.waitFor();
    assert.equal(await project.getAttribute('data-front'), 'true');
    await project.getByRole('button', { name: 'Complete task' }).click();
    assert.equal(await project.getByRole('meter').getAttribute('aria-valuenow'), '9');
    const reveal = async name => {
      const button = page.getByRole('button', { name: `Bring ${name} to the front`, exact: true });
      const point = await button.evaluate(el => {
        const r = el.getBoundingClientRect();
        for (let y = Math.max(0, r.top + 4); y < Math.min(innerHeight, r.bottom - 4); y += 4)
          for (let x = Math.max(0, r.left + 4); x < Math.min(innerWidth, r.right - 4); x += 4)
            if (document.elementFromPoint(x, y) === el) return { x, y };
        return null;
      });
      assert(point, `${name} has an exposed click target`);
      await page.mouse.click(point.x, point.y);
    };
    await reveal('Sign in');
    const identity = page.locator('.hero-panel-identity');
    await identity.getByLabel('Work email').fill('reader@example.com');
    await identity.getByRole('button', { name: 'Continue with email' }).click();
    await identity.getByRole('status').filter({ hasText: 'Welcome back' }).waitFor();
    await reveal('Preferences');
    const preferences = page.locator('.hero-panel-preferences');
    const email = preferences.getByRole('switch', { name: 'Email notifications' });
    await email.click();
    assert.equal(await email.getAttribute('aria-checked'), 'false');
    assert.equal(await project.evaluate(el => getComputedStyle(el).animationName), 'none');
  } finally { await page.close(); }
});

for (const width of [390, 1440]) test(`Foundation light boundary responds to keyboard and dragging at ${width}px`, async () => {
  const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: "reduce" });
  try {
    await page.goto(`${url}#intro`);
    const slider = page.getByRole('slider', { name: 'Compare light and dark themes' });
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    await slider.press('End');
    assert.equal(await slider.inputValue(), '100');
    assert.equal(await page.locator('.foundation-world').evaluate(el => el.style.getPropertyValue('--foundation-light')), '100%');
    await slider.press('Home');
    assert.equal(await slider.inputValue(), '0');
    const box = await slider.boundingBox();
    await page.mouse.move(box.x + box.width * .25, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .75, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    assert(Number(await slider.inputValue()) >= 70);
    assert.equal(await page.locator('.foundation-dark .foundation-button').evaluate(el => getComputedStyle(el).animationName), 'none');
  } finally { await page.close(); }
});

test("Shell assembly plays once, then follows its switches", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const pieces = () => page.locator(".shell-assembly-stage").evaluate(el => [el.dataset.header, el.dataset.sidebar, el.dataset.content].join());
  try {
    await page.goto(`${url}#intro`);
    const shell = page.locator(".shell-assembly");
    await shell.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".shell-assembly-stage")?.dataset.content === "true", null, { timeout: 6000 });
    assert.equal(await pieces(), "true,true,true");
    assert.equal(await shell.locator('li[data-state="completed"]').count(), 3);
    await shell.getByRole("switch", { name: "Sidebar" }).click();
    assert.equal(await pieces(), "true,false,true");
    assert.equal(await shell.getByRole("status").innerText(), "Sidebar off.");
    await page.reload();
    await page.locator(".shell-assembly").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    assert.equal(await pieces(), "true,true,true", "the assembly does not replay after the first visit");
    await page.getByRole("button", { name: "Replay" }).click();
    await page.waitForTimeout(200);
    assert.equal(await pieces(), "false,false,false");
  } finally { await context.close(); }
});
