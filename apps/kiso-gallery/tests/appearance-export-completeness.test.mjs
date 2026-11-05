import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { appearanceCode } from "../src/appearance-settings.ts";
import { settingsText, shareCode, shareLink, shareText, readShare } from "../src/appearance-share.ts";

const window = { matchMedia: () => ({ matches: false, addEventListener() {} }) };
runInNewContext(readFileSync(new URL("../public/appearance-init.js", import.meta.url), "utf8"), {
  window, document: { documentElement: { dataset: {} } },
  localStorage: { getItem: () => null, setItem() {} },
});
const source = window.kisoAppearance;
const plain = value => JSON.parse(JSON.stringify(value));

test("every registered appearance value survives every export, including defaults", () => {
  assert.deepEqual(Object.keys(source.defaults).sort(), Object.keys(source.options).sort());
  for (const [key, values] of Object.entries(source.options)) {
    for (const value of values) {
      const settings = plain({ ...source.defaults, [key]: value });
      // A complete export must not depend on the receiving gallery's defaults.
      const receiver = { ...source, defaults: Object.fromEntries(Object.entries(source.options)
        .map(([name, accepted]) => [name, accepted.find(candidate => candidate !== settings[name]) ?? accepted[0]])) };
      for (const text of [settingsText(settings), shareText(settings, source)]) {
        assert.deepEqual(JSON.parse(text).s, settings, `${key}=${value}: complete JSON`);
      }
      for (const input of [settingsText(settings), shareText(settings, source), shareCode(settings, source),
        shareLink(settings, source, {}, "https://example.test/#components")]) {
        const result = readShare(input, receiver);
        assert.deepEqual(plain(result.settings), settings, `${key}=${value}: round trip`);
        assert.deepEqual(result.skipped, []);
      }
      const { html, javascript } = appearanceCode(settings);
      for (const [name, expected] of Object.entries(settings)) {
        if (name.startsWith("phone") || (name === "theme" && expected === "system")) continue;
        const attribute = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        assert.ok(html.includes(`data-${attribute}="${expected}"`), `${key}=${value}: HTML ${name}`);
      }
      for (const phone of [false, true]) {
        const dataset = {};
        runInNewContext(javascript, {
          document: { documentElement: { dataset } },
          matchMedia: () => ({ matches: phone, addEventListener() {} }),
        });
        for (const [name, expected] of Object.entries(settings)) {
          if (name.startsWith("phone")) continue;
          const override = settings[`phone${name[0].toUpperCase()}${name.slice(1)}`];
          const effective = phone && override && override !== "inherit" ? override : expected;
          assert.equal(dataset[name], name === "theme" && effective === "system" ? undefined : effective,
            `${key}=${value}: JavaScript ${name}, phone=${phone}`);
        }
      }
    }
  }
});
