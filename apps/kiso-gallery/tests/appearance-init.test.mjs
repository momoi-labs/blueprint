import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

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

test("restores the complete appearance before React starts", () => {
  const saved = { theme: "dark", accent: "teal", borderStyle: "solid", cornerStyle: "asym", cornerMarks: "arcs", cornerSize: "large", markSize: "small", visualStyle: "editorial", appShell: "inset" };
  const { dataset } = boot({ "kiso-gallery-appearance": JSON.stringify(saved) });
  assert.deepEqual(dataset, saved);
});

test("retains the existing theme and accent storage keys", () => {
  const { dataset } = boot({ "kiso-theme": "light", "kiso-accent": "nocturne" });
  assert.equal(dataset.theme, "light");
  assert.equal(dataset.accent, "nocturne");
  assert.equal(dataset.borderStyle, "solid");
  assert.equal(dataset.visualStyle, "default");
  assert.equal(dataset.appShell, "default");
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
    assert.equal(dataset.cornerSize, "medium");
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
  assert.equal(dataset.visualStyle, "default");
  assert.equal(dataset.appShell, "default");
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
  api.save({ ...api.defaults, borderStyle: "round", cornerMarks: "arcs", cornerSize: "off", markSize: "off" });
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
  for (const [preset, size, expected] of [["soft", "medium", "small"], ["soft", "off", "medium"], ["round", "large", "large"]]) {
    const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify({ [source]: preset, cornerSize: size }) });
    assert.equal(dataset.cornerStyle, "rounded");
    assert.equal(dataset.cornerSize, expected);
    api.save(api.read());
    assert.deepEqual(boot(Object.fromEntries(storage)).dataset, dataset);
  }
});

for (const cornerStyle of ["rounded", "asym"]) test(`restores and saves ${cornerStyle} with an enabled size`, () => {
  const { api, dataset, storage } = boot({ "kiso-gallery-appearance": JSON.stringify({ cornerStyle, cornerSize: "off" }) });
  assert.equal(dataset.cornerSize, "medium");
  const next = api.save({ ...api.read(), cornerStyle, cornerSize: "off" });
  assert.equal(next.cornerSize, "medium");
  assert.equal(JSON.parse(storage.get("kiso-gallery-appearance")).cornerSize, "medium");
  assert.equal(api.save({ ...next, cornerStyle: "square", cornerSize: "off" }).cornerSize, "off");
});
