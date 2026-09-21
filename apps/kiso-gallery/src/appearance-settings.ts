import type { Accent } from "@momoi-labs/kiso-react";

export type BorderStyle = "square" | "soft" | "round" | "asym" | "rail" | "dash" | "bevel" | "double" | "base" | "offset";
export type CornerMarks = "none" | "ticks" | "brackets" | "arcs" | "dots";
export type Size = "off" | "small" | "medium" | "large";
export type MarkSize = Exclude<Size, "off">;
export interface AppearanceSettings {
  theme: string;
  accent: Accent;
  borderStyle: BorderStyle;
  cornerMarks: CornerMarks;
  cornerSize: Size;
  markSize: MarkSize;
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
  const attributes = [
    ...(settings.theme === "system" ? [] : [["data-theme", settings.theme]]),
    ["data-accent", settings.accent],
    ["data-border-style", settings.borderStyle],
    ["data-corner-marks", settings.cornerMarks],
    ["data-corner-size", settings.cornerSize],
    ["data-mark-size", settings.markSize],
  ];
  return {
    html: `<html lang="en"\n${attributes.map(([name, value]) => `  ${name}="${value}"`).join("\n")}\n>\n  <!-- Your application -->\n</html>`,
    javascript: `const appearance = ${JSON.stringify(settings, null, 2)};\n\nconst { theme, ...attributes } = appearance;\nconst root = document.documentElement;\n\nif (theme === "system") {\n  delete root.dataset.theme;\n} else {\n  root.dataset.theme = theme;\n}\nObject.assign(root.dataset, attributes);`,
  };
}
