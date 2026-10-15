import type { Accent, ChartStyle } from "@momoi-labs/kiso-react";

export type BorderStyle = "solid" | "none" | "rail" | "dash" | "bevel" | "double" | "base" | "offset" | "manga" | "brush";
export type CornerStyle = "square" | "rounded" | "asym" | "pixel";
export type CornerMarks = "none" | "ticks" | "brackets" | "arcs" | "dots" | "diagonal";
export type Size = "off" | "small" | "medium" | "large";
export type MarkSize = Exclude<Size, "off">;
export interface AppearanceSettings {
  theme: string;
  accent: Accent;
  chartStyle: ChartStyle;
  borderStyle: BorderStyle;
  cornerStyle: CornerStyle;
  cornerMarks: CornerMarks;
  cornerSize: Size;
  markSize: MarkSize;
  visualStyle: "default" | "editorial";
  appShell: "default" | "inset";
  appShellOuter: "auto" | "full" | "compact" | "none";
  outerBorderStyle: "inherit" | BorderStyle;
  outerCornerStyle: "inherit" | CornerStyle;
  outerCornerMarks: "inherit" | CornerMarks;
  frameScope: "all" | "panels" | "outer";
  markScope: "panels" | "all" | "outer";
  markClearance: "normal" | "sheet";
  backgroundStyle: "solid" | "dots" | "grid" | "crosses" | "construction" | "guides" | "fibers" | "momoi" | "momoi-repeat";
  backgroundStrength: "quiet" | "visible";
  backgroundPlacement: "both" | "inside" | "outside";
  frameDetail: MarkSize;
  paperTone: "theme" | "accent";
  panelFill: "solid" | "translucent";
  phoneBackgroundStyle: "inherit" | AppearanceSettings["backgroundStyle"];
  phoneBorderStyle: "inherit" | BorderStyle;
  phoneCornerStyle: "inherit" | CornerStyle;
  phoneCornerMarks: "inherit" | CornerMarks;
  phonePanelFill: "inherit" | AppearanceSettings["panelFill"];
}

declare global {
  interface Window {
    kisoAppearance: {
      defaults: AppearanceSettings;
      read: () => AppearanceSettings;
      save: (settings: AppearanceSettings) => AppearanceSettings;
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
    html: `<html lang="en"\n${attributes.map(([name, value]) => `  ${name}="${value}"`).join("\n")}\n>\n  <!-- Your application -->${hasPhone ? "\n  <!-- Phone overrides need the JavaScript version. -->" : ""}\n</html>`,
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
    accent: pick(["violet", "terracotta", "teal", "cobalt", "nocturne", "tangerine", "red", "gold", "lime"]),
    chartStyle: pick(["solid", "pixel", "halftone", "rounded"]),
    borderStyle: inner.border, cornerStyle: inner.corner, cornerMarks: inner.marks,
    cornerSize: pick(["small", "medium", "large"]), markSize: pick(["small", "medium", "large"]),
    visualStyle: pick(["default", "editorial"]), appShell: pick(["default", "inset"]),
    frameScope: pick(["outer", "panels", "all"]), markScope: pick(["outer", "panels", "all"]),
    markClearance: pick(["normal", "sheet"]),
    backgroundStyle: pick(["solid", "dots", "grid", "crosses", "construction", "guides", "fibers", "momoi", "momoi-repeat"]),
    backgroundStrength: pick(["quiet", "visible"]), backgroundPlacement: pick(["inside", "outside", "both"]),
    frameDetail: pick(["small", "medium", "large"]), paperTone: pick(["theme", "accent"]), panelFill: pick(["solid", "translucent"]),
    outerBorderStyle: outer?.border ?? "inherit", outerCornerStyle: outer?.corner ?? "inherit", outerCornerMarks: outer?.marks ?? "inherit",
  };
}
