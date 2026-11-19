import assert from "node:assert/strict";
import test from "node:test";
import { brandUrls, urlCase } from "../src/live.mjs";
import { parseCases, UsageError } from "../src/live/lib.mjs";

const text = `# kind layout url [action]
list full pages.html?screen=list
list left pages.html?screen=list [data-switch-layout="left"]
list full ?phone-frame#example/crud/list/full #example/crud/list/left

form left pages.html?screen=edit
`;

test("cases resolve against the base and keep the action", () => {
  assert.deepEqual(parseCases(text, "https://host:1/app/"), [
    { kind: "list", layout: "full", url: "https://host:1/app/pages.html?screen=list", action: null },
    { kind: "list", layout: "left", url: "https://host:1/app/pages.html?screen=list", action: '[data-switch-layout="left"]' },
    { kind: "list", layout: "full", url: "https://host:1/app/?phone-frame#example/crud/list/full", action: "#example/crud/list/left" },
    { kind: "form", layout: "left", url: "https://host:1/app/pages.html?screen=edit", action: null },
  ]);
});

test("a bad case names its line", () => {
  assert.throws(() => parseCases("list full a\ntable full b", "https://host/"), error => error instanceof UsageError && /line 2/.test(error.message));
  assert.throws(() => parseCases("list full pages.html"), /not a full url/);
});

test("a url case takes an optional kind and layout", () => {
  assert.deepEqual(urlCase("form:center=https://host/edit"), { kind: "form", layout: "center", url: "https://host/edit", action: null });
  assert.deepEqual(urlCase("https://host/list"), { kind: null, layout: null, url: "https://host/list", action: null });
});

test("brand takes the first plain list case and the first plain form case", () => {
  const cases = parseCases(text, "https://host/");
  assert.deepEqual(brandUrls({}, cases, []), { url: "https://host/pages.html?screen=list", otherUrl: "https://host/pages.html?screen=edit" });
  const urls = ["https://host/a", "https://host/b"].map(urlCase);
  assert.deepEqual(brandUrls({}, [], urls), { url: "https://host/a", otherUrl: "https://host/b" });
});
