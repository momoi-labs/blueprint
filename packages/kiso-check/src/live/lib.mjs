import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export class UsageError extends Error {}

export function loadChromium() {
  const roots = [process.env.KISO_PLAYWRIGHT_FROM, process.cwd(), path.dirname(fileURLToPath(import.meta.url))].filter(Boolean);
  for (const root of roots) {
    try {
      return createRequire(path.join(root, "package.json"))("playwright").chromium;
    } catch {}
  }
  throw new UsageError("playwright not found. Live mode needs it: run from a project that has playwright installed, or set KISO_PLAYWRIGHT_FROM to a folder whose node_modules has it.");
}

export const list = value => String(value).split(",").map(item => item.trim()).filter(Boolean);

export const KINDS = ["list", "form", "detail"];
export const LAYOUTS = ["left", "center", "right", "full"];

export function parseCases(text, base) {
  const cases = [];
  text.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const [kind, layout, url, ...action] = line.split(/\s+/);
    if (!KINDS.includes(kind) || !LAYOUTS.includes(layout) || !url) {
      throw new UsageError(`cases line ${index + 1}: use <list|form|detail> <left|center|right|full> <url> [action]`);
    }
    let resolved;
    try {
      resolved = base ? new URL(url, base).toString() : new URL(url).toString();
    } catch {
      throw new UsageError(`cases line ${index + 1}: ${url} is not a full url. Pass --base`);
    }
    cases.push({ kind, layout, url: resolved, action: action.join(" ") || null });
  });
  return cases;
}

export const readCases = (file, base) => parseCases(readFileSync(file, "utf8"), base);

export async function openPage(browser, url, { width, theme, height = 800 }) {
  const context = await browser.newContext({ viewport: { width, height }, ignoreHTTPSErrors: true, colorScheme: theme === "dark" ? "dark" : "light" });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector(".page", { state: "attached" });
  } catch {
    await context.close();
    throw new Error(`no .page after 30s at ${url}. Live mode measures screens inside the Kiso shell.`);
  }
  if (theme) await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
  await page.waitForTimeout(300);
  return page;
}

export async function applyAction(page, action) {
  if (!action) return;
  if (action.startsWith("#")) {
    await page.evaluate(hash => { location.hash = hash; }, action);
    await page.waitForFunction(hash => location.hash === hash, action);
    await page.waitForSelector(".page", { state: "attached" });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  } else {
    await page.click(action);
  }
  await page.waitForTimeout(250);
}

export const round = value => (typeof value === "number" ? +value.toFixed(2) : value);
