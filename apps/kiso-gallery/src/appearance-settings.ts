import type { Accent, ChartFill, ChartLayout, ChartLegendPlacement, ChartLine } from "@momoi-labs/kiso-react";

export type BorderStyle = "solid" | "none" | "rail" | "dash" | "bevel" | "double" | "base" | "offset" | "manga" | "brush";
export type ShadowStyle = "none" | "hard" | "soft" | "auto";
export type CornerStyle = "square" | "rounded" | "asym" | "pixel";
export type CornerMarks = "none" | "ticks" | "brackets" | "arcs" | "dots" | "diagonal";
export type Size = "off" | "small" | "medium" | "large";
export type MarkSize = Exclude<Size, "off">;
export interface AppearanceSettings {
  theme: string;
  accent: Accent;
  neutral: "warm" | "zinc";
  primary: "accent" | "contrast";
  typeface: "inter" | "dm-sans";
  chartLine: ChartLine;
  chartFill: ChartFill;
  chartLayout: ChartLayout;
  chartLegend: ChartLegendPlacement;
  borderStyle: BorderStyle;
  shadowStyle: ShadowStyle;
  cornerStyle: CornerStyle;
  cornerMarks: CornerMarks;
  cornerSize: Size;
  markSize: MarkSize;
  visualStyle: "default" | "editorial";
  appShell: "default" | "inset";
  headerVariant: "default" | "plain" | "floating";
  headerSize: "compact" | "default" | "editorial";
  headerWidth: "page" | "outset";
  appShellOuter: "auto" | "full" | "compact" | "none";
  shellBottom: "default" | "fill";
  shellBottomStyle: "none" | "fade";
  brandBar: "separate" | "full";
  pageWidth: "full" | "contained";
  pageAlign: "start" | "center" | "end";
  outerShadowStyle: "inherit" | ShadowStyle;
  outerBorderStyle: "inherit" | BorderStyle;
  outerCornerStyle: "inherit" | CornerStyle;
  outerCornerMarks: "inherit" | CornerMarks;
  frameScope: "all" | "panels" | "outer";
  markScope: "panels" | "all" | "outer";
  markClearance: "normal" | "sheet";
  backgroundStyle: "solid" | "dots" | "grid" | "crosses" | "construction" | "guides" | "fibers" | "momoi" | "momoi-repeat" | "enso" | "checker" | "glow" | "stripes" | "rings";
  backgroundStrength: "quiet" | "visible";
  backgroundPlacement: "both" | "inside" | "outside";
  frameDetail: MarkSize;
  paperTone: "theme" | "accent";
  panelFill: "solid" | "translucent" | "glass";
  landingBands: "inside" | "full";
  phoneBackgroundStyle: "inherit" | AppearanceSettings["backgroundStyle"];
  phoneShadowStyle: "inherit" | ShadowStyle;
  phoneBorderStyle: "inherit" | BorderStyle;
  phoneCornerStyle: "inherit" | CornerStyle;
  phoneCornerMarks: "inherit" | CornerMarks;
  phonePanelFill: "inherit" | AppearanceSettings["panelFill"];
}

const mainOptions = {
  theme: ["system", "light", "dark"],
  accent: ["violet", "terracotta", "teal", "cobalt", "nocturne", "tangerine", "red", "gold", "lime", "plum", "stone", "steel", "snes", "pine"],
  neutral: ["warm", "zinc"],
  primary: ["accent", "contrast"],
  typeface: ["inter", "dm-sans"],
  chartLine: ["straight", "stepped", "curved"],
  chartFill: ["none", "dots", "tint", "squares", "scanlines"],
  chartLayout: ["standard", "compact", "split"],
  chartLegend: ["table", "inline", "sidebar"],
  shadowStyle: ["none", "hard", "soft", "auto"],
  borderStyle: ["solid", "none", "rail", "dash", "bevel", "double", "base", "offset", "manga", "brush"],
  cornerStyle: ["square", "rounded", "asym", "pixel"],
  cornerMarks: ["ticks", "none", "brackets", "arcs", "dots", "diagonal"],
  cornerSize: ["medium", "small", "large", "off"],
  markSize: ["medium", "small", "large"],
  visualStyle: ["default", "editorial"],
  appShell: ["default", "inset"],
  headerVariant: ["default", "plain", "floating"],
  headerSize: ["default", "compact", "editorial"],
  headerWidth: ["page", "outset"],
  appShellOuter: ["auto", "full", "compact", "none"],
  shellBottom: ["default", "fill"],
  shellBottomStyle: ["none", "fade"],
  brandBar: ["separate", "full"],
  pageWidth: ["full", "contained"],
  pageAlign: ["start", "center", "end"],
  frameScope: ["all", "panels", "outer"],
  markScope: ["panels", "all", "outer"],
  markClearance: ["normal", "sheet"],
  backgroundStyle: ["solid", "dots", "grid", "crosses", "construction", "guides", "fibers", "momoi", "momoi-repeat", "enso", "checker", "glow", "stripes", "rings"],
  backgroundStrength: ["quiet", "visible"],
  backgroundPlacement: ["both", "inside", "outside"],
  frameDetail: ["medium", "small", "large"],
  paperTone: ["theme", "accent"],
  panelFill: ["solid", "translucent", "glass"],
  landingBands: ["inside", "full"],
};
const outerKeys = ["borderStyle", "cornerStyle", "cornerMarks", "shadowStyle"] as const;
export const phoneKeys = ["backgroundStyle", "borderStyle", "cornerStyle", "cornerMarks", "panelFill", "shadowStyle"] as const;
const capital = (key: string) => key[0].toUpperCase() + key.slice(1);

export const appearanceOptions = {
  ...mainOptions,
  ...Object.fromEntries(outerKeys.map(key => [`outer${capital(key)}`, ["inherit", ...mainOptions[key]]])),
  ...Object.fromEntries(phoneKeys.map(key => [`phone${capital(key)}`, ["inherit", ...mainOptions[key]]])),
} as Record<keyof AppearanceSettings, string[]>;

export const presetDefaults = {
  ...Object.fromEntries(Object.entries(appearanceOptions).map(([key, values]) => [key, values[0]])),
  cornerStyle: "pixel", cornerSize: "small", appShell: "inset", backgroundStyle: "fibers", visualStyle: "editorial",
} as unknown as AppearanceSettings;

export const appearanceDefaults = {
  ...presetDefaults,
  theme: "system", accent: "snes", chartLine: "straight", chartFill: "none", chartLayout: "standard", chartLegend: "table", shadowStyle: "soft", borderStyle: "solid", cornerStyle: "rounded", cornerMarks: "none", cornerSize: "large", markSize: "medium", visualStyle: "default", appShell: "inset", headerVariant: "floating", headerSize: "default", headerWidth: "page", appShellOuter: "full", pageWidth: "contained", pageAlign: "center", frameScope: "all", markScope: "panels", markClearance: "normal", backgroundStyle: "glow", backgroundStrength: "quiet", backgroundPlacement: "both", frameDetail: "medium", paperTone: "theme", panelFill: "glass", outerBorderStyle: "none", outerCornerStyle: "square", outerCornerMarks: "none", outerShadowStyle: "none", phoneBackgroundStyle: "inherit", phoneBorderStyle: "inherit", phoneCornerStyle: "inherit", phoneCornerMarks: "inherit", phonePanelFill: "inherit", phoneShadowStyle: "inherit", landingBands: "full",
} as unknown as AppearanceSettings;

declare global {
  interface Window {
    kisoAppearance: {
      defaults: AppearanceSettings;
      presetDefaults: AppearanceSettings;
      options: Record<keyof AppearanceSettings, readonly string[]>;
      read: () => AppearanceSettings;
      save: (settings: AppearanceSettings) => AppearanceSettings;
      apply: (settings: AppearanceSettings) => AppearanceSettings;
    };
  }
}

export function appearanceCode(settings: AppearanceSettings) {
  const main = Object.fromEntries(Object.entries(settings).filter(([name]) => !name.startsWith("phone")));
  // Phone overrides keep their main-style names, so they replace those values.
  const phone = Object.fromEntries(Object.entries(settings)
    .filter(([name, value]) => name.startsWith("phone") && value !== "inherit")
    .map(([name, value]) => [name[5].toLowerCase() + name.slice(6), value]));
  const attributes = Object.entries(main)
    .filter(([name, value]) => name !== "theme" || value !== "system")
    .map(([name, value]) => [`data-${name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value]);
  const assign = `if (theme === "system") {\n  delete root.dataset.theme;\n} else {\n  root.dataset.theme = theme;\n}\nObject.assign(root.dataset, attributes);`;
  const hasPhone = Object.keys(phone).length > 0;
  return {
    html: `<html lang="en"\n${attributes.map(([name, value]) => `  ${name}="${value}"`).join("\n")}\n>\n  <div class="card">
    <span class="panel-shadow" aria-hidden="true"><span><span></span></span><span></span></span>
    <!-- Your panel content -->
  </div>${hasPhone ? "\n  <!-- Phone overrides need the JavaScript version. -->" : ""}\n</html>`,
    javascript: hasPhone
      ? `const appearance = ${JSON.stringify(main, null, 2)};\n\n// Below 700px wide these replace the main values.\nconst phone = ${JSON.stringify(phone, null, 2)};\nconst phoneQuery = matchMedia("(max-width: 699px)");\nconst root = document.documentElement;\n\nfunction apply() {\n  const { theme, ...attributes } = phoneQuery.matches ? { ...appearance, ...phone } : appearance;\n${assign.replace(/^/gm, "  ")}\n}\napply();\nphoneQuery.addEventListener("change", apply);`
      : `const appearance = ${JSON.stringify(main, null, 2)};\n\nconst { theme, ...attributes } = appearance;\nconst root = document.documentElement;\n\n${assign}`,
  };
}

export function randomAppearance(current: AppearanceSettings, random = Math.random): AppearanceSettings {
  const pick = <T,>(values: readonly T[]): T => values[Math.floor(random() * values.length)];
  const frame = () => {
    const corner = pick<CornerStyle>(["square", "rounded", "asym", "pixel"]);
    const border = pick<BorderStyle>(corner === "pixel" ? ["solid", "none"] : ["solid", "none", "rail", "dash", "double", "base", "offset", "manga", "brush"]);
    const expressive = border === "manga" || border === "brush";
    const marks = pick<CornerMarks>(["none", "ticks", "brackets", "arcs", "diagonal"].filter(mark =>
      !(mark === "arcs" && (expressive || corner === "pixel")) && !(mark === "brackets" && border === "brush"),
    ) as CornerMarks[]);
    return { border, corner: expressive ? "square" as const : corner, marks };
  };
  const inner = frame();
  const outer = random() < .5 ? null : frame();
  return {
    ...current,
    accent: pick(["violet", "terracotta", "teal", "cobalt", "nocturne", "tangerine", "red", "gold", "lime", "plum", "stone", "steel", "snes", "pine"]),
    chartLine: pick(["straight", "stepped", "curved"]),
    chartFill: pick(["none", "dots", "tint", "squares", "scanlines"]),
    chartLayout: pick(["standard", "compact", "split"]),
    chartLegend: pick(["table", "inline", "sidebar"]),
    shadowStyle: pick(["none", "hard", "soft"]), borderStyle: inner.border, cornerStyle: inner.corner, cornerMarks: inner.marks,
    cornerSize: pick(["small", "medium", "large"]), markSize: pick(["small", "medium", "large"]),
    visualStyle: pick(["default", "editorial"]), appShell: pick(["default", "inset"]),
    frameScope: pick(["outer", "panels", "all"]), markScope: pick(["outer", "panels", "all"]),
    markClearance: pick(["normal", "sheet"]),
    backgroundStyle: pick(["solid", "dots", "grid", "crosses", "construction", "guides", "fibers", "momoi", "momoi-repeat", "enso", "checker", "glow", "stripes", "rings"]),
    backgroundStrength: pick(["quiet", "visible"]), backgroundPlacement: pick(["inside", "outside", "both"]),
    frameDetail: pick(["small", "medium", "large"]), paperTone: pick(["theme", "accent"]), panelFill: pick(["solid", "translucent", "glass"]),
    shellBottom: pick(["default", "fill"]), shellBottomStyle: pick(["none", "fade"]),
    outerShadowStyle: "inherit", outerBorderStyle: outer?.border ?? "inherit", outerCornerStyle: outer?.corner ?? "inherit", outerCornerMarks: outer?.marks ?? "inherit",
  };
}
