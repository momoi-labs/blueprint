import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { emptyProject, fieldClass, readFieldValue, readPhone, tuiAccents, tuiBorders, tuiFills, tuiInks, tuiLegends, tuiModes, tuiPatterns, type ProjectConfig, type TuiConfig, type TuiLook, type TuiStroke } from "./project-config.ts";

const chartPresets: Record<string, { line: string; fill: string }> = {
  solid: { line: "straight", fill: "none" },
  pixel: { line: "stepped", fill: "none" },
  halftone: { line: "straight", fill: "dots" },
  rounded: { line: "curved", fill: "none" },
};

// A shared look is `{ v: 2, s: { ...all appearance settings } }`,
// plus one key per demo with options set, such as `diagram: { edges: "curve" }`.
// A demo's keys are its component's props.
// A link carries it as base64url JSON in the `appearance` query parameter.
// The hash already holds the gallery route, so the code cannot live there.
export const shareVersion = 2;
export const projectShareVersion = 3;
export const shareParam = "appearance";

type Source = Pick<Window["kisoAppearance"], "defaults" | "options">;
/** The values each demo option accepts, by scope. */
export type DemoSchema = Record<string, Record<string, readonly string[]>>;
export interface ShareResult {
  settings: AppearanceSettings | null;
  demos: DemoOptions;
  skipped: string[];
  error?: string;
  project?: ProjectConfig;
}

function toBase64Url(text: string) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string) {
  const binary = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

const setDemos = (demos: DemoOptions) => Object.fromEntries(Object.entries(demos).filter(([, values]) => Object.keys(values).length));

export function projectShareText(config: ProjectConfig, demos: DemoOptions = {}) {
  const { kiso, appearance, structure, tui } = config;
  const merged = setDemos({ ...(config.demos ?? {}), ...demos });
  return JSON.stringify({ v: projectShareVersion, ...(kiso ? { kiso } : {}), appearance, structure, ...(tui ? { tui } : {}), ...(Object.keys(merged).length ? { demos: merged } : {}) });
}

function readTui(value: unknown, skipped: string[]) {
  const tui: TuiConfig = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) { skipped.push("tui (invalid value)"); return tui; }
  const pick = (path: string, input: unknown, allowed: readonly string[]) => {
    if (typeof input === "string" && allowed.includes(input)) return input;
    skipped.push(`${path} (invalid value)`);
    return undefined;
  };
  const stroke = (path: string, input: unknown): TuiStroke | undefined => {
    if (!input || typeof input !== "object" || Array.isArray(input)) { skipped.push(`${path} (invalid value)`); return undefined; }
    const { pattern, ink } = input as Record<string, unknown>;
    const p = pick(`${path}.pattern`, pattern, tuiPatterns);
    const i = pick(`${path}.ink`, ink, tuiInks);
    return p && i ? { pattern: p, ink: i } : undefined;
  };
  const known = ["accent", "mode", "chartLegend", "look"];
  for (const [key, input] of Object.entries(value)) {
    if (!known.includes(key)) skipped.push(`tui.${key} (unknown setting)`);
    else if (key === "accent") { const v = pick("tui.accent", input, tuiAccents); if (v) tui.accent = v; }
    else if (key === "mode") { const v = pick("tui.mode", input, tuiModes); if (v) tui.mode = v; }
    else if (key === "chartLegend") { const v = pick("tui.chartLegend", input, tuiLegends); if (v) tui.chartLegend = v; }
    else if (!input || typeof input !== "object" || Array.isArray(input)) skipped.push("tui.look (invalid value)");
    else {
      const look: TuiLook = {};
      for (const [name, part] of Object.entries(input)) {
        if (name === "fill") { const v = pick("tui.look.fill", part, tuiFills); if (v) look.fill = v; }
        else if (name === "border") { const v = pick("tui.look.border", part, tuiBorders); if (v) look.border = v; }
        else if (name === "round") { if (typeof part === "boolean") look.round = part; else skipped.push("tui.look.round (invalid value)"); }
        else if (name === "title" || name === "rule") { const v = stroke(`tui.look.${name}`, part); if (v) look[name] = v; }
        else skipped.push(`tui.look.${name} (unknown setting)`);
      }
      tui.look = look;
    }
  }
  return tui;
}

function readProject(data: Record<string, unknown>, options: Source["options"], schema: DemoSchema, skipped: string[]) {
  const project = emptyProject();
  const known = ["v", "kiso", "appearance", "structure", "tui", "demos"];
  for (const key of Object.keys(data)) if (!known.includes(key)) skipped.push(`${key} (unknown setting)`);
  const { kiso, appearance, structure, tui, demos } = data;
  if (kiso !== undefined) {
    if (kiso && typeof kiso === "object" && !Array.isArray(kiso)) {
      project.kiso = {};
      for (const [name, version] of Object.entries(kiso)) {
        if (typeof version === "string") project.kiso[name] = version; else skipped.push(`kiso.${name} (invalid value)`);
      }
    } else skipped.push("kiso (invalid value)");
  }
  for (const [name, target, value] of [["appearance", project.appearance, appearance], ["structure", project.structure, structure]] as const) {
    if (value === undefined) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) { skipped.push(`${name} (invalid value)`); continue; }
    for (const [key, input] of Object.entries(value)) {
      if (name === "appearance" && key === "phone") {
        const phone = readPhone(options, input, skipped);
        if (Object.keys(phone).length) project.appearance.phone = phone;
        continue;
      }
      const expected = (fieldClass as Record<string, string>)[key];
      if (!expected || expected === "galleryOnly" || key.startsWith("phone") || !Object.hasOwn(options, key)) skipped.push(`${name}.${key} (unknown setting)`);
      else if (expected !== name) skipped.push(`${name}.${key} (wrong section)`);
      else {
        const checked = readFieldValue(options, key, input);
        if (checked === null) skipped.push(`${name}.${key} (invalid value)`);
        else (target as Record<string, string>)[key] = checked;
      }
    }
  }
  if (tui !== undefined) project.tui = readTui(tui, skipped);
  if (demos !== undefined) {
    const result: DemoOptions = {};
    if (!demos || typeof demos !== "object" || Array.isArray(demos)) skipped.push("demos (invalid value)");
    else readDemos(demos as Record<string, unknown>, schema, result, skipped);
    if (Object.keys(result).length) project.demos = result;
  }
  return project;
}

function projectSettings(project: ProjectConfig, defaults: AppearanceSettings) {
  const settings = { ...defaults } as unknown as Record<string, string>;
  for (const section of [project.appearance, project.structure]) {
    for (const [key, value] of Object.entries(section)) {
      if (key === "phone") {
        for (const [name, override] of Object.entries(value as Record<string, string>)) settings[`phone${name[0].toUpperCase()}${name.slice(1)}`] = override;
      } else settings[key] = value as string;
    }
  }
  return settings as unknown as AppearanceSettings;
}

export function shareText(settings: AppearanceSettings, _source: Source, demos: DemoOptions = {}) {
  return settingsText(settings, demos);
}

// Copied settings leave the gallery, where its defaults are unknown and Kiso's
// own defaults differ (cornerSize is medium there), so they carry every value.
export function settingsText(settings: AppearanceSettings, demos: DemoOptions = {}) {
  return JSON.stringify({ v: shareVersion, s: settings, ...setDemos(demos) });
}

export function shareCode(settings: AppearanceSettings, source: Source, demos: DemoOptions = {}) {
  return toBase64Url(shareText(settings, source, demos));
}

export function shareLink(settings: AppearanceSettings, source: Source, demos: DemoOptions = {}, base = window.location.href) {
  const url = new URL(base);
  url.search = "";
  url.searchParams.set(shareParam, shareCode(settings, source, demos));
  return url.toString();
}

// Accepts a share link, a bare code or the copied JSON.
export function readShare(input: string, { defaults, options }: Source, schema: DemoSchema = {}): ShareResult {
  const fail = (error: string): ShareResult => ({ settings: null, demos: {}, skipped: [], error });
  let text = input.trim();
  if (!text) return fail("Nothing to apply.");
  try {
    if (!text.startsWith("{")) {
      const match = /[?&#]appearance=([^&#\s]*)/.exec(text);
      text = fromBase64Url(decodeURIComponent(match ? match[1] : text));
    }
  } catch {
    return fail("The code is not valid.");
  }
  let data: unknown;
  try { data = JSON.parse(text); } catch { return fail("The code is not valid."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) return fail("The code is not valid.");
  const { v, s, ...rest } = data as { v?: unknown; s?: unknown; [scope: string]: unknown };
  if (v === projectShareVersion) {
    const skipped: string[] = [];
    const project = readProject(data as Record<string, unknown>, options, schema, skipped);
    return { settings: projectSettings(project, defaults), demos: project.demos ?? {}, skipped, project };
  }
  if (!s || typeof s !== "object" || Array.isArray(s)) return fail("The code has no settings.");
  const skipped: string[] = [];
  if (v !== 1 && v !== shareVersion) skipped.push("version (made by another release)");
  const settings = { ...defaults, shadowStyle: v === 1 ? "auto" : "none" } as Record<string, string>;
  const entries = Object.entries(s);
  // Links made before line and fill were split carry one chart style preset.
  const preset = chartPresets[(s as Record<string, unknown>).chartStyle as string];
  if (preset) {
    entries.splice(entries.findIndex(([key]) => key === "chartStyle"), 1);
    if (!Object.hasOwn(s, "chartLine")) entries.push(["chartLine", preset.line]);
    if (!Object.hasOwn(s, "chartFill")) entries.push(["chartFill", preset.fill]);
  }
  for (const [key, value] of entries) {
    const values = Object.hasOwn(options, key) ? options[key as keyof AppearanceSettings] : undefined;
    if (!values) skipped.push(`${key} (unknown setting)`);
    else if (typeof value !== "string" || !values.includes(value)) skipped.push(`${key} (invalid value)`);
    else settings[key] = value;
  }
  const demos: DemoOptions = {};
  readDemos(rest, schema, demos, skipped);
  return { settings: settings as unknown as AppearanceSettings, demos, skipped };
}

function readDemos(input: Record<string, unknown>, schema: DemoSchema, demos: DemoOptions, skipped: string[]) {
  for (const [scope, values] of Object.entries(input)) {
    const accepted = Object.hasOwn(schema, scope) ? schema[scope] : undefined;
    if (!accepted || !values || typeof values !== "object" || Array.isArray(values)) {
      skipped.push(`${scope} (unknown setting)`);
      continue;
    }
    demos[scope] = {};
    for (const [key, value] of Object.entries(values)) {
      const allowed = Object.hasOwn(accepted, key) ? accepted[key] : undefined;
      if (!allowed) skipped.push(`${scope}.${key} (unknown setting)`);
      else if (typeof value !== "string" || !allowed.includes(value)) skipped.push(`${scope}.${key} (invalid value)`);
      else demos[scope][key] = value;
    }
  }
}
