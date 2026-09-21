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
  const saved = { theme: "dark", accent: "teal", borderStyle: "asym", cornerMarks: "arcs", cornerSize: "large", markSize: "small" };
  const { dataset } = boot({ "kiso-gallery-appearance": JSON.stringify(saved) });
  assert.deepEqual(dataset, saved);
});

test("retains the existing theme and accent storage keys", () => {
  const { dataset } = boot({ "kiso-theme": "light", "kiso-accent": "nocturne" });
  assert.equal(dataset.theme, "light");
  assert.equal(dataset.accent, "nocturne");
  assert.equal(dataset.borderStyle, "square");
});

test("ignores malformed storage and unsupported values", () => {
  for (const stored of ["{broken", "null", "42", '"text"', '{"borderStyle":"cut","cornerSize":"huge","theme":"invalid"}']) {
    const { dataset } = boot({ "kiso-gallery-appearance": stored });
    assert.equal(dataset.borderStyle, "square");
    assert.equal(dataset.cornerSize, "medium");
    assert.equal(dataset.theme, undefined);
  }
});

test("persists changes, restores them on reload, and resets system mode", () => {
  const { api, dataset, storage } = boot();
  api.save({ ...api.defaults, theme: "dark", borderStyle: "dash", cornerMarks: "none" });
  assert.equal(storage.get("kiso-theme"), "dark");
  assert.equal(boot(Object.fromEntries(storage)).dataset.borderStyle, "dash");
  api.save(api.defaults);
  assert.equal(dataset.theme, undefined);
  assert.equal(dataset.cornerMarks, "ticks");
  assert.equal(boot(Object.fromEntries(storage)).dataset.theme, undefined);
});

test("blocked storage still allows live changes and defaults on reload", () => {
  const { api, dataset } = boot({}, true);
  assert.equal(dataset.borderStyle, "square");
  assert.doesNotThrow(() => api.save({ ...api.defaults, theme: "light", borderStyle: "round" }));
  assert.equal(dataset.borderStyle, "round");
  assert.equal(dataset.theme, "light");
  assert.equal(boot({}, true).dataset.borderStyle, "square");
});

test("legacy Off mark size migrates to None without enabling marks", () => {
  const { api, storage } = boot();
  api.save({ ...api.defaults, borderStyle: "round", cornerMarks: "arcs", cornerSize: "off", markSize: "off" });
  const { dataset } = boot(Object.fromEntries(storage));
  assert.equal(dataset.cornerSize, "off");
  assert.equal(dataset.markSize, "medium");
  assert.equal(dataset.borderStyle, "round");
  assert.equal(dataset.cornerMarks, "none");
});
