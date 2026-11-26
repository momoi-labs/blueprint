import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { phoneKeys, type AppearanceSettings } from "./appearance-settings.ts";

export type FieldClass = "appearance" | "structure" | "galleryOnly";

export const fieldClass: Record<keyof AppearanceSettings, FieldClass> = {
  theme: "galleryOnly",
  headerWidth: "galleryOnly",
  landingBands: "galleryOnly",
  accent: "appearance",
  neutral: "appearance",
  primary: "appearance",
  typeface: "appearance",
  technicalText: "appearance",
  controlStyle: "appearance",
  progressStyle: "appearance",
  panelLabels: "appearance",
  chartPalette: "appearance",
  chartLine: "appearance",
  chartFill: "appearance",
  borderStyle: "appearance",
  shadowStyle: "appearance",
  cornerStyle: "appearance",
  cornerMarks: "appearance",
  cornerSize: "appearance",
  markSize: "appearance",
  visualStyle: "appearance",
  outerShadowStyle: "appearance",
  outerBorderStyle: "appearance",
  outerCornerStyle: "appearance",
  outerCornerMarks: "appearance",
  frameScope: "appearance",
  markScope: "appearance",
  shadowScope: "appearance",
  markClearance: "appearance",
  backgroundStyle: "appearance",
  backgroundStrength: "appearance",
  backgroundPlacement: "appearance",
  diagramBackgroundStyle: "appearance",
  diagramBackgroundStrength: "appearance",
  frameDetail: "appearance",
  paperTone: "appearance",
  panelFill: "appearance",
  phoneBackgroundStyle: "appearance",
  phoneShadowStyle: "appearance",
  phoneBorderStyle: "appearance",
  phoneCornerStyle: "appearance",
  phoneCornerMarks: "appearance",
  phonePanelFill: "appearance",
  chartLayout: "structure",
  chartLegend: "structure",
  appShell: "structure",
  appShellOuter: "structure",
  shellBottom: "structure",
  shellBottomStyle: "structure",
  shellRight: "structure",
  brandBar: "structure",
  headerVariant: "structure",
  headerSize: "structure",
  pageWidth: "structure",
  pageAlign: "structure",
};

export const tuiAccents = ["violet", "terracotta", "teal", "cobalt", "nocturne", "tangerine", "red", "gold", "lime", "plum", "stone", "steel", "pine", "snes"] as const;
export const tuiPatterns = ["shade", "hatch", "backslash", "zigzag", "cross", "thin", "heavy", "double", "dashed", "dashes", "dotted", "baseline", "braille", "braille-low", "dots"] as const;
export const tuiInks = ["primary", "gradient", "faint"] as const;
export const tuiFills = ["glass", "translucent", "solid"] as const;
export const tuiBorders = ["none", "rail"] as const;
export const tuiModes = ["light", "dark"] as const;
export const tuiLegends = ["table", "inline", "hidden"] as const;

export interface TuiStroke { pattern: string; ink: string }
export interface TuiLook { fill?: string; border?: string; round?: boolean; title?: TuiStroke; rule?: TuiStroke }
export interface TuiConfig { accent?: string; mode?: string; chartLegend?: string; look?: TuiLook }

export interface ProjectAttribute { name: string; value: string | null }
export interface ProjectConfig {
  kiso?: Record<string, string>;
  appearance: { phone?: Record<string, string>; [key: string]: string | Record<string, string> | undefined };
  structure: Record<string, string>;
  tui?: TuiConfig;
  demos?: DemoOptions;
  rest?: ProjectAttribute[];
}

export interface ProjectImport {
  config: ProjectConfig | null;
  skipped: string[];
  error?: string;
}

type Options = Record<string, readonly string[]>;
export interface OptionsSource { options: Options }

const kebab = (name: string) => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const capital = (key: string) => key[0].toUpperCase() + key.slice(1);
const exportedKeys = (Object.keys(fieldClass) as (keyof AppearanceSettings)[])
  .filter(key => fieldClass[key] !== "galleryOnly" && !key.startsWith("phone"));
const byAttribute = new Map(exportedKeys.map(key => [`data-${kebab(key)}`, key]));
const section = (key: string) => (fieldClass as Record<string, FieldClass>)[key];

export const emptyProject = (): ProjectConfig => ({ appearance: {}, structure: {} });

export function readFieldValue(options: Options, key: string, value: unknown) {
  const values = Object.hasOwn(options, key) ? options[key] : undefined;
  return values && typeof value === "string" && values.includes(value) ? value : null;
}

export function readPhone(options: Options, value: unknown, skipped: string[], prefix = "appearance.phone") {
  const phone: Record<string, string> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    skipped.push(`${prefix} (invalid value)`);
    return phone;
  }
  for (const [key, override] of Object.entries(value)) {
    if (!(phoneKeys as readonly string[]).includes(key)) skipped.push(`${prefix}.${key} (unknown setting)`);
    else if (readFieldValue(options, `phone${capital(key)}`, override) === null) skipped.push(`${prefix}.${key} (invalid value)`);
    else if (override !== "inherit") phone[key] = override as string;
  }
  return phone;
}

function readAttributes(tag: string) {
  const attributes: ProjectAttribute[] = [];
  const pattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gy;
  pattern.lastIndex = 0;
  let index = 0;
  while (index < tag.length) {
    if (/[\s\/]/.test(tag[index])) { index++; continue; }
    pattern.lastIndex = index;
    const match = pattern.exec(tag);
    if (!match) { index++; continue; }
    attributes.push({ name: match[1], value: match[2] ?? match[3] ?? match[4] ?? null });
    index = pattern.lastIndex;
  }
  return attributes;
}

function findHtmlTag(input: string) {
  const start = /<html(?=[\s>\/])/i.exec(input);
  if (!start) return null;
  let quote = "";
  for (let index = start.index + 5; index < input.length; index++) {
    const char = input[index];
    if (quote) { if (char === quote) quote = ""; }
    else if (char === '"' || char === "'") quote = char;
    else if (char === ">") return input.slice(start.index + 5, index);
  }
  return null;
}

export function importProjectHtml(input: string, source: OptionsSource): ProjectImport {
  const tag = findHtmlTag(input);
  if (tag === null) return { config: null, skipped: [], error: "No <html> tag found." };
  const config = emptyProject();
  const skipped: string[] = [];
  const rest: ProjectAttribute[] = [];
  for (const attribute of readAttributes(tag)) {
    const key = byAttribute.get(attribute.name.toLowerCase());
    if (!key) { rest.push(attribute); continue; }
    const target = (section(key) === "structure" ? config.structure : config.appearance) as Record<string, string>;
    const value = attribute.value === null ? null : readFieldValue(source.options, key, attribute.value);
    if (value === null || Object.hasOwn(target, key)) {
      skipped.push(`${attribute.name} (${value === null ? "invalid value" : "duplicate"})`);
      rest.push(attribute);
    } else target[key] = value;
  }
  config.rest = rest;
  const script = /const\s+phone\s*=\s*(\{[\s\S]*?\})\s*;/.exec(input.slice(input.indexOf(">", input.search(/<html/i)) + 1));
  if (script) {
    let parsed: unknown = null;
    try { parsed = JSON.parse(script[1]); } catch { skipped.push("phone (invalid value)"); }
    if (parsed) {
      const phone = readPhone(source.options, parsed, skipped, "phone");
      if (Object.keys(phone).length) config.appearance.phone = phone;
    }
  }
  return { config, skipped };
}

function quoted(attribute: ProjectAttribute) {
  if (attribute.value === null) return attribute.name;
  return attribute.value.includes('"') ? `${attribute.name}='${attribute.value}'` : `${attribute.name}="${attribute.value}"`;
}

function generatedAttributes(config: ProjectConfig): ProjectAttribute[] {
  const set = (key: string) => section(key) === "structure" ? config.structure : config.appearance;
  return exportedKeys.flatMap(key => {
    const value = (set(key) as Record<string, unknown>)[key];
    return typeof value === "string" ? [{ name: `data-${kebab(key)}`, value }] : [];
  });
}

export function exportProjectHtml(config: ProjectConfig) {
  const generated = generatedAttributes(config);
  const names = new Set(generated.map(attribute => attribute.name));
  const rest = config.rest ?? [];
  const clashes = (attribute: ProjectAttribute) => names.has(attribute.name.toLowerCase());
  const clash = rest.findIndex(clashes);
  const at = clash === -1 ? rest.length : clash;
  const attributes = [...rest.slice(0, at), ...generated, ...rest.slice(at)].map(quoted);
  const html = attributes.length === 0 ? "<html>"
    : attributes.length === 1 ? `<html ${attributes[0]}>`
    : `<html ${attributes[0]}\n${attributes.slice(1).map(attribute => `  ${attribute}`).join("\n")}\n>`;
  const phone = config.appearance.phone ?? {};
  if (Object.keys(phone).length === 0) return html;
  const desktop = Object.fromEntries(exportedKeys
    .filter(key => key in phone && generated.some(attribute => attribute.name === `data-${kebab(key)}`))
    .map(key => [key, generated.find(attribute => attribute.name === `data-${kebab(key)}`)?.value]));
  return `${html}\n<head>\n  <script>\n    const phone = ${JSON.stringify(phone)};\n    const desktop = ${JSON.stringify(desktop)};\n    const phoneQuery = matchMedia("(max-width: 699px)");\n    const apply = () => {\n      const values = phoneQuery.matches ? phone : desktop;\n      for (const key in phone) key in values ? document.documentElement.dataset[key] = values[key] : delete document.documentElement.dataset[key];\n    };\n    apply();\n    phoneQuery.addEventListener("change", apply);\n  </script>\n</head>`;
}

export function applyPresetToProjectConfig(config: ProjectConfig, preset: Partial<AppearanceSettings>): ProjectConfig {
  const next: ProjectConfig = {
    ...config,
    appearance: { ...config.appearance, ...(config.appearance.phone ? { phone: { ...config.appearance.phone } } : {}) },
    structure: { ...config.structure },
  };
  for (const [name, value] of Object.entries(preset)) {
    if (typeof value !== "string" || !Object.hasOwn(fieldClass, name) || section(name) === "galleryOnly") continue;
    if (name.startsWith("phone")) {
      const key = name[5].toLowerCase() + name.slice(6);
      const phone = { ...next.appearance.phone };
      if (value === "inherit") delete phone[key]; else phone[key] = value;
      if (Object.keys(phone).length) next.appearance.phone = phone; else delete next.appearance.phone;
    } else if (section(name) === "structure") next.structure[name] = value;
    else (next.appearance as Record<string, string>)[name] = value;
  }
  return next;
}

const pascal = (name: string) => name.split("-").map(capital).join("");
const defaultLook: Required<TuiLook> = {
  fill: "glass", border: "none", round: false,
  title: { pattern: "heavy", ink: "primary" }, rule: { pattern: "thin", ink: "faint" },
};
const stroke = (value: TuiStroke) => `Stroke::new(Pattern::${pascal(value.pattern)}, Ink::${pascal(value.ink)})`;

export function exportRustSnippet(config: ProjectConfig): string | null {
  const tui = config.tui;
  if (!tui?.accent || !(tuiAccents as readonly string[]).includes(tui.accent)) return null;
  const tokens = tui.mode === "light"
    ? `Accent::by_name("${tui.accent}").unwrap().tokens(true)`
    : `kiso_tokens::${tui.accent.toUpperCase()}_DARK`;
  const look = tui.look ?? {};
  const fields: string[] = [];
  if (look.fill && look.fill !== defaultLook.fill) fields.push(`fill: PanelFill::${pascal(look.fill)}`);
  if (look.border && look.border !== defaultLook.border) fields.push(`border: Border::${pascal(look.border)}`);
  if (look.round !== undefined && look.round !== defaultLook.round) fields.push(`round: ${look.round}`);
  for (const part of ["title", "rule"] as const) {
    const value = look[part];
    if (value && (value.pattern !== defaultLook[part].pattern || value.ink !== defaultLook[part].ink)) fields.push(`${part}: ${stroke(value)}`);
  }
  const theme = `Theme::new(${tokens})`;
  return fields.length === 0 ? theme : `${theme}.with_look(Look { ${fields.join(", ")}, ..Look::DEFAULT })`;
}

export function checkTuiDivergence(config: ProjectConfig): string[] {
  const tui = config.tui;
  if (!tui) return [];
  const warnings: string[] = [];
  const web = config.appearance as Record<string, string | undefined>;
  const differ = (field: string, webValue: string | undefined, tuiField: string, tuiValue: string | undefined) => {
    if (webValue !== undefined && tuiValue !== undefined && webValue !== tuiValue) {
      warnings.push(`Web ${field} is "${webValue}" but TUI ${tuiField} is "${tuiValue}".`);
    }
  };
  differ("accent", web.accent, "accent", tui.accent);
  differ("panelFill", web.panelFill, "fill", tui.look?.fill);
  if (web.borderStyle === "none" || web.borderStyle === "rail") differ("borderStyle", web.borderStyle, "border", tui.look?.border);
  differ("chartLegend", config.structure.chartLegend, "chartLegend", tui.chartLegend);
  return warnings;
}
