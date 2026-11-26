import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { appearanceOptions, presetDefaults } from "../src/appearance-settings.ts";
import { projectShareText, readShare } from "../src/appearance-share.ts";
import {
  applyPresetToProjectConfig, checkTuiDivergence, exportedPatch, exportProjectHtml, exportRustSnippet, fieldClass,
  importProjectHtml, parseProjectConfig, projectPreviewDefaults, settingsFromProject,
} from "../src/project-config.ts";

const window = { matchMedia: () => ({ matches: false, addEventListener() {} }) };
runInNewContext(readFileSync(new URL("../public/appearance-init.js", import.meta.url), "utf8"), {
  window, document: { documentElement: { dataset: {} } },
  localStorage: { getItem: () => null, setItem() {} },
});
const source = window.kisoAppearance;
const plain = value => JSON.parse(JSON.stringify(value));
const html = (values, extra = "") => `<html lang="en"${extra}\n${values.trim().split(/\s+/).filter(Boolean).map(pair => `  data-${pair.replace("=", '="')}"`).join("\n")}\n>`;
const attributeSet = markup => new Set(markup.match(/[\w-]+="[^"]*"/g));

const projects = {
  pgconfig: "accent=cobalt border-style=solid corner-style=square corner-marks=none corner-size=off mark-size=large visual-style=default app-shell=default",
  "pg-probe": "accent=gold chart-line=straight chart-fill=dots chart-layout=standard chart-legend=table border-style=solid corner-style=rounded corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=panels mark-scope=panels mark-clearance=normal background-style=dots background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=solid",
  "pg-yard": "accent=nocturne chart-line=stepped chart-fill=dots chart-layout=standard chart-legend=table border-style=solid corner-style=square corner-marks=brackets corner-size=medium mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=all mark-scope=panels mark-clearance=sheet background-style=guides background-strength=visible background-placement=both frame-detail=large paper-tone=theme panel-fill=solid outer-border-style=double outer-corner-style=rounded outer-corner-marks=brackets",
  "quiet-inbox": "accent=teal border-style=solid corner-style=rounded corner-marks=arcs corner-size=medium mark-size=small visual-style=default app-shell=inset frame-scope=all mark-scope=panels mark-clearance=normal background-style=momoi background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=ticks",
  "self-host": "theme=light accent=tangerine neutral=warm primary=accent typeface=inter chart-line=straight chart-fill=none chart-layout=standard chart-legend=table shadow-style=none border-style=solid corner-style=pixel corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=inset header-variant=default header-size=default header-width=page app-shell-outer=auto brand-bar=full page-width=full page-align=start frame-scope=all mark-scope=panels mark-clearance=normal background-style=construction background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=solid landing-bands=inside outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=inherit outer-shadow-style=hard",
  simulators: "accent=cobalt chart-line=straight chart-fill=none chart-layout=standard chart-legend=table border-style=solid corner-style=rounded corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=panels mark-scope=panels mark-clearance=normal background-style=momoi-repeat background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent",
};
projects["pg-probe-private"] = projects["pg-probe"];
projects["pg-probe-report-title"] = projects["pg-probe"];
const documents = Object.fromEntries(Object.entries(projects).map(([name, values]) => [name, html(values)]));
documents["startup-kf-diagnostic"] = "<html>";
documents["template-web-app"] = '<html lang="en">';
documents["pg-probe-demo"] = html(projects["pg-probe"] + " theme=dark");

test("every key of AppearanceSettings is classified exactly once", () => {
  assert.deepEqual(Object.keys(fieldClass).sort(), Object.keys(appearanceOptions).sort());
  assert.deepEqual(Object.keys(source.options).sort(), Object.keys(fieldClass).sort());
  for (const value of Object.values(fieldClass)) assert.ok(["appearance", "structure", "galleryOnly"].includes(value));
  const galleryOnly = Object.entries(fieldClass).filter(([, value]) => value === "galleryOnly").map(([key]) => key);
  assert.deepEqual(galleryOnly.sort(), ["headerWidth", "landingBands", "theme"]);
});

test("new fields are classified by paint versus placement", () => {
  for (const key of ["technicalText", "controlStyle", "progressStyle", "panelLabels", "chartPalette", "shadowScope", "diagramBackgroundStyle", "diagramBackgroundStrength"]) {
    assert.equal(fieldClass[key], "appearance", key);
  }
  for (const key of ["shellBottom", "shellBottomStyle", "shellRight", "appShellOuter", "chartLayout", "chartLegend"]) {
    assert.equal(fieldClass[key], "structure", key);
  }
});

test("importing a project and exporting it without edits returns the same attributes", () => {
  for (const [name, markup] of Object.entries(documents)) {
    const result = importProjectHtml(markup, source);
    assert.ok(result.config, name);
    assert.deepEqual(result.skipped, [], name);
    const exported = exportProjectHtml(result.config);
    assert.deepEqual(attributeSet(exported), attributeSet(markup), name);
    assert.deepEqual(plain(importProjectHtml(exported, source).config), plain(result.config), name);
  }
});

test("a project keeps unset fields unset", () => {
  const { config } = importProjectHtml(documents.pgconfig, source);
  assert.deepEqual(plain(config.appearance), { accent: "cobalt", borderStyle: "solid", cornerStyle: "square", cornerMarks: "none", cornerSize: "off", markSize: "large", visualStyle: "default" });
  assert.deepEqual(plain(config.structure), { appShell: "default" });
  assert.deepEqual(config.rest, [{ name: "lang", value: "en" }]);
  const empty = importProjectHtml("<html>", source).config;
  assert.deepEqual(plain(empty), { appearance: {}, structure: {}, rest: [] });
  assert.equal(exportProjectHtml(empty), "<html>");
});

test("a full index.html imports from its html tag", () => {
  const page = `<!doctype html>\n${documents.pgconfig}\n<head><title>x</title></head><body data-accent="red"></body>`;
  const { config } = importProjectHtml(page, source);
  assert.equal(config.appearance.accent, "cobalt");
  assert.equal(importProjectHtml("<div></div>", source).config, null);
});

test("outer attributes set to inherit survive", () => {
  const { config } = importProjectHtml(documents["quiet-inbox"], source);
  assert.equal(config.appearance.outerBorderStyle, "inherit");
  assert.equal(config.appearance.outerCornerMarks, "ticks");
  const exported = exportProjectHtml(config);
  assert.ok(exported.includes('data-outer-border-style="inherit"'));
  assert.ok(exported.includes('data-outer-corner-marks="ticks"'));
});

test("gallery-only and unknown attributes pass through verbatim in order", () => {
  const markup = '<html lang="pt-BR" class="dark" data-theme="light" data-header-width="outset" data-landing-bands="full" data-accent="gold" data-custom="x y" hidden data-corner-size="large">';
  const { config, skipped } = importProjectHtml(markup, source);
  assert.deepEqual(skipped, []);
  assert.deepEqual(config.rest.map(attribute => attribute.name), ["lang", "class", "data-theme", "data-header-width", "data-landing-bands", "data-custom", "hidden"]);
  assert.deepEqual(config.rest.find(attribute => attribute.name === "data-custom"), { name: "data-custom", value: "x y" });
  assert.deepEqual(config.rest.find(attribute => attribute.name === "hidden"), { name: "hidden", value: null });
  assert.deepEqual(plain(config.appearance), { accent: "gold", cornerSize: "large" });
  const exported = exportProjectHtml(config);
  for (const part of ['lang="pt-BR"', 'class="dark"', 'data-theme="light"', 'data-header-width="outset"', 'data-landing-bands="full"', 'data-custom="x y"', "hidden", 'data-accent="gold"', 'data-corner-size="large"']) {
    assert.ok(exported.includes(part), part);
  }
  assert.deepEqual(plain(importProjectHtml(exported, source).config), plain(config));
});

test("single-quoted values and mixed case names import", () => {
  const { config } = importProjectHtml("<HTML LANG='en' data-accent='teal' DATA-PAGE-WIDTH=full>", source);
  assert.equal(config.appearance.accent, "teal");
  assert.equal(config.structure.pageWidth, "full");
});

test("invalid and unrecognized values are skipped and kept as rest", () => {
  const { config, skipped } = importProjectHtml('<html data-accent="chartreuse" data-page-width="wide" data-corner-size="large" data-accent="gold">', source);
  assert.deepEqual(skipped, ["data-accent (invalid value)", "data-page-width (invalid value)"]);
  assert.deepEqual(plain(config.appearance), { cornerSize: "large", accent: "gold" });
  assert.deepEqual(config.structure, {});
  assert.deepEqual(config.rest.map(attribute => attribute.value), ["chartreuse", "wide"]);
});

const phoneDocument = html("accent=gold background-style=grid border-style=solid") + `
<head>
  <script>
    const phone = {"backgroundStyle":"dots","panelFill":"solid"};
    const desktop = {"backgroundStyle":"grid"};
    const phoneQuery = matchMedia("(max-width: 699px)");
    const apply = () => Object.assign(document.documentElement.dataset, phoneQuery.matches ? phone : desktop);
    apply();
    phoneQuery.addEventListener("change", apply);
  </script>
</head>`;

test("the exported phone script clears an override on desktop when the field is unset", () => {
  const { config } = importProjectHtml(phoneDocument, source);
  const script = /<script>([\s\S]*)<\/script>/.exec(exportProjectHtml(config))[1];
  const dataset = {};
  let change;
  const query = { matches: true, addEventListener: (_, listener) => { change = listener; } };
  runInNewContext(script, { document: { documentElement: { dataset } }, matchMedia: () => query });
  assert.equal(dataset.panelFill, "solid");
  query.matches = false;
  change();
  assert.equal(dataset.panelFill, undefined);
  assert.equal(dataset.backgroundStyle, "grid");
});

test("valid duplicates keep the first value on an unchanged export", () => {
  const { config } = importProjectHtml("<html data-accent=gold data-accent=red>", source);
  assert.equal(config.appearance.accent, "gold");
  const exported = exportProjectHtml(config);
  assert.ok(exported.indexOf('data-accent="gold"') < exported.indexOf('data-accent="red"'));
  assert.deepEqual(plain(importProjectHtml(exported, source).config), plain(config));
});

test("duplicate attributes keep their values and order on an unchanged export", () => {
  const markup = '<html data-accent="chartreuse" lang="en" data-accent="gold">';
  const { config } = importProjectHtml(markup, source);
  const exported = exportProjectHtml(config);
  assert.ok(exported.includes('data-accent="chartreuse"'));
  assert.ok(exported.includes('data-accent="gold"'));
  assert.deepEqual(plain(importProjectHtml(exported, source).config), plain(config));
});

test("phone overrides import into appearance.phone and export back", () => {
  const { config, skipped } = importProjectHtml(phoneDocument, source);
  assert.deepEqual(skipped, []);
  assert.deepEqual(plain(config.appearance.phone), { backgroundStyle: "dots", panelFill: "solid" });
  const exported = exportProjectHtml(config);
  assert.ok(exported.includes('const phone = {"backgroundStyle":"dots","panelFill":"solid"};'));
  assert.ok(exported.includes('const desktop = {"backgroundStyle":"grid"};'));
  assert.deepEqual(plain(importProjectHtml(exported, source).config), plain(config));
  assert.ok(!exportProjectHtml(importProjectHtml(documents.pgconfig, source).config).includes("<script>"));
});

test("the exported phone script runs and picks overrides below 700px", () => {
  const { config } = importProjectHtml(phoneDocument, source);
  const script = /<script>([\s\S]*)<\/script>/.exec(exportProjectHtml(config))[1];
  for (const matches of [true, false]) {
    const dataset = {};
    runInNewContext(script, { document: { documentElement: { dataset } }, matchMedia: () => ({ matches, addEventListener() {} }) });
    assert.equal(dataset.backgroundStyle, matches ? "dots" : "grid");
  }
});

test("invalid phone overrides are skipped", () => {
  const markup = `<html data-accent="gold"><script>const phone = {"backgroundStyle":"nope","shadowStyle":"hard","accent":"red"};</script>`;
  const { config, skipped } = importProjectHtml(markup, source);
  assert.deepEqual(plain(config.appearance.phone), { shadowStyle: "hard" });
  assert.deepEqual(skipped, ["phone.backgroundStyle (invalid value)", "phone.accent (unknown setting)"]);
});

test("export never writes gallery-only fields as generated settings", () => {
  const config = { appearance: { accent: "gold", theme: "dark", landingBands: "full" }, structure: { headerWidth: "outset", pageWidth: "full" } };
  const exported = exportProjectHtml(config);
  assert.ok(!exported.includes("data-theme"));
  assert.ok(!exported.includes("data-header-width"));
  assert.ok(!exported.includes("data-landing-bands"));
  assert.ok(exported.includes('data-accent="gold"') && exported.includes('data-page-width="full"'));
});

test("a preset changes only the fields it defines", () => {
  const { config } = importProjectHtml(documents["pg-probe"], source);
  const next = applyPresetToProjectConfig(config, { accent: "red", shadowStyle: "hard", pageWidth: "full", theme: "dark", headerWidth: "outset", phoneBorderStyle: "inherit" });
  assert.equal(next.appearance.accent, "red");
  assert.equal(next.appearance.shadowStyle, "hard");
  assert.equal(next.structure.pageWidth, "full");
  assert.equal(next.appearance.neutral, undefined);
  assert.equal(next.appearance.theme, undefined);
  assert.equal(next.structure.headerWidth, undefined);
  assert.equal(next.appearance.phone, undefined);
  assert.equal(next.appearance.panelFill, "solid");
  assert.deepEqual(plain(config), plain(importProjectHtml(documents["pg-probe"], source).config));
  assert.deepEqual(next.rest, config.rest);
});

test("a preset on an empty project sets only its own fields and phone overrides", () => {
  const empty = importProjectHtml("<html>", source).config;
  const next = applyPresetToProjectConfig(empty, { accent: "teal", phoneBackgroundStyle: "dots", phonePanelFill: "inherit" });
  assert.deepEqual(plain(next.appearance), { accent: "teal", phone: { backgroundStyle: "dots" } });
  assert.deepEqual(plain(next.structure), {});
  const cleared = applyPresetToProjectConfig(next, { phoneBackgroundStyle: "inherit" });
  assert.equal(cleared.appearance.phone, undefined);
});

test("a full preset does not unset or fill anything else", () => {
  const { config } = importProjectHtml(documents.pgconfig, source);
  const next = applyPresetToProjectConfig(config, presetDefaults);
  assert.deepEqual(Object.keys(next.appearance).filter(key => key !== "phone").length > 7, true);
  assert.equal(next.appearance.theme, undefined);
  assert.equal(next.structure.landingBands, undefined);
});

const tui = (extra = {}) => ({ appearance: {}, structure: {}, tui: { accent: "gold", mode: "dark", ...extra } });

test("rust snippet for dark uses the token constant", () => {
  assert.equal(exportRustSnippet(tui()), "Theme::new(kiso_tokens::GOLD_DARK)");
});

test("rust snippet for light uses Accent::tokens(true)", () => {
  assert.equal(exportRustSnippet(tui({ mode: "light", accent: "teal" })), 'Theme::new(Accent::by_name("teal").unwrap().tokens(true))');
});

test("rust snippet accepts snes and rejects an unknown accent", () => {
  assert.equal(exportRustSnippet(tui({ accent: "snes" })), "Theme::new(kiso_tokens::SNES_DARK)");
  assert.equal(exportRustSnippet(tui({ accent: "mauve" })), null);
  assert.equal(exportRustSnippet({ appearance: {}, structure: {} }), null);
});

test("rust snippet chains only the non-default look fields", () => {
  const snippet = exportRustSnippet(tui({ look: { fill: "translucent", border: "none", round: false, title: { pattern: "heavy", ink: "primary" } } }));
  assert.equal(snippet, "Theme::new(kiso_tokens::GOLD_DARK).with_look(Look { fill: PanelFill::Translucent, ..Look::DEFAULT })");
  const custom = exportRustSnippet(tui({ mode: "light", look: { fill: "solid", border: "rail", round: true, title: { pattern: "braille-low", ink: "gradient" }, rule: { pattern: "dots", ink: "primary" } } }));
  assert.equal(custom, 'Theme::new(Accent::by_name("gold").unwrap().tokens(true)).with_look(Look { fill: PanelFill::Solid, border: Border::Rail, round: true, title: Stroke::new(Pattern::BrailleLow, Ink::Gradient), rule: Stroke::new(Pattern::Dots, Ink::Primary), ..Look::DEFAULT })');
  assert.equal(exportRustSnippet(tui({ look: {} })), "Theme::new(kiso_tokens::GOLD_DARK)");
});

test("divergence warns for pg-probe solid web against translucent TUI", () => {
  const { config } = importProjectHtml(documents["pg-probe"], source);
  const both = { ...config, tui: { accent: "gold", mode: "dark", look: { fill: "translucent", border: "none" } } };
  const warnings = checkTuiDivergence(both);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /panelFill is "solid" but TUI fill is "translucent"/);
  assert.deepEqual(plain(both.appearance), plain(config.appearance));
});

test("divergence warns on accent, border and legend and ignores unset or unrelated values", () => {
  const warnings = checkTuiDivergence({
    appearance: { accent: "teal", borderStyle: "rail", cornerStyle: "pixel" }, structure: { chartLegend: "inline" },
    tui: { accent: "gold", look: { border: "none" }, chartLegend: "table" },
  });
  assert.equal(warnings.length, 3);
  assert.deepEqual(checkTuiDivergence({ appearance: { accent: "gold", borderStyle: "dash" }, structure: {}, tui: { accent: "gold", look: { border: "none" } } }), []);
  assert.deepEqual(checkTuiDivergence({ appearance: { accent: "gold" }, structure: {}, tui: { mode: "dark" } }), []);
  assert.deepEqual(checkTuiDivergence({ appearance: {}, structure: {} }), []);
});

const share = value => JSON.stringify(value);

test("share v3 keeps unset fields unset and carries kiso, tui and demos", () => {
  const config = {
    kiso: { "@momoi-labs/kiso": "^1.1.0" }, appearance: { accent: "gold", phone: { borderStyle: "none" } }, structure: { pageWidth: "contained" },
    tui: { accent: "gold", mode: "dark", look: { fill: "translucent", title: { pattern: "heavy", ink: "primary" } } },
  };
  const text = projectShareText(config, { diagram: { edges: "curve" } });
  assert.deepEqual(JSON.parse(text), { v: 3, ...config, demos: { diagram: { edges: "curve" } } });
  const result = readShare(text, source, { diagram: { edges: ["curve", "line"] } });
  assert.deepEqual(result.skipped, []);
  assert.deepEqual(plain(result.project), { ...config, appearance: config.appearance, structure: config.structure, demos: { diagram: { edges: "curve" } } });
  assert.equal(result.settings.accent, "gold");
  assert.equal(result.settings.phoneBorderStyle, "none");
  assert.equal(result.settings.pageWidth, "contained");
  assert.equal(result.settings.shadowStyle, source.defaults.shadowStyle);
  assert.deepEqual(result.demos, { diagram: { edges: "curve" } });
});

test("share v3 without optional parts has no kiso, tui or demos", () => {
  const text = projectShareText({ appearance: {}, structure: {} });
  assert.deepEqual(JSON.parse(text), { v: 3, appearance: {}, structure: {} });
  const result = readShare(text, source);
  assert.deepEqual(plain(result.project), { appearance: {}, structure: {} });
  assert.deepEqual(result.skipped, []);
});

test("share v3 skips invalid fields, wrong sections and gallery-only keys", () => {
  const result = readShare(share({
    v: 3, kiso: { kiso: 1 },
    appearance: { accent: "chartreuse", cornerSize: "large", pageWidth: "full", theme: "dark", flavor: "x", phone: { panelFill: "bad", border: "x" } },
    structure: { appShell: "inset", accent: "gold", landingBands: "full" },
    tui: { accent: "mauve", mode: "dark", look: { fill: "wet", round: "yes", color: "x" }, extra: 1 },
    demos: { nope: {} }, other: 1,
  }), source);
  assert.deepEqual(plain(result.project.appearance), { cornerSize: "large" });
  assert.deepEqual(plain(result.project.structure), { appShell: "inset" });
  assert.deepEqual(plain(result.project.tui), { mode: "dark", look: {} });
  assert.equal(result.project.kiso?.kiso, undefined);
  for (const entry of ["kiso.kiso (invalid value)", "appearance.accent (invalid value)", "appearance.pageWidth (wrong section)", "appearance.theme (unknown setting)",
    "appearance.flavor (unknown setting)", "appearance.phone.panelFill (invalid value)", "appearance.phone.border (unknown setting)", "structure.accent (wrong section)",
    "structure.landingBands (unknown setting)", "tui.accent (invalid value)", "tui.look.fill (invalid value)", "tui.look.round (invalid value)",
    "tui.look.color (unknown setting)", "tui.extra (unknown setting)", "nope (unknown setting)", "other (unknown setting)"]) {
    assert.ok(result.skipped.includes(entry), entry);
  }
});

test("share v1 and v2 still read and fill from the receiver defaults", () => {
  const v1 = readShare(share({ v: 1, s: { accent: "teal" } }), source);
  assert.equal(v1.settings.accent, "teal");
  assert.equal(v1.settings.shadowStyle, "auto");
  assert.equal(v1.project, undefined);
  const v2 = readShare(share({ v: 2, s: { accent: "red", nope: "x", pageWidth: "wide" }, diagram: { edges: "curve" } }), source, { diagram: { edges: ["curve"] } });
  assert.equal(v2.settings.accent, "red");
  assert.equal(v2.settings.pageWidth, source.defaults.pageWidth);
  assert.equal(v2.settings.shadowStyle, "none");
  assert.deepEqual(v2.skipped, ["nope (unknown setting)", "pageWidth (invalid value)"]);
  assert.deepEqual(v2.demos, { diagram: { edges: "curve" } });
});

test("parseProjectConfig restores saved configs and rejects malformed storage values", () => {
  const { config } = importProjectHtml(documents.pgconfig, source);
  const full = {
    ...config,
    kiso: { "@momoi-labs/kiso": "^1.15.0" },
    appearance: { ...config.appearance, phone: { borderStyle: "none" } },
    tui: { accent: "snes", mode: "dark", look: { fill: "translucent", border: "rail", round: true, title: { pattern: "heavy", ink: "primary" } } },
    demos: { diagram: { edges: "curve" } },
  };
  assert.deepEqual(plain(parseProjectConfig(JSON.stringify(full), source)), plain(full));
  for (const invalid of [null, "", "{bad", "[]", "{}", '{"appearance":[]}', '{"appearance":{},"structure":null}']) {
    assert.equal(parseProjectConfig(invalid, source), null, String(invalid));
  }
  const filtered = parseProjectConfig(JSON.stringify({
    kiso: { "@momoi-labs/kiso": "^1.15.0", constructor: "bad" },
    appearance: { accent: "gold", theme: "dark", bogus: "x", phone: { borderStyle: "bad", panelFill: "solid" } },
    structure: { pageWidth: "full", accent: "teal", headerWidth: "outset" },
    demos: {
      __proto__: { polluted: "yes" },
      constructor: { polluted: "yes" },
      prototype: { polluted: "yes" },
      diagram: { edges: "curve", constructor: "bad", invalid: "nope" },
      unknown: { a: "b" },
    },
    rest: [{ name: "lang", value: "en" }, { name: 123, value: "bad" }],
  }), source, { diagram: { edges: ["orthogonal", "curve"] } });
  assert.deepEqual(plain(filtered), {
    kiso: { "@momoi-labs/kiso": "^1.15.0" },
    appearance: { accent: "gold", phone: { panelFill: "solid" } },
    structure: { pageWidth: "full" },
    demos: { diagram: { edges: "curve" } },
    rest: [{ name: "lang", value: "en" }],
  });
  assert.equal(Object.hasOwn(filtered.demos, "constructor"), false);
  assert.equal(Object.hasOwn(filtered.demos.diagram, "constructor"), false);
});

test("project preview helpers resolve Kiso fallbacks and strip gallery-only fields", () => {
  const preview = settingsFromProject(
    { appearance: { accent: "cobalt", phone: { backgroundStyle: "dots" } }, structure: { pageWidth: "contained" } },
    projectPreviewDefaults(source.options, { ...source.defaults, theme: "light", headerWidth: "outset", landingBands: "inside" }),
  );
  assert.equal(preview.accent, "cobalt");
  assert.equal(preview.cornerMarks, "none");
  assert.equal(preview.shadowStyle, "auto");
  assert.equal(preview.frameScope, "panels");
  assert.equal(preview.panelFill, "solid");
  assert.equal(preview.phoneBackgroundStyle, "dots");
  assert.equal(preview.pageWidth, "contained");
  assert.equal(preview.theme, "light");
  assert.equal(preview.headerWidth, "outset");
  assert.equal(preview.landingBands, "inside");
  assert.deepEqual(exportedPatch({ accent: "teal", theme: "dark", headerWidth: "outset", landingBands: "full", pageWidth: "full" }), { accent: "teal", pageWidth: "full" });
});
