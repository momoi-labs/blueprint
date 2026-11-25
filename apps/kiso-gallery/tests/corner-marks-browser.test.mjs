import assert from "node:assert/strict";
import { before, after } from "node:test";
import { test } from "./shard.mjs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const fullSweep = process.env.KISO_FULL_SWEEP === "1";
const browsers = new Map();
let server, url;
before(async () => {
  server = await preview({ root: fileURLToPath(new URL("../", import.meta.url)), configFile: false, logLevel: "error", preview: { host: "127.0.0.1", port: 0 } });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
});
after(async () => {
  for (const browser of browsers.values()) await browser.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

async function open(scale, look) {
  if (!browsers.has(scale)) browsers.set(scale, await chromium.launch({ args: [`--force-device-scale-factor=${scale}`] }));
  const context = await browsers.get(scale).newContext({ viewport: null, colorScheme: "dark" });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const session = await context.newCDPSession(page);
  const { windowId } = await session.send("Browser.getWindowForTarget");
  await session.send("Browser.setWindowBounds", { windowId, bounds: { width: 1440, height: 1300 } });
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.goto(`${url}?frame#example/dashboard`);
  await page.evaluate(look => {
    const appearance = window.kisoAppearance;
    appearance.save({ ...appearance.presetDefaults, theme: "dark", backgroundStyle: "solid", shadowStyle: "none", appShell: "inset", outerCornerMarks: "none", markScope: "panels", ...look });
  }, look);
  await page.reload();
  await page.locator(".layout-stats").first().waitFor();
  await page.addStyleTag({ content: "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }" });
  return { page, lab: await context.newPage(), close: () => context.close() };
}

async function measure({ page, lab }, look, scale) {
  await page.evaluate(look => window.kisoAppearance.save({ ...window.kisoAppearance.read(), ...look }), look);
  await page.waitForFunction(look => document.documentElement.dataset.cornerMarks === look.cornerMarks && document.documentElement.dataset.markSize === look.markSize, look);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const shot = async () => (await page.screenshot({ type: "png" })).toString("base64");
  const on = await shot();
  const hide = await page.addStyleTag({ content: "*, *::after { --color-corner-mark: transparent !important; }" });
  const off = await shot();
  await hide.evaluate(node => node.remove());
  return lab.evaluate(async ({ on, off, scale, straight }) => {
    const load = async data => {
      const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      context.drawImage(bitmap, 0, 0);
      return context.getImageData(0, 0, bitmap.width, bitmap.height);
    };
    const a = await load(on), b = await load(off), w = a.width, h = a.height;
    const ink = new Uint8Array(w * h);
    let strong = 0;
    for (let i = 0; i < w * h; i++) {
      ink[i] = Math.max(Math.abs(a.data[i * 4] - b.data[i * 4]), Math.abs(a.data[i * 4 + 1] - b.data[i * 4 + 1]), Math.abs(a.data[i * 4 + 2] - b.data[i * 4 + 2]));
      strong = Math.max(strong, ink[i]);
    }
    const on_ = i => ink[i] * 2 >= strong && strong > 0;
    const range = values => values.length ? Math.max(...values) - Math.min(...values) : 0;
    const tally = values => Object.entries(values.reduce((counts, value) => ({ ...counts, [value.toFixed(2)]: (counts[value.toFixed(2)] ?? 0) + 1 }), {})).map(([value, count]) => `${count} of ${value}`).join(", ");
    if (!straight) {
      const seen = new Uint8Array(w * h), shapes = [];
      for (let start = 0; start < w * h; start++) {
        if (!on_(start) || seen[start]) continue;
        const queue = [start];
        let x0 = w, x1 = 0, y0 = h, y1 = 0, area = 0, tone = 0;
        seen[start] = 1;
        while (queue.length) {
          const i = queue.pop(), x = i % w, y = (i - x) / w;
          area++;
          tone = Math.max(tone, ink[i]);
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          for (let ny = Math.max(0, y - 1); ny <= Math.min(h - 1, y + 1); ny++) for (let nx = Math.max(0, x - 1); nx <= Math.min(w - 1, x + 1); nx++) {
            const n = ny * w + nx;
            if (on_(n) && !seen[n]) { seen[n] = 1; queue.push(n); }
          }
        }
        if (x0 === 0 || y0 === 0 || x1 === w - 1 || y1 === h - 1) continue;
        const reach = Math.max(x1 - x0, y1 - y0) + 1;
        shapes.push({ arm: reach / scale, stroke: area / reach / scale, tone });
      }
      return { marks: shapes.length, stroke: range(shapes.map(shape => shape.stroke)), arm: range(shapes.map(shape => shape.arm)), tone: range(shapes.map(shape => shape.tone)), arms: tally(shapes.map(shape => shape.arm)) };
    }
    const across = new Uint16Array(w * h), down = new Uint16Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0, from = 0; x <= w; x++) if (x === w || !on_(y * w + x)) { for (let k = from; k < x; k++) across[y * w + k] = from === 0 || x === w ? 0 : x - from; from = x + 1; }
    for (let x = 0; x < w; x++) for (let y = 0, from = 0; y <= h; y++) if (y === h || !on_(y * w + x)) { for (let k = from; k < y; k++) down[k * w + x] = from === 0 || y === h ? 0 : y - from; from = y + 1; }
    const vertex = 1.5 * scale, strokes = [], arms = [], tones = [];
    const arm = (own, other, step, lines, length) => {
      for (let line = 0; line < lines; line++) for (let k = 0, from = -1, tone = 0; k <= length; k++) {
        const i = step === 1 ? line * w + k : k * w + line;
        const part = k < length && own[i] > other[i] && other[i] > 0 && other[i] <= vertex;
        if (part) { if (from < 0) from = k; tone = Math.max(tone, ink[i]); strokes.push(other[i] / scale); }
        else if (from >= 0) { arms.push((k - from) / scale); tones.push(tone); from = -1; tone = 0; }
      }
    };
    arm(across, down, 1, h, w);
    arm(down, across, w, w, h);
    return { marks: arms.length, stroke: range(strokes), arm: range(arms), tone: range(tones), arms: tally(arms) };
  }, { on, off, scale, straight: look.cornerMarks === "ticks" || look.cornerMarks === "brackets" });
}

const every = { cornerMarks: ["ticks", "brackets", "arcs", "diagonal", "dots"], markClearance: ["sheet", "normal"], markSize: ["small", "medium", "large"], cornerStyle: ["square", "rounded", "asym", "pixel"], frameScope: ["panels", "outer"] };
const sample = { ...every, markClearance: ["sheet"], markSize: ["medium"], cornerStyle: ["square"], frameScope: ["panels"] };
const combos = axes => Object.entries(axes).reduce((rows, [key, values]) => rows.flatMap(row => values.map(value => ({ ...row, [key]: value }))), [{}]);
const apart = {
  "Curved brackets do not pair with Pixel": look => look.cornerMarks === "arcs" && look.cornerStyle === "pixel",
  "Asymmetric corners give curved brackets two radii": look => look.cornerMarks === "arcs" && look.cornerStyle === "asym",
  "Large marks of frameless neighbours touch across the gutter": look => look.markSize === "large" && look.frameScope === "outer" && (look.cornerMarks === "diagonal" || look.cornerMarks === "ticks" && look.markClearance === "normal"),
  "Legacy corner dots overlap at shared corners and blur on asymmetric corners": look => look.cornerMarks === "dots" && (look.markClearance === "sheet" || look.cornerStyle === "asym"),
};
const pairs = look => !Object.values(apart).some(applies => applies(look));
const name = look => Object.values(look).join(" ");
const report = rows => console.log(["marks clearance size corner frames | scale | measured | stroke | arm | tone | arm lengths", ...rows.map(row => `${name(row.look)} | ${row.scale} | ${row.marks} | ${row.stroke.toFixed(2)} | ${row.arm.toFixed(2)} | ${row.tone} | ${row.arms}`)].join("\n"));

for (const scale of [1, 2]) test(`Corner marks of one setting match on every side at ${scale}x`, async () => {
  const looks = combos(fullSweep ? every : sample).filter(pairs);
  const view = await open(scale, looks[0]);
  const rows = [];
  try {
    for (const look of looks) rows.push({ look, scale, ...await measure(view, look, scale) });
  } finally { await view.close(); }
  report(rows);
  assert.deepEqual(rows.filter(row => row.marks < 8).map(row => name(row.look)), [], "Every setting draws marks to measure");
  assert.deepEqual(rows.filter(row => row.stroke > 0.5 || row.arm > 0.5 || row.tone > 8).map(row => name(row.look)), [], "Stroke width and arm length stay within 0.5px, colour within 8 levels");
});

test("Sheet ticks and brackets keep one stroke at a fractional display scale", async () => {
  const scale = 1.6;
  const looks = combos({ ...sample, cornerMarks: ["ticks", "brackets"], markSize: fullSweep ? every.markSize : sample.markSize });
  const view = await open(scale, looks[0]);
  const rows = [];
  try {
    for (const look of looks) rows.push({ look, scale, ...await measure(view, look, scale) });
  } finally { await view.close(); }
  report(rows);
  assert.deepEqual(rows.filter(row => row.marks < 8).map(row => name(row.look)), [], "Every setting draws marks to measure");
  assert.deepEqual(rows.filter(row => row.stroke > 0.5 || row.tone > 8).map(row => name(row.look)), [], "Stroke width stays within 0.5px, colour within 8 levels");
  assert.deepEqual(rows.filter(row => row.arm > 1 / scale + 0.01).map(row => name(row.look)), [], "Arm length stays within one device pixel");
});
