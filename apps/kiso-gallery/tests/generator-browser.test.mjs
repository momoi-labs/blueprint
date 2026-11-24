import assert from "node:assert/strict";
import { before, after } from "node:test";
import { test } from "./shard.mjs";
import { openGenerator, tab } from "./settings-tabs.mjs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const widths = [1440, 1000, 390];
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
async function open(width, look = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: "dark" });
  page.setDefaultTimeout(10_000);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.goto(`${url}#intro`);
  await page.evaluate(look => { const appearance = window.kisoAppearance; appearance.save({ ...appearance.defaults, ...look }); }, look);
  await page.reload();
  return page;
}
function addProbe() {
  const text = node => (node?.textContent ?? "").replace(/\s+/g, " ").trim();
  const checked = option => option.matches("input") ? option.checked : option.getAttribute("aria-checked") === "true";
  const options = () => [...document.querySelectorAll(".gen-workspace [role=radio], .gen-workspace input[type=radio]")].filter(option => (option.closest("label") ?? option).getClientRects().length);
  const groups = () => [...document.querySelectorAll(".gen-workspace [role=radiogroup], .gen-workspace fieldset")];
  const name = group => group.getAttribute("aria-label") || text(document.getElementById(group.getAttribute("aria-labelledby")?.split(" ")[0])) || text(group.querySelector("legend")) || groups().indexOf(group);
  const key = option => `${name(option.closest("[role=radiogroup], fieldset"))}: ${option.getAttribute("aria-label") ?? option.value ?? text(option)}`;
  window.generatorProbe = {
    list: () => options().map(option => ({ key: key(option), off: option.disabled || option.closest("fieldset")?.disabled === true, checked: checked(option) })),
    aim: async name => {
      const option = options().find(option => key(option) === name);
      if (!option) return null;
      const target = option.closest("label") ?? option;
      target.scrollIntoView({ block: "center", behavior: "instant" });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const box = target.getBoundingClientRect();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      const hit = document.elementFromPoint(x, y);
      return { x, y, hit: !!hit && target.contains(hit), over: hit ? `${hit.tagName.toLowerCase()}.${hit.className}` : "nothing" };
    },
    checked: name => { const option = options().find(option => key(option) === name); return !!option && checked(option); },
  };
}
function header() {
  const box = node => node.getBoundingClientRect();
  const page = document.querySelector(".page");
  const first = page.children[0], next = page.children[1];
  const parts = [...first.querySelectorAll('[data-slot="page-header-title"], [data-slot="page-header-description"], [data-slot="page-header-actions"]')];
  return { parts: parts.length, space: box(next).top - Math.max(...parts.map(part => box(part).bottom)), gap: parseFloat(getComputedStyle(page).rowGap) };
}

const looks = [{}, { appShell: "default" }, { borderStyle: "manga", cornerMarks: "ticks", outerBorderStyle: "inherit", outerCornerMarks: "inherit" }];
for (const width of widths) test(`every generator option takes a click at ${width}px`, async () => {
  const page = await open(width);
  try {
    let clicked = 0;
    for (const look of looks) for (const name of ["Look", "Layout", "Frame", "Canvas", "Phone", "Gallery"]) {
      const reset = async () => {
        await page.evaluate(look => { const appearance = window.kisoAppearance; appearance.save({ ...appearance.defaults, ...look }); }, look);
        await page.reload();
        const panel = await openGenerator(page);
        await page.evaluate(addProbe);
        await tab(panel, name);
        if (name === "Phone") await panel.getByRole("radiogroup", { name: "Same as desktop", exact: true }).getByRole("radio", { name: "Override", exact: true }).click();
        return page.evaluate(() => window.generatorProbe.list());
      };
      const first = await reset();
      const keys = list => list.map(option => option.key).join("|");
      assert.equal(new Set(first.map(option => option.key)).size, first.length, `${name} option names are unique`);
      for (const option of first.filter(option => !option.off && !option.checked)) {
        const now = await page.evaluate(() => window.generatorProbe.list());
        if (keys(now) !== keys(first) || now.find(next => next.key === option.key).off) await reset();
        if (await page.evaluate(key => window.generatorProbe.checked(key), option.key)) continue;
        const aim = await page.evaluate(key => window.generatorProbe.aim(key), option.key);
        assert.ok(aim.hit, `${name} / ${option.key} is covered by ${aim.over}`);
        await page.mouse.click(aim.x, aim.y);
        await page.waitForFunction(key => window.generatorProbe.checked(key), option.key, { timeout: 2000 }).catch(() => assert.fail(`${name} / ${option.key} did not take the click`));
        clicked++;
      }
    }
    assert.ok(clicked > 100, `clicked ${clicked} options`);
  } finally { await page.close(); }
});

for (const width of widths) test(`Shell right and Brand bar reach the preview and the code at ${width}px`, async () => {
  const page = await open(width, { appShell: "inset" });
  try {
    const panel = await openGenerator(page);
    await page.evaluate(addProbe);
    await panel.getByRole("radiogroup", { name: "Preview page", exact: true }).getByRole("radio", { name: "Overview", exact: true }).click();
    await panel.getByRole("radiogroup", { name: "Preview device", exact: true }).getByRole("radio", { name: "Desktop", exact: true }).click();
    const frame = () => page.frames().find(frame => frame.url().includes("phone-frame"));
    await page.frameLocator(".gen-frame iframe").locator(".layout-stats").waitFor();
    const main = () => frame().evaluate(() => { const box = document.querySelector(".app-shell > main, .app-shell > [data-slot='app-shell-main']").getBoundingClientRect(); return { left: box.left, right: innerWidth - box.right }; });
    const start = await main();
    for (const [group, option, attribute, value] of [["Shell right", "Fill", "shellRight", "fill"], ["Brand bar", "Full row", "brandBar", "full"]]) {
      await tab(panel, "Layout");
      const radio = panel.getByRole("radiogroup", { name: group, exact: true }).getByRole("radio", { name: option, exact: true });
      await radio.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
      const box = await radio.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForFunction(([attribute, value]) => document.documentElement.dataset[attribute] === value, [attribute, value]);
      assert.equal(await radio.getAttribute("aria-checked"), "true");
      assert.equal(await page.evaluate(attribute => JSON.parse(localStorage.getItem("kiso-gallery-appearance"))[attribute], attribute), value);
      await frame().waitForFunction(([attribute, value]) => document.documentElement.dataset[attribute] === value, [attribute, value]);
    }
    await page.waitForTimeout(500);
    const end = await main();
    assert.ok(start.right > 0 && end.right === 0, `Shell right fill moves the main panel to the right edge: ${start.right} to ${end.right}`);
    assert.ok(end.left < start.left, `Brand bar full row joins the bar to the main panel: ${start.left} to ${end.left}`);
    await tab(panel, "Code");
    const code = await panel.locator(".gen-export").innerText();
    assert.match(code, /data-shell-right="fill"/);
    assert.match(code, /data-brand-bar="full"/);
  } finally { await page.close(); }
});

test("the Overview page header keeps the page gap in every preset", async () => {
  const page = await open(1440);
  const looks = [];
  try {
    const panel = await openGenerator(page);
    await tab(panel, "Presets");
    const presets = panel.locator(".appearance-composition[aria-pressed]");
    for (let index = 0; index < await presets.count(); index++) {
      await presets.nth(index).click();
      await page.waitForFunction(index => document.querySelectorAll(".appearance-composition[aria-pressed]")[index].getAttribute("aria-pressed") === "true", index);
      const label = (await presets.nth(index).innerText()).trim();
      const look = await page.evaluate(() => window.kisoAppearance.read());
      looks.push({ label, look }, { label: `${label}, editorial`, look: { ...look, visualStyle: "editorial" } });
    }
  } finally { await page.close(); }
  assert.ok(looks.length >= 2, "the generator lists presets");
  for (const width of widths) {
    const frame = await browser.newPage({ viewport: { width, height: 800 }, colorScheme: "dark" });
    frame.setDefaultTimeout(10_000);
    await frame.route("https://fonts.googleapis.com/**", route => route.abort());
    try {
      await frame.goto(`${url}?phone-frame#example/dashboard`);
      for (const { label, look } of looks) {
        await frame.evaluate(look => window.kisoAppearance.save(look), look);
        await frame.reload();
        await frame.locator(".page > .layout-stats").waitFor();
        await frame.evaluate(() => document.fonts.ready);
        const seen = await frame.evaluate(header);
        assert.equal(seen.parts, 3, `${label} at ${width}px shows the title, the description and the actions`);
        assert.ok(seen.space >= seen.gap - 0.5, `${label} at ${width}px: the header ends ${seen.space}px above the stats, the page gap is ${seen.gap}px`);
      }
    } finally { await frame.close(); }
  }
});
