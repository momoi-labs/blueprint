import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { appearanceCode } from "../src/appearance-settings.ts";

const settings = { theme: "system", accent: "teal", borderStyle: "round", cornerMarks: "arcs", cornerSize: "off", markSize: "medium" };

test("HTML includes current settings and omits system theme", () => {
  const { html } = appearanceCode(settings);
  assert.ok(!html.includes("data-theme="));
  assert.ok(html.includes('data-corner-size="off"'));
  assert.ok(html.includes('data-mark-size="medium"'));
  assert.ok(html.includes('data-border-style="round"'));
  assert.ok(appearanceCode({ ...settings, theme: "dark" }).html.includes('data-theme="dark"'));
});

test("JavaScript applies the current configuration and clears a forced theme", () => {
  for (const theme of ["system", "light", "dark"]) {
    const dataset = { theme: "dark" };
    runInNewContext(appearanceCode({ ...settings, theme }).javascript, { document: { documentElement: { dataset } } });
    assert.equal(dataset.theme, theme === "system" ? undefined : theme);
    assert.equal(dataset.accent, "teal");
    assert.equal(dataset.borderStyle, "round");
    assert.equal(dataset.cornerMarks, "arcs");
    assert.equal(dataset.cornerSize, "off");
    assert.equal(dataset.markSize, "medium");
  }
});
