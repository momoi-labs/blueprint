import { brand } from "./live/brand.mjs";
import { jump } from "./live/jump.mjs";
import { layouts } from "./live/layouts.mjs";
import { KINDS, LAYOUTS, UsageError, list, loadChromium, readCases } from "./live/lib.mjs";
import { margins } from "./live/margins.mjs";

export const MEASUREMENTS = ["jump", "layouts", "margins", "brand"];

export function urlCase(arg) {
  const match = arg.match(/^([a-z]+):([a-z]+)=(.+)$/);
  if (match && KINDS.includes(match[1]) && LAYOUTS.includes(match[2])) return { kind: match[1], layout: match[2], url: new URL(match[3]).toString(), action: null };
  try {
    return { kind: null, layout: null, url: new URL(arg).toString(), action: null };
  } catch {
    throw new UsageError(`--url ${arg}: use a full url, or <list|form|detail>:<left|center|right|full>=<url>`);
  }
}

export function brandUrls(options, fromCases, fromUrls) {
  const plain = fromCases.filter(item => !item.action);
  const url = options.brand || plain.find(item => item.kind === "list")?.url || fromUrls[0]?.url || null;
  const otherUrl = options["brand-other"] || plain.find(item => item.kind === "form")?.url || fromUrls.find(item => item.url !== url)?.url || null;
  return { url, otherUrl };
}

export async function runLive(options, log) {
  const fromCases = options.cases ? readCases(options.cases, options.base || undefined) : [];
  const fromUrls = (options.url ?? []).map(urlCase);
  const cases = [...fromCases, ...fromUrls];
  const only = options.only ? list(options.only) : MEASUREMENTS;
  for (const name of only) if (!MEASUREMENTS.includes(name)) throw new UsageError(`--only ${name}: use ${MEASUREMENTS.join(", ")}`);
  if (!cases.length && only.some(name => name !== "brand")) throw new UsageError("live mode needs --url or --cases");
  const widths = options.widths ? list(options.widths).map(Number) : undefined;
  const themes = options.themes ? list(options.themes) : undefined;
  const brandTarget = brandUrls(options, fromCases, fromUrls);
  if (only.includes("brand") && !brandTarget.url) throw new UsageError("brand needs a list url: add a list case, a --url or --brand");

  const chromium = loadChromium();
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    throw new UsageError(`chromium did not start: ${error.message.split("\n")[0]}. Run npx playwright install chromium`);
  }
  const results = [];
  try {
    for (const name of only) {
      log(`== ${name}`);
      let result;
      if (name === "jump") result = await jump(browser, cases, { widths, theme: options.theme }, log);
      if (name === "layouts") result = await layouts(browser, cases, { widths, themes, table: options.table }, log);
      if (name === "margins") result = await margins(browser, cases, { widths, theme: options.theme, phone: options.phone, verbose: options.verbose }, log);
      if (name === "brand") {
        log(`brand: ${brandTarget.url}${brandTarget.otherUrl ? ` and ${brandTarget.otherUrl}` : ""}`);
        result = await brand(browser, { ...brandTarget, shots: options.shots }, log);
      }
      log(`${name}: ${result.summary}`);
      log("");
      results.push(result);
    }
  } finally {
    await browser.close();
  }
  return { mode: "live", ok: results.every(result => result.ok), measurements: results };
}
