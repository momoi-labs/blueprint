import type { AppearanceSettings } from "./appearance-settings";

const chartPresets: Record<string, { line: string; fill: string }> = {
  solid: { line: "straight", fill: "none" },
  pixel: { line: "stepped", fill: "none" },
  halftone: { line: "straight", fill: "dots" },
  rounded: { line: "curved", fill: "none" },
};

// A shared look is `{ v: 1, s: { ...settings that differ from the defaults } }`.
// A link carries it as base64url JSON in the `appearance` query parameter.
// The hash already holds the gallery route, so the code cannot live there.
export const shareVersion = 1;
export const shareParam = "appearance";

type Source = Pick<Window["kisoAppearance"], "defaults" | "options">;
export interface ShareResult {
  settings: AppearanceSettings | null;
  skipped: string[];
  error?: string;
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

export function shareText(settings: AppearanceSettings, { defaults }: Source) {
  const changed = Object.fromEntries(Object.entries(settings).filter(([key, value]) => value !== defaults[key as keyof AppearanceSettings]));
  return JSON.stringify({ v: shareVersion, s: changed });
}

// Copied settings leave the gallery, where its defaults are unknown and Kiso's
// own defaults differ (cornerSize is medium there), so they carry every value.
export function settingsText(settings: AppearanceSettings) {
  return JSON.stringify({ v: shareVersion, s: settings });
}

export function shareCode(settings: AppearanceSettings, source: Source) {
  return toBase64Url(shareText(settings, source));
}

export function shareLink(settings: AppearanceSettings, source: Source, base = window.location.href) {
  const url = new URL(base);
  url.search = "";
  url.searchParams.set(shareParam, shareCode(settings, source));
  return url.toString();
}

// Accepts a share link, a bare code or the copied JSON.
export function readShare(input: string, { defaults, options }: Source): ShareResult {
  const fail = (error: string): ShareResult => ({ settings: null, skipped: [], error });
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
  const { v, s } = data as { v?: unknown; s?: unknown };
  if (!s || typeof s !== "object" || Array.isArray(s)) return fail("The code has no settings.");
  const skipped: string[] = [];
  if (v !== shareVersion) skipped.push("version (made by another release)");
  const settings = { ...defaults } as Record<string, string>;
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
  return { settings: settings as unknown as AppearanceSettings, skipped };
}
