import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { randomAppearance } from "../src/appearance-settings.ts";

const source = readFileSync(new URL("../public/appearance-init.js", import.meta.url), "utf8");
function boot(values = {}, blocked = false) {
  const storage = new Map(Object.entries(values));
  const dataset = {};
  const window = {};
  runInNewContext(source, {
    window,
    document: { documentElement: { dataset } },
    localStorage: {
      getItem(key) { if (blocked) throw Error("Storage blocked"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error("Storage blocked"); storage.set(key, value); },
    },
  });
  return { api: window.kisoAppearance, dataset, storage };
}

test("new visits use the approved Pixel everywhere settings before React starts", () => {
  const { api, dataset } = boot();
  const expected = {
    theme: "system", accent: "violet", borderStyle: "solid", cornerStyle: "pixel",
    cornerMarks: "ticks", cornerSize: "small", markSize: "medium", visualStyle: "editorial",
    appShell: "inset", frameScope: "all", markScope: "panels", markClearance: "normal",
    backgroundStyle: "fibers", backgroundStrength: "quiet", backgroundPlacement: "both",
    frameDetail: "medium", paperTone: "theme", panelFill: "solid",
    outerBorderStyle: "inherit", outerCornerStyle: "inherit", outerCornerMarks: "inherit",
  };
  assert.deepEqual(JSON.parse(JSON.stringify(api.read())), expected);
  const { theme, ...attributes } = expected;
  assert.deepEqual(dataset, attributes);
});

test("random appearances preserve theme and produce supported frame combinations", () => {
  const { api } = boot();
  let seed = 42;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  const backgrounds = new Set(), borders = new Set(), corners = new Set();
  for (let i = 0; i < 128; i++) {
    const theme = ["system", "light", "dark"][i % 3];
    const next = randomAppearance({ ...api.defaults, theme }, random);
    assert.equal(next.theme, theme);
    assert.deepEqual(JSON.parse(JSON.stringify(api.save(next))), next, "No sampled value needs validation fallback");
    assert.notEqual(next.cornerSize, "off");
    for (const [border, corner, mark] of [
      [next.borderStyle, next.cornerStyle, next.cornerMarks],
      [next.outerBorderStyle === "inherit" ? next.borderStyle : next.outerBorderStyle,
        next.outerCornerStyle === "inherit" ? next.cornerStyle : next.outerCornerStyle,
        next.outerCornerMarks === "inherit" ? next.cornerMarks : next.outerCornerMarks],
    ]) {
      if (corner === "pixel") assert(["solid", "none"].includes(border));
      if (corner === "pixel" || ["manga", "brush"].includes(border)) assert.notEqual(mark, "arcs");
      if (border === "brush") assert.notEqual(mark, "brackets");
      borders.add(border); corners.add(corner);
    }
    backgrounds.add(next.backgroundStyle);
  }
  assert.equal(backgrounds.size, 9);
  assert.equal(borders.size, 9);
  assert.equal(corners.size, 4);
});

test("restores the complete appearance before React starts", () => {
  const saved = { theme: "dark", accent: "teal", borderStyle: "solid", cornerStyle: "asym", cornerMarks: "arcs", cornerSize: "large", markSize: "small", visualStyle: "editorial", appShell: "inset" };
  const { api, dataset } = boot({ "kiso-gallery-appearance": JSON.stringify(saved) });
  assert.deepEqual(dataset, { ...api.defaults, ...saved });
});

test("retains the existing theme and accent storage keys", () => {
  const { dataset } = boot({ "kiso-theme": "light", "kiso-accent": "nocturne" });
  assert.equal(dataset.theme, "light");
  assert.equal(dataset.accent, "nocturne");
  assert.equal(dataset.borderStyle, "solid");
  assert.equal(dataset.visualStyle, "editorial");
  assert.equal(dataset.appShell, "inset");
});

test("migrates the heading preference without overriding a saved visual style", () => {
  for (const value of ["default", "editorial"]) {
    const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify({ pageHeader: value }) });
    assert.equal(dataset.visualStyle, value);
    assert.equal(dataset.pageHeader, undefined);
    api.save(api.read());
    assert.equal(JSON.parse(storage.get("kiso-gallery-appearance")).pageHeader, undefined);
  }
  const { dataset } = boot({ "kiso-gallery-appearance": JSON.stringify({ pageHeader: "editorial", visualStyle: "default" }) });
  assert.equal(dataset.visualStyle, "default");
});

test("ignores malformed storage and unsupported values", () => {
  for (const stored of ["{broken", "null", "42", '"text"', '{"borderStyle":"cut","cornerSize":"huge","theme":"invalid"}']) {
    const { dataset } = boot({ "kiso-gallery-appearance": stored });
    assert.equal(dataset.borderStyle, "solid");
    assert.equal(dataset.cornerSize, "small");
    assert.equal(dataset.theme, undefined);
  }
});

test("persists changes, restores them on reload, and resets system mode", () => {
  const { api, dataset, storage } = boot();
  api.save({ ...api.defaults, theme: "dark", borderStyle: "dash", cornerMarks: "none", visualStyle: "editorial", appShell: "inset" });
  assert.equal(storage.get("kiso-theme"), "dark");
  assert.equal(boot(Object.fromEntries(storage)).dataset.borderStyle, "dash");
  assert.equal(boot(Object.fromEntries(storage)).dataset.visualStyle, "editorial");
  assert.equal(boot(Object.fromEntries(storage)).dataset.appShell, "inset");
  api.save(api.defaults);
  assert.equal(dataset.theme, undefined);
  assert.equal(dataset.cornerMarks, "ticks");
  assert.equal(dataset.visualStyle, "editorial");
  assert.equal(dataset.appShell, "inset");
  assert.equal(boot(Object.fromEntries(storage)).dataset.theme, undefined);
});

test("blocked storage still allows live changes and defaults on reload", () => {
  const { api, dataset } = boot({}, true);
  assert.equal(dataset.borderStyle, "solid");
  assert.doesNotThrow(() => api.save({ ...api.defaults, theme: "light", borderStyle: "round" }));
  assert.equal(dataset.borderStyle, "solid");
  assert.equal(dataset.theme, "light");
  assert.equal(boot({}, true).dataset.borderStyle, "solid");
});

test("legacy Off mark size migrates to None without enabling marks", () => {
  const { api, storage } = boot();
  api.save({ ...api.defaults, borderStyle: "round", cornerStyle: "square", cornerMarks: "arcs", cornerSize: "off", markSize: "off" });
  const { dataset } = boot(Object.fromEntries(storage));
  assert.equal(dataset.cornerSize, "off");
  assert.equal(dataset.markSize, "medium");
  assert.equal(dataset.borderStyle, "solid");
  assert.equal(dataset.cornerMarks, "none");
});

for (const cornerStyle of ["square", "soft", "round", "asym"]) test(`migrates the ${cornerStyle} border preset into an independent corner choice`, () => {
  const { dataset } = boot({ "kiso-gallery-appearance": JSON.stringify({ borderStyle: cornerStyle, cornerSize: "large" }) });
  assert.equal(dataset.borderStyle, "solid");
  assert.equal(dataset.cornerStyle, ["soft", "round"].includes(cornerStyle) ? "rounded" : cornerStyle);
  assert.equal(dataset.cornerSize, cornerStyle === "soft" ? "medium" : "large");
});

test("frameless borders retain the saved corner and mark choices", () => {
  const { api, storage } = boot();
  api.save({ ...api.defaults, borderStyle: "none", cornerStyle: "rounded", cornerMarks: "arcs" });
  const { dataset } = boot(Object.fromEntries(storage));
  assert.equal(dataset.borderStyle, "none");
  assert.equal(dataset.cornerStyle, "rounded");
  assert.equal(dataset.cornerMarks, "arcs");
});

for (const source of ["borderStyle", "cornerStyle"]) test(`normalizes saved rounded presets from ${source}`, () => {
  for (const [preset, size, expected] of [["soft", "medium", "small"], ["soft", "off", "small"], ["round", "large", "large"]]) {
    const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify({ [source]: preset, cornerSize: size }) });
    assert.equal(dataset.cornerStyle, "rounded");
    assert.equal(dataset.cornerSize, expected);
    api.save(api.read());
    assert.deepEqual(boot(Object.fromEntries(storage)).dataset, dataset);
  }
});

for (const cornerStyle of ["rounded", "asym"]) test(`restores and saves ${cornerStyle} with an enabled size`, () => {
  const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify({ cornerStyle, cornerSize: "off" }) });
  assert.equal(dataset.cornerSize, "small");
  const next = api.save({ ...api.read(), cornerStyle, cornerSize: "off" });
  assert.equal(next.cornerSize, "small");
  assert.equal(JSON.parse(storage.get("kiso-gallery-appearance")).cornerSize, "small");
  assert.equal(api.save({ ...next, cornerStyle: "square", cornerSize: "off" }).cornerSize, "off");
});


test("restores backgrounds, independent scopes, outer overrides and legacy values", () => {
  const saved = { theme: "dark", borderStyle: "bevel", cornerStyle: "pixel", cornerMarks: "dots", outerBorderStyle: "brush", outerCornerStyle: "rounded", outerCornerMarks: "diagonal", frameScope: "outer", markScope: "all", markClearance: "sheet", backgroundStyle: "guides", backgroundStrength: "visible", panelFill: "translucent", paperTone: "accent", backgroundPlacement: "inside", frameDetail: "large" };
  const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify(saved) });
  for (const [key, value] of Object.entries(saved)) assert.equal(dataset[key], value, key);
  api.save(api.read());
  const restored = boot(Object.fromEntries(storage));
  assert.deepEqual(restored.dataset, dataset);
  api.save(api.defaults);
  assert.equal(dataset.backgroundStyle, "fibers");
  assert.equal(dataset.outerBorderStyle, "inherit");
  assert.equal(dataset.markScope, "panels");
});

test("Pixel migrates its old detail size once and keeps later corner and ink changes independent", () => {
  for (const corner of ["cornerStyle", "outerCornerStyle"]) {
    const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify({ [corner]: "pixel", cornerSize: "small", frameDetail: "large" }) });
    assert.equal(dataset.cornerSize, "large");
    api.save({ ...api.read(), cornerSize: "small", frameDetail: "medium" });
    const restored = boot(Object.fromEntries(storage));
    assert.equal(restored.dataset.cornerSize, "small");
    assert.equal(restored.dataset.frameDetail, "medium");
    assert.equal(restored.dataset.version, undefined, "Storage migration metadata is not a theme setting");
  }
});

test("restores Tangerine in both themes before React starts", () => {
  for (const theme of ["light", "dark"]) {
    const { api, dataset } = boot({ "kiso-gallery-appearance": JSON.stringify({ theme, accent: "tangerine" }) });
    assert.equal(dataset.accent, "tangerine");
    assert.equal(dataset.theme, theme);
    assert.equal(api.read().accent, "tangerine");
  }
});
