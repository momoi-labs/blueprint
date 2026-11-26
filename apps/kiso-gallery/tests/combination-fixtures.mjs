import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { presetDefaults } from "../src/appearance-settings.ts";

export const expectedPresetLabels = [
  "Kiso classic",
  "Blueprint",
  "Drawing plate",
  "Drafting sheet",
  "Pixel workshop",
  "Manga board",
  "Brush study",
  "Momoi signature",
  "SNES",
  "pg-probe",
  "Pixel everywhere",
];

export const expectedDeliveryRepos = [
  "interview-kit",
  "pgconfig",
  "pg-probe",
  "pg-probe-private",
  "pg-probe-report-title",
  "pg-yard",
  "quiet-inbox",
  "self-host",
  "simulators",
  "startup-kf-diagnostic",
  "template-web-app",
];

export const presetCompositions = [
  { label: "Kiso classic", settings: { shadowStyle: "soft", theme: "system", appShell: "default" } },
  { label: "Blueprint", settings: { shadowStyle: "none", accent: "blueprint", backgroundStyle: "construction", backgroundPlacement: "both", outerBorderStyle: "solid", technicalText: "mono", controlStyle: "tactile", progressStyle: "segmented", panelLabels: "numbered", chartPalette: "mono", markClearance: "sheet", frameScope: "all" } },
  { label: "Drawing plate", settings: { shadowStyle: "hard", accent: "terracotta", backgroundStyle: "fibers", outerBorderStyle: "double", cornerMarks: "none", outerCornerMarks: "ticks", markScope: "outer" } },
  { label: "Drafting sheet", settings: { shadowStyle: "none", backgroundStyle: "dots", cornerMarks: "none", outerCornerMarks: "ticks", markScope: "outer" } },
  { label: "Pixel workshop", settings: { shadowStyle: "hard", backgroundStyle: "dots", outerCornerStyle: "pixel", cornerMarks: "none", outerCornerMarks: "brackets", markScope: "outer" } },
  { label: "Manga board", settings: { shadowStyle: "hard", backgroundStyle: "grid", phoneBackgroundStyle: "dots", outerBorderStyle: "manga", cornerMarks: "none", outerCornerMarks: "diagonal", markScope: "outer" } },
  { label: "Brush study", settings: { shadowStyle: "soft", backgroundStyle: "fibers", outerBorderStyle: "brush", cornerMarks: "none", frameScope: "outer", markScope: "outer" } },
  { label: "Momoi signature", settings: { theme: "light", accent: "violet", neutral: "warm", primary: "accent", typeface: "inter", chartLine: "straight", chartFill: "none", chartLayout: "standard", chartLegend: "table", shadowStyle: "soft", borderStyle: "solid", cornerStyle: "asym", cornerMarks: "none", cornerSize: "medium", markSize: "medium", visualStyle: "default", appShell: "inset", headerVariant: "default", headerSize: "default", headerWidth: "page", appShellOuter: "full", brandBar: "full", pageWidth: "contained", pageAlign: "center", frameScope: "panels", markScope: "outer", markClearance: "normal", backgroundStyle: "momoi-repeat", backgroundStrength: "quiet", backgroundPlacement: "both", frameDetail: "medium", paperTone: "theme", panelFill: "translucent", landingBands: "inside", outerBorderStyle: "inherit", outerCornerStyle: "asym", outerCornerMarks: "inherit", outerShadowStyle: "inherit", phoneBackgroundStyle: "inherit", phoneBorderStyle: "inherit", phoneCornerStyle: "inherit", phoneCornerMarks: "inherit", phonePanelFill: "inherit", phoneShadowStyle: "inherit" } },
  { label: "SNES", settings: { theme: "system", accent: "snes", chartLine: "straight", chartFill: "none", chartLayout: "standard", chartLegend: "table", shadowStyle: "soft", borderStyle: "solid", cornerStyle: "rounded", cornerMarks: "none", cornerSize: "large", markSize: "medium", visualStyle: "default", appShell: "inset", headerVariant: "floating", headerSize: "default", headerWidth: "page", appShellOuter: "full", pageWidth: "contained", pageAlign: "center", frameScope: "all", markScope: "panels", markClearance: "normal", backgroundStyle: "glow", backgroundStrength: "quiet", backgroundPlacement: "both", frameDetail: "medium", paperTone: "theme", panelFill: "glass", outerBorderStyle: "none", outerCornerStyle: "square", outerCornerMarks: "none", outerShadowStyle: "none", phoneBackgroundStyle: "inherit", phoneBorderStyle: "inherit", phoneCornerStyle: "inherit", phoneCornerMarks: "inherit", phonePanelFill: "inherit", phoneShadowStyle: "inherit", landingBands: "full" } },
  { label: "pg-probe", settings: { theme: "dark", accent: "gold", neutral: "zinc", primary: "contrast", typeface: "dm-sans", shadowStyle: "none", borderStyle: "solid", cornerStyle: "rounded", cornerSize: "small", cornerMarks: "none", visualStyle: "default", appShell: "default", headerVariant: "default", pageWidth: "contained", pageAlign: "center", frameScope: "all", markScope: "panels", backgroundStyle: "solid", panelFill: "solid", paperTone: "theme" } },
  { label: "Pixel everywhere", settings: { shadowStyle: "hard", theme: "system", cornerStyle: "pixel", cornerSize: "small", backgroundStyle: "fibers", visualStyle: "editorial", frameScope: "all", markScope: "panels" } },
];

export function readSourceCompositions() {
  const source = readFileSync(new URL("../src/appearance.tsx", import.meta.url), "utf8");
  const match = /const compositions:[^=]+=\s*(\[[\s\S]*?\n\]);/.exec(source);
  if (!match) throw new Error("Could not find compositions in apps/kiso-gallery/src/appearance.tsx");
  return runInNewContext(`(${match[1]})`, Object.create(null));
}

const presetBase = {
  ...presetDefaults,
  cornerStyle: "square",
  cornerSize: "medium",
  backgroundStyle: "solid",
  visualStyle: "default",
  appShell: "inset",
  frameScope: "panels",
};

export const galleryPresets = presetCompositions.map(({ label, settings }) => ({
  label,
  look: { ...presetBase, ...settings },
  defined: settings,
}));

const htmlTag = (lang, pairs) => {
  const entries = pairs.trim().split(/\s+/).filter(Boolean).map(pair => {
    const [name, value] = pair.split("=");
    return `  data-${name}="${value}"`;
  });
  return entries.length ? `<html lang="${lang}"\n${entries.join("\n")}\n>` : `<html lang="${lang}">`;
};

const pgProbePairs = "accent=gold chart-line=straight chart-fill=dots chart-layout=standard chart-legend=table border-style=solid corner-style=rounded corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=panels mark-scope=panels mark-clearance=normal background-style=dots background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=solid";
const selfHostBase = "theme=light accent=tangerine neutral=warm primary=accent typeface=inter chart-line=straight chart-fill=none chart-layout=standard chart-legend=table shadow-style=none border-style=solid corner-style=pixel corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=inset";
const selfHostTail = "header-size=default header-width=page app-shell-outer=auto brand-bar=full page-width=full page-align=start frame-scope=all mark-scope=panels mark-clearance=normal background-style=construction background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=solid landing-bands=inside outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=inherit outer-shadow-style=hard";

export const deliveryProjects = [
  {
    id: "interview-kit",
    repo: "interview-kit",
    sourcePath: "web/src/routes/__root.tsx",
    html: htmlTag("pt-BR", "accent=plum chart-line=straight chart-fill=tint chart-layout=standard chart-legend=inline shadow-style=soft border-style=double corner-style=rounded corner-marks=none corner-size=medium mark-size=medium visual-style=default app-shell=inset header-variant=default header-size=default header-width=page app-shell-outer=auto page-width=contained page-align=center frame-scope=all mark-scope=outer mark-clearance=normal background-style=crosses background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=inherit outer-shadow-style=inherit"),
    expectedRest: ["lang", "data-header-width"],
    expectedDataCount: 32,
  },
  {
    id: "pgconfig",
    repo: "pgconfig",
    sourcePath: "web/index.html",
    html: htmlTag("en", "accent=cobalt border-style=solid corner-style=square corner-marks=none corner-size=off mark-size=large visual-style=default app-shell=default"),
    expectedRest: ["lang"],
    expectedDataCount: 8,
  },
  {
    id: "pg-probe",
    repo: "pg-probe",
    sourcePath: "web/index.html",
    html: htmlTag("en", pgProbePairs),
    expectedRest: ["lang"],
    expectedDataCount: 22,
  },
  {
    id: "pg-probe-demo",
    repo: "pg-probe",
    sourcePath: "site/public/demo/console/index.html",
    html: htmlTag("en", `theme=dark ${pgProbePairs}`),
    expectedRest: ["lang", "data-theme"],
    expectedDataCount: 23,
  },
  {
    id: "pg-probe-private",
    repo: "pg-probe-private",
    sourcePath: "web/index.html",
    html: htmlTag("en", pgProbePairs),
    expectedRest: ["lang"],
    expectedDataCount: 22,
  },
  {
    id: "pg-probe-private-demo",
    repo: "pg-probe-private",
    sourcePath: "site/public/demo/console/index.html",
    html: htmlTag("en", `theme=dark ${pgProbePairs}`),
    expectedRest: ["lang", "data-theme"],
    expectedDataCount: 23,
  },
  {
    id: "pg-probe-report-title",
    repo: "pg-probe-report-title",
    sourcePath: "web/index.html",
    html: htmlTag("en", pgProbePairs),
    expectedRest: ["lang"],
    expectedDataCount: 22,
  },
  {
    id: "pg-yard",
    repo: "pg-yard",
    sourcePath: "web/index.html",
    html: htmlTag("en", "accent=nocturne chart-line=stepped chart-fill=dots chart-layout=standard chart-legend=table border-style=solid corner-style=square corner-marks=brackets corner-size=medium mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=all mark-scope=panels mark-clearance=sheet background-style=guides background-strength=visible background-placement=both frame-detail=large paper-tone=theme panel-fill=solid outer-border-style=double outer-corner-style=rounded outer-corner-marks=brackets"),
    expectedRest: ["lang"],
    expectedDataCount: 25,
  },
  {
    id: "quiet-inbox",
    repo: "quiet-inbox",
    sourcePath: "index.html",
    html: htmlTag("en", "accent=teal border-style=solid corner-style=rounded corner-marks=arcs corner-size=medium mark-size=small visual-style=default app-shell=inset frame-scope=all mark-scope=panels mark-clearance=normal background-style=momoi background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent outer-border-style=inherit outer-corner-style=inherit outer-corner-marks=ticks"),
    expectedRest: ["lang"],
    expectedDataCount: 20,
  },
  {
    id: "self-host",
    repo: "self-host",
    sourcePath: "console/index.html",
    html: htmlTag("en", `${selfHostBase} header-variant=default ${selfHostTail}`),
    expectedRest: ["lang", "data-theme", "data-header-width", "data-landing-bands"],
    expectedDataCount: 38,
  },
  {
    id: "self-host-login",
    repo: "self-host",
    sourcePath: "console/login.html",
    html: htmlTag("en", `${selfHostBase} header-variant=floating ${selfHostTail}`),
    expectedRest: ["lang", "data-theme", "data-header-width", "data-landing-bands"],
    expectedDataCount: 38,
  },
  {
    id: "self-host-setup",
    repo: "self-host",
    sourcePath: "console/setup.html",
    html: htmlTag("en", `${selfHostBase} header-variant=floating ${selfHostTail}`),
    expectedRest: ["lang", "data-theme", "data-header-width", "data-landing-bands"],
    expectedDataCount: 38,
  },
  {
    id: "simulators",
    repo: "simulators",
    sourcePath: "src/layouts/Base.astro",
    html: htmlTag("pt-BR", "accent=cobalt chart-line=straight chart-fill=none chart-layout=standard chart-legend=table border-style=solid corner-style=rounded corner-marks=none corner-size=small mark-size=medium visual-style=default app-shell=default app-shell-outer=auto frame-scope=panels mark-scope=panels mark-clearance=normal background-style=momoi-repeat background-strength=quiet background-placement=both frame-detail=medium paper-tone=theme panel-fill=translucent"),
    expectedRest: ["lang"],
    expectedDataCount: 22,
  },
  {
    id: "startup-kf-diagnostic",
    repo: "startup-kf-diagnostic",
    sourcePath: "app/index.html",
    html: htmlTag("en", ""),
    expectedRest: ["lang"],
    expectedDataCount: 0,
  },
  {
    id: "template-web-app",
    repo: "template-web-app",
    sourcePath: "web/index.html",
    html: htmlTag("en", ""),
    expectedRest: ["lang"],
    expectedDataCount: 0,
  },
];

export function extractDataAttributes(markup) {
  const attrs = {};
  for (const match of markup.matchAll(/(data-[a-z0-9-]+)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export function dataSignature(markup) {
  return Object.entries(extractDataAttributes(markup))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join(";");
}

export function kebabToCamel(name) {
  return name.replace(/^data-/, "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

const bySignature = new Map();
for (const project of deliveryProjects) {
  const signature = dataSignature(project.html);
  const existing = bySignature.get(signature);
  if (existing) {
    existing.covers.push(project.id);
  } else {
    bySignature.set(signature, { ...project, signature, covers: [project.id] });
  }
}

export const uniqueDeliveryProjects = [...bySignature.values()];
