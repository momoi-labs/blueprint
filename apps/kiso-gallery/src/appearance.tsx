import { Fragment, useId, useState, type ReactNode } from "react";
import { AccentSelector, Button, Disclosure, RadioGroup, RadioGroupItem, ThemeSelector } from "@momoi-labs/kiso-react";
import { chartFillOptions, chartLayoutOptions, chartLegendOptions, chartLineOptions } from "../../../kiso/blocks/react-prototype/src/chart-style-options";
import type { AppearanceSettings, BorderStyle, CornerStyle, CornerMarks, MarkSize, Size } from "./appearance-settings";
import { randomAppearance } from "./appearance-settings";
import { BackgroundPreview, PanelPreview } from "./appearance-previews";

const borders: { value: BorderStyle; label: string; description: string }[] = [
  { value: "solid", label: "Solid", description: "A single outline" },
  { value: "none", label: "None", description: "No panel outline or marks" },
  { value: "rail", label: "Side rail", description: "A stronger left edge" },
  { value: "dash", label: "Dashed outline", description: "Short dashes around the panel" },
  { value: "double", label: "Double outline", description: "Two lines, set close together" },
  { value: "base", label: "Weighted base", description: "A stronger bottom edge" },
  { value: "offset", label: "Offset outline", description: "A down-right frame direction" },
];
const expressiveBorders: typeof borders = [
  { value: "manga", label: "Manga panel", description: "An angled, heavy ink outline" },
  { value: "brush", label: "Brush frame", description: "An irregular ink outline" },
];
borders.push(...expressiveBorders);
const corners: { value: CornerStyle; label: string; description: string }[] = [
  { value: "square", label: "Square", description: "Straight panels, and controls when frames include them" },
  { value: "rounded", label: "Rounded", description: "Even curves at every corner" },
  { value: "asym", label: "Asymmetric", description: "Two opposite, wider corners" },
  { value: "pixel", label: "Pixel classic", description: "Two crisp steps at each corner" },
];
const marks: { value: CornerMarks; label: string }[] = [
  { value: "none", label: "None" },
  { value: "ticks", label: "Original ticks" },
  { value: "brackets", label: "Outer brackets" },
  { value: "arcs", label: "Curved brackets" },
  { value: "diagonal", label: "Diagonal ticks" },
];
const sizes: Size[] = ["off", "small", "medium", "large"];

const markSizes: MarkSize[] = ["small", "medium", "large"];

const compositions: { label: string; settings: Partial<AppearanceSettings> }[] = [
  { label: "Kiso classic", settings: { shadowStyle: "soft", theme: "system", appShell: "default" } },
  { label: "Blueprint", settings: { shadowStyle: "hard", accent: "cobalt", paperTone: "accent", backgroundStyle: "guides", backgroundPlacement: "inside", outerBorderStyle: "double" } },
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

const sameLook = (look: AppearanceSettings, settings: AppearanceSettings) =>
  Object.keys(look).every(key => key === "theme" || look[key as keyof AppearanceSettings] === settings[key as keyof AppearanceSettings]);

export function presetLooks() {
  const base = { ...window.kisoAppearance.presetDefaults, cornerStyle: "square", cornerSize: "medium", backgroundStyle: "solid", visualStyle: "default", appShell: "inset", frameScope: "panels" } as AppearanceSettings;
  return compositions.map(({ label, settings }) => ({ label, look: { ...base, ...settings } }));
}

export function presetName(settings: AppearanceSettings) {
  return presetLooks().find(preset => sameLook(preset.look, settings))?.label ?? "Custom";
}

export function VisualSelector<T extends string>({ label, value, options, onChange, preview, disabled = false, disabledOptions = [], layout = "compact" }: {
  label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void;
  preview: (value: T) => ReactNode; disabled?: boolean; disabledOptions?: readonly T[]; layout?: "compact" | "wide" | "scope";
}) {
  const name = useId();
  return <fieldset className="appearance-choices" disabled={disabled}>
    <legend className="t-label">{label}</legend>
    <div className={`appearance-options appearance-options-${layout}`}>
      {options.map(([key, text]) => <label className="appearance-option" key={key}>
        <input type="radio" name={name} value={key} checked={value === key} disabled={disabledOptions.includes(key)} onChange={() => onChange(key)} />
        <span className="appearance-option-body">
          {preview(key)}
          <span className="t-label">{text}</span>
        </span>
      </label>)}
    </div>
  </fieldset>;
}

function Segmented<T extends string>({ label, value, onChange, options, names, disabledOptions = [] }: {
  label: string; value: T; onChange: (value: T) => void; options: readonly T[];
  names?: Partial<Record<T, string>>; disabledOptions?: readonly T[];
}) {
  return <RadioGroup label={label} variant="segmented" value={value} onValueChange={next => onChange(next as T)}>
    {options.map(option => <RadioGroupItem key={option} value={option} label={names?.[option] ?? option[0].toUpperCase() + option.slice(1)} disabled={disabledOptions.includes(option)} />)}
  </RadioGroup>;
}

type SketchPart = "shell" | "header" | "page";
function LayoutSketch({ settings, onJump }: { settings: AppearanceSettings; onJump?: (part: SketchPart) => void }) {
  const inset = settings.appShell === "inset";
  const margin = inset ? { auto: 4, full: 4, compact: 2, none: 0 }[settings.appShellOuter] : 0;
  const x = 4 + margin;
  const y = 4 + margin;
  const width = 112 - 2 * margin;
  const height = 72 - 2 * margin;
  const bar = { compact: 6, default: 9, editorial: 14 }[settings.headerSize];
  const contained = settings.pageWidth === "contained";
  const pageWidth = contained ? width * 0.6 : width - 8;
  const pageX = contained ? { start: x + 4, center: x + (width - pageWidth) / 2, end: x + width - pageWidth - 4 }[settings.pageAlign] : x + 4;
  const barWidth = settings.headerWidth === "page" ? pageWidth : width;
  const barX = settings.headerWidth === "page" ? pageX : x;
  const floating = settings.headerVariant === "floating";
  const plain = settings.headerVariant === "plain";
  const barY = floating ? y + 3 : y;
  const barRadius = floating ? 2 : 0;
  const part = (id: SketchPart, label: string, children: ReactNode) => onJump
    ? <g className="appearance-sketch-part" role="button" tabIndex={0} aria-label={`${label} settings`} data-part={id}
      onClick={() => onJump(id)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onJump(id); } }}>
      <title>{label}</title>{children}
    </g>
    : <>{children}</>;
  return <svg className="appearance-sketch" viewBox="0 0 120 80" role={onJump ? "group" : "img"} aria-label={onJump ? "Layout sketch. Choose a part to go to its settings." : "Layout sketch"} focusable="false">
    {part("shell", "Shell", <>
      <rect className="appearance-sketch-frame" x="0.5" y="0.5" width="119" height="79" rx="2" />
      <rect className="appearance-sketch-main" x={x} y={y} width={width} height={height} rx={inset ? 2 : 0} />
    </>)}
    {part("header", "Header", <>
      {floating && <rect x={barX + 1} y={barY + 1.5} width={barWidth - 2} height={bar} rx="2" fill="currentColor" opacity=".18" />}
      <rect className={plain ? "appearance-sketch-line" : "appearance-sketch-bar"} x={barX + (floating ? 1 : 0)} y={barY} width={barWidth - (floating ? 2 : 0)} height={bar} rx={barRadius} strokeDasharray={plain ? "2 2" : undefined} />
    </>)}
    {part("page", "Page", <>
      <rect className="appearance-sketch-line" x={pageX} y={y + bar + 8} width={pageWidth} height={height - bar - 14} rx="1" />
      <path className="appearance-sketch-line" d={`M${pageX + 4} ${y + bar + 14}h${pageWidth * 0.5}M${pageX + 4} ${y + bar + 20}h${pageWidth * 0.7}`} />
    </>)}
  </svg>;
}

function AppearanceSection({ title, icon, collapsed = false, children, id: sectionId }: { title: string; icon?: ReactNode; collapsed?: boolean; children: ReactNode; id?: string }) {
  const id = useId();
  const heading = <>{icon}{title}</>;
  return <section className="appearance-section" aria-labelledby={id} id={sectionId}>
    {collapsed ? <Disclosure summary={<span id={id} className="t-caps">{heading}</span>}>{children}</Disclosure>
      : <><h3 id={id} className="t-caps">{heading}</h3>{children}</>}
  </section>;
}

export type AppearanceSectionId = "presets" | "colors" | "sketch" | "shell" | "header" | "page" | "gallery" | "panels" | "marks" | "scope" | "outer" | "background" | "charts" | "phone";

const phoneKeys = ["phoneShadowStyle", "phoneBackgroundStyle", "phoneBorderStyle", "phoneCornerStyle", "phoneCornerMarks", "phonePanelFill"] as const;
const isExpressive = (border: string) => border === "manga" || border === "brush";

export function AppearanceControls({ settings, onChange, sections: shown, collapsed = [], icons, idPrefix, onJump, galleryOnly = false, phoneHint = "Layouts > Phone shows the result." }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  sections: readonly AppearanceSectionId[];
  collapsed?: readonly AppearanceSectionId[];
  icons?: Partial<Record<AppearanceSectionId, ReactNode>>;
  idPrefix?: string;
  onJump?: (part: SketchPart) => void;
  galleryOnly?: boolean;
  phoneHint?: string;
}) {
  const borderName = useId();
  const cornerName = useId();
  const markName = useId();
  const backgroundName = useId();
  const [phoneChosen, setPhoneChosen] = useState(false);
  const phoneOverride = phoneChosen || phoneKeys.some(key => settings[key] !== "inherit");
  const borderOptions = settings.borderStyle === "bevel" ? [...borders, { value: "bevel" as const, label: "Inset edge (legacy)", description: "Saved appearance. Replace to leave the legacy style." }] : borders;
  const markOptions = settings.cornerMarks === "dots" ? [...marks, { value: "dots" as const, label: "Corner dots (legacy)" }] : marks;
  const pixelBorder = (border: string) => ["solid", "none", "manga", "brush"].includes(border);
  const incompatibleMark = (mark: string, border: string, corner: string) =>
    (mark === "arcs" && (isExpressive(border) || corner === "pixel")) || (mark === "brackets" && border === "brush");
  const outerBorder = settings.outerBorderStyle === "inherit" ? settings.borderStyle : settings.outerBorderStyle;
  const outerCorner = settings.outerCornerStyle === "inherit" ? settings.cornerStyle : settings.outerCornerStyle;
  const outerMark = settings.outerCornerMarks === "inherit" ? settings.cornerMarks : settings.outerCornerMarks;
  const phoneBorder = settings.phoneBorderStyle === "inherit" ? settings.borderStyle : settings.phoneBorderStyle;
  const phoneCorner = settings.phoneCornerStyle === "inherit" ? settings.cornerStyle : settings.phoneCornerStyle;
  const expressive = isExpressive(settings.borderStyle);
  const detailBorder = expressive ? settings.borderStyle : isExpressive(outerBorder) ? outerBorder : isExpressive(phoneBorder) ? phoneBorder : null;
  const sizedCorner = !expressive && settings.cornerStyle !== "square" ? settings.cornerStyle
    : !isExpressive(outerBorder) && outerCorner !== "square" ? outerCorner
    : !isExpressive(phoneBorder) && phoneCorner !== "square" ? phoneCorner : null;
  const phoneMark = settings.phoneCornerMarks === "inherit" ? settings.cornerMarks : settings.phoneCornerMarks;
  const phoneBackground = settings.phoneBackgroundStyle === "inherit" ? settings.backgroundStyle : settings.phoneBackgroundStyle;
  const backgrounds = [
    ["solid", "Solid"], ["dots", "Dot grid"], ["grid", "Fine grid"], ["crosses", "Cross grid"],
    ["construction", "Construction lines"], ["guides", "Drawing guides"], ["fibers", "Paper fibers"], ["momoi", "Momoi watermark"], ["momoi-repeat", "Momoi repeat"], ["enso", "Kiso enso"],
    ["checker", "Checker"], ["glow", "Glow"], ["stripes", "Stripes"], ["rings", "Rings"],
  ] as const;
  const diagramBackgrounds: readonly string[] = window.kisoAppearance.options.diagramBackgroundStyle;
  const pageDiagramBackground = diagramBackgrounds.includes(settings.backgroundStyle) || ["checker", "glow", "stripes"].includes(settings.backgroundStyle) ? settings.backgroundStyle : "dots";
  const sameNames = { inherit: "Same" } as const;
  const chartOptions = <T extends string>(options: readonly { value: T; label: string }[]) => ({
    values: options.map(option => option.value),
    names: Object.fromEntries(options.map(option => [option.value, option.label])) as Record<T, string>,
  });
  const line = chartOptions(chartLineOptions);
  const fill = chartOptions(chartFillOptions);
  const layout = chartOptions(chartLayoutOptions);
  const legend = chartOptions(chartLegendOptions);
  const head = (key: AppearanceSectionId) => ({ icon: icons?.[key], id: idPrefix && `${idPrefix}-${key}` });
  function choosePhone(next: string) {
    const override = next === "override";
    setPhoneChosen(override);
    if (!override) onChange(Object.fromEntries(phoneKeys.map(key => [key, "inherit"])));
  }
  const landingBands = <Segmented label="Landing bands" options={["inside", "full"] as const} names={{ inside: "Inside frame", full: "Full width" }} value={settings.landingBands} onChange={landingBands => onChange({ landingBands })} />;
  const sections: Record<AppearanceSectionId, ReactNode> = {
  presets: <AppearanceSection {...head("presets")} title="Presets" collapsed={collapsed.includes("presets")}>
    <p className="muted t-label" role="status">Current look: <strong>{presetName(settings)}</strong></p>
    <div className="appearance-presets">
      {presetLooks().map(({ label, look: next }) => {
        return <Button key={label} variant="ghost" className="appearance-composition" aria-pressed={sameLook(next, settings)} onClick={() => onChange({ ...next, theme: settings.theme })}>
          <span className="appearance-composition-preview" data-accent={next.accent} data-preview-tone={next.paperTone} aria-hidden="true">
            <BackgroundPreview background={next.backgroundStyle} tone={next.paperTone} />
            <PanelPreview shadow={next.outerShadowStyle === "inherit" ? next.shadowStyle : next.outerShadowStyle} border={next.outerBorderStyle === "inherit" ? next.borderStyle : next.outerBorderStyle} corner={next.outerCornerStyle === "inherit" ? next.cornerStyle : next.outerCornerStyle} marks={next.outerCornerMarks === "inherit" ? next.cornerMarks : next.outerCornerMarks} size={next.cornerSize} markSize={next.markSize} detail={next.frameDetail} />
          </span>
          <span>{label}</span>
        </Button>;
      })}
      <Button variant="ghost" className="appearance-composition" onClick={() => onChange(randomAppearance(settings))}>
        <span className="appearance-composition-preview" aria-hidden="true">
          <svg className="appearance-panel-preview" viewBox="0 0 80 56" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
            <rect x="16" y="14" width="48" height="28" rx="3" opacity=".6" />
            <path d="M35 23a5 5 0 0 1 10 0c0 4-5 3.5-5 8" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="36" r="1.5" fill="currentColor" stroke="none" />
            <path d="M10 9v8m-4-4h8M70 39v8m-4-4h8" />
          </svg>
        </span>
        <span>Random</span>
      </Button>
    </div>
  </AppearanceSection>,
  colors: <AppearanceSection {...head("colors")} title="Colors and type">
    <div className="appearance-colors">
      <ThemeSelector theme={settings.theme} onChange={theme => onChange({ theme })} />
      <AccentSelector preview={false} accent={settings.accent} onChange={accent => onChange({ accent })} />
      <Segmented label="Neutral" options={["warm", "zinc"] as const} value={settings.neutral} onChange={neutral => onChange({ neutral })} />
      <Segmented label="Primary action" options={["accent", "contrast"] as const} value={settings.primary} onChange={primary => onChange({ primary })} />
      <Segmented label="Typeface" options={["inter", "dm-sans"] as const} names={{ "dm-sans": "DM Sans" }} value={settings.typeface} onChange={typeface => onChange({ typeface })} />
      <Segmented label="Visual style" options={["default", "editorial"] as const} value={settings.visualStyle} onChange={visualStyle => onChange({ visualStyle })} />
    </div>
  </AppearanceSection>,
  sketch: <LayoutSketch settings={settings} onJump={onJump} />,
  shell: <AppearanceSection {...head("shell")} title="Shell">
    <Segmented label="Application frame" options={["default", "inset"] as const} value={settings.appShell} onChange={appShell => onChange({ appShell })} />
    {settings.appShell === "inset" && <>
      <Segmented label="Outer spacing" options={["auto", "full", "compact", "none"] as const} value={settings.appShellOuter} onChange={appShellOuter => onChange({ appShellOuter })} />
      <Segmented label="Shell bottom" options={["default", "fill"] as const} value={settings.shellBottom} onChange={shellBottom => onChange({ shellBottom })} />
      <Segmented label="Bottom style" options={["none", "fade"] as const} value={settings.shellBottomStyle} disabledOptions={settings.shellBottom === "fill" ? [] : ["none", "fade"]} onChange={shellBottomStyle => onChange({ shellBottomStyle })} />
      <Segmented label="Shell right" options={["default", "fill"] as const} value={settings.shellRight} onChange={shellRight => onChange({ shellRight })} />
      <Segmented label="Brand bar" options={["separate", "full"] as const} names={{ full: "Full row" }} value={settings.brandBar} onChange={brandBar => onChange({ brandBar })} />
      <p className="muted t-label">Brand bar changes app pages. The gallery has no brand bar.</p>
      {!galleryOnly && landingBands}
    </>}
  </AppearanceSection>,
  header: <AppearanceSection {...head("header")} title="Header">
    <Segmented label="Header" options={["default", "plain", "floating"] as const} value={settings.headerVariant} onChange={headerVariant => onChange({ headerVariant })} />
    <Segmented label="Header size" options={["compact", "default", "editorial"] as const} value={settings.headerSize} onChange={headerSize => onChange({ headerSize })} />
    <p className="muted t-label">Header changes the gallery header. App pages keep their own header.</p>
  </AppearanceSection>,
  gallery: <AppearanceSection {...head("gallery")} title="Gallery only">
    <p className="muted t-label">These choices change the gallery preview. The exported code leaves them out.</p>
    {landingBands}
    <p className="muted t-label">Landing bands change the gallery home page.</p>
  </AppearanceSection>,
  page: <AppearanceSection {...head("page")} title="Page">
    <Segmented label="Page width" options={["full", "contained"] as const} value={settings.pageWidth} onChange={pageWidth => onChange({ pageWidth })} />
    {settings.pageWidth === "contained" && <Segmented label="Page alignment" options={["start", "center", "end"] as const} value={settings.pageAlign} onChange={pageAlign => onChange({ pageAlign })} />}
    <p className="muted t-label">Page width changes gallery pages on a wide window. App pages use the full width.</p>
  </AppearanceSection>,
  panels: <AppearanceSection {...head("panels")} title="Panels">
    <fieldset className="appearance-choices">
      <legend className="t-label">Border style</legend>
      <div className="appearance-options">
        {borderOptions.map(border => <label className="appearance-option" key={border.value} title={border.description}>
          <input type="radio" name={borderName} value={border.value} checked={settings.borderStyle === border.value} disabled={settings.cornerStyle === "pixel" && !pixelBorder(border.value)} onChange={() => onChange({ borderStyle: border.value })} />
          <span className="appearance-option-body">
            <PanelPreview border={border.value} />
            <span className="t-label">{border.label}</span>
            <span className="appearance-option-description">{border.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    {detailBorder && <Segmented label="Border detail" options={markSizes} value={settings.frameDetail} onChange={frameDetail => onChange({ frameDetail })} />}
    <Segmented label="Panel shadow" value={settings.shadowStyle} options={["none", "hard", "soft"] as const} onChange={shadowStyle => onChange({ shadowStyle })} />
    {settings.shadowStyle === "auto" && <p className="muted t-label">This saved look uses legacy elevation. Choose None, Hard or Soft to set panel shadows independently.</p>}
    {!expressive && <fieldset className="appearance-choices">
      <legend className="t-label">Corner type</legend>
      <div className="appearance-options">
        {corners.map(corner => <label className="appearance-option" key={corner.value} title={corner.description}>
          <input type="radio" name={cornerName} value={corner.value} checked={settings.cornerStyle === corner.value} disabled={corner.value === "pixel" && !pixelBorder(settings.borderStyle)}
            onChange={() => onChange({ cornerStyle: corner.value, ...(corner.value !== "square" && settings.cornerSize === "off" ? { cornerSize: "medium" } : {}) })} />
          <span className="appearance-option-body">
            <PanelPreview corner={corner.value} />
            <span className="t-label">{corner.label}</span>
            <span className="appearance-option-description">{corner.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>}
    {sizedCorner && <Segmented label="Corner size" options={settings.cornerSize === "off" ? sizes : markSizes} disabledOptions={["off"]} value={settings.cornerSize} onChange={cornerSize => onChange({ cornerSize })} />}
    <Segmented label="Panel fill" options={["solid", "translucent", "glass"] as const} value={settings.panelFill} onChange={panelFill => onChange({ panelFill })} />
  </AppearanceSection>,
  marks: <AppearanceSection {...head("marks")} title="Corner marks">
    <fieldset className="appearance-choices">
      <legend className="t-label">Corner marks</legend>
      <div className="appearance-options">
        {markOptions.map(mark => <label className="appearance-option" key={mark.value}>
          <input type="radio" name={markName} value={mark.value} checked={settings.cornerMarks === mark.value} disabled={incompatibleMark(mark.value, settings.borderStyle, settings.cornerStyle)} onChange={() => onChange({ cornerMarks: mark.value })} />
          <span className="appearance-option-body">
            <PanelPreview marks={mark.value} corner={mark.value === "arcs" ? "rounded" : "square"} />
            <span className="t-label">{mark.label}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    <p className="muted t-label">Curved brackets do not pair with Pixel, Manga or Brush. Brush also excludes outer brackets. Unavailable choices remain saved.</p>
    {(settings.cornerMarks !== "none" || outerMark !== "none" || phoneMark !== "none") && <Segmented label="Mark size" options={markSizes} value={settings.markSize} onChange={markSize => onChange({ markSize })} />}
    <Segmented label="Mark clearance" options={["normal", "sheet"] as const} names={{ sheet: "Drawing sheet" }} value={settings.markClearance} onChange={markClearance => onChange({ markClearance })} />
  </AppearanceSection>,
  scope: <AppearanceSection {...head("scope")} title="Where it applies">
    <Segmented label="Apply frames to" options={["outer", "panels", "all"] as const} names={{ outer: "Outer only", panels: "With panels", all: "With controls" }} value={settings.frameScope} onChange={frameScope => onChange({ frameScope })} />
    <Segmented label="Apply marks to" options={["outer", "panels", "all"] as const} names={{ outer: "Outer only", panels: "With panels", all: "With controls" }} value={settings.markScope} onChange={markScope => onChange({ markScope })} />
    <Segmented label="Apply shadows to" options={["outer", "first", "all"] as const} names={{ outer: "Outer only", first: "First level", all: "All levels" }} value={settings.shadowScope} onChange={shadowScope => onChange({ shadowScope })} />
    <p className="muted t-label">Native controls use compact internal guides. With controls, badges, menus, tooltips and other small surfaces follow the control corners too.</p>
  </AppearanceSection>,
  outer: <AppearanceSection {...head("outer")} title="Outer frame style" collapsed={collapsed.includes("outer")}>
    <p className="muted t-label">Applies to the Inset application frame. Same follows the panels. Corner size, mark size and border detail are shared.</p>
    <Segmented label="Outer shadow" value={settings.outerShadowStyle} options={settings.outerShadowStyle === "auto" ? ["inherit", "none", "hard", "soft", "auto"] as const : ["inherit", "none", "hard", "soft"] as const}
      names={{ ...sameNames, auto: "Legacy elevation" }} onChange={outerShadowStyle => onChange({ outerShadowStyle })} />
    <VisualSelector disabledOptions={outerCorner === "pixel" ? borders.filter(b => !pixelBorder(b.value)).map(b => b.value) : []} label="Outer border" value={settings.outerBorderStyle} onChange={outerBorderStyle => onChange({ outerBorderStyle })}
      preview={border => <PanelPreview border={border === "inherit" ? settings.borderStyle : border} />}
      options={[["inherit", "Same as panels"], ...borders.map(b => [b.value, b.label] as [BorderStyle, string]), ...(settings.outerBorderStyle === "bevel" ? [["bevel", "Inset edge (legacy)"] as [BorderStyle, string]] : [])]} />
    {!isExpressive(outerBorder) && <VisualSelector disabledOptions={pixelBorder(outerBorder) ? [] : ["pixel"]} label="Outer corners" value={settings.outerCornerStyle} onChange={outerCornerStyle => onChange({ outerCornerStyle })}
      preview={corner => <PanelPreview corner={corner === "inherit" ? settings.cornerStyle : corner} />}
      options={[["inherit", "Same as panels"], ...corners.map(c => [c.value, c.label] as [CornerStyle, string])]} />}
    <VisualSelector disabledOptions={marks.filter(m => incompatibleMark(m.value, outerBorder, outerCorner)).map(m => m.value)} label="Outer marks" value={settings.outerCornerMarks} onChange={outerCornerMarks => onChange({ outerCornerMarks })}
      preview={mark => <PanelPreview marks={mark === "inherit" ? settings.cornerMarks : mark} />}
      options={[["inherit", "Same as panels"], ...marks.map(m => [m.value, m.label] as [CornerMarks, string]), ...(settings.outerCornerMarks === "dots" ? [["dots", "Corner dots (legacy)"] as [CornerMarks, string]] : [])]} />
    <p className="muted t-label">Outer marks change app pages. The gallery frame has no outer mark.</p>
  </AppearanceSection>,
  background: <AppearanceSection {...head("background")} title="Background">
    <fieldset className="appearance-choices">
      <legend className="t-label">Canvas background</legend>
      <div className="appearance-options">
        {backgrounds.map(([value, label]) => <label className="appearance-option" key={value}>
          <input type="radio" name={backgroundName} value={value} checked={settings.backgroundStyle === value} onChange={() => onChange({ backgroundStyle: value })} />
          <span className="appearance-option-body">
            <BackgroundPreview background={value} tone={settings.paperTone} />
            <span className="t-label">{label}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    <Segmented label="Paper tone" options={["theme", "accent"] as const} names={{ theme: "Theme paper", accent: "Accent paper" }} value={settings.paperTone} onChange={paperTone => onChange({ paperTone })} />
    {(settings.backgroundStyle !== "solid" || phoneBackground !== "solid") && <>
      <Segmented label="Pattern placement" options={["outside", "inside", "both"] as const} names={{ outside: "Around frame", inside: "Inside frame" }} value={settings.backgroundPlacement} onChange={backgroundPlacement => onChange({ backgroundPlacement })} />
      <Segmented label="Background strength" options={["quiet", "visible"] as const} value={settings.backgroundStrength} onChange={backgroundStrength => onChange({ backgroundStrength })} />
    </>}
    <VisualSelector label="Diagram background" value={settings.diagramBackgroundStyle} onChange={diagramBackgroundStyle => onChange({ diagramBackgroundStyle })}
      preview={background => <BackgroundPreview background={background === "inherit" ? pageDiagramBackground : background} tone={settings.paperTone} />}
      options={[["inherit", "Same as page"], ...backgrounds.filter(([value]) => diagramBackgrounds.includes(value))] as [AppearanceSettings["diagramBackgroundStyle"], string][]} />
    {(settings.diagramBackgroundStyle === "inherit" ? pageDiagramBackground : settings.diagramBackgroundStyle) !== "solid" &&
      <Segmented label="Diagram strength" options={["inherit", "quiet", "visible"] as const} names={{ inherit: "Same as page" }} value={settings.diagramBackgroundStrength} onChange={diagramBackgroundStrength => onChange({ diagramBackgroundStrength })} />}
    <p className="muted t-label">A diagram never repeats a mark that belongs to the whole page: Momoi, Kiso enso or Rings. Under those, Same as page is a dot grid.</p>
  </AppearanceSection>,
  charts: <AppearanceSection {...head("charts")} title="Charts">
    <Segmented label="Chart line" options={line.values} names={line.names} value={settings.chartLine} onChange={chartLine => onChange({ chartLine })} />
    <Segmented label="Chart fill" options={fill.values} names={fill.names} value={settings.chartFill} onChange={chartFill => onChange({ chartFill })} />
    <Segmented label="Chart layout" options={layout.values} names={layout.names} value={settings.chartLayout} onChange={chartLayout => onChange({ chartLayout })} />
    <Segmented label="Chart legend" options={legend.values} names={legend.names} value={settings.chartLegend} onChange={chartLegend => onChange({ chartLegend })} />
    <p className="muted t-label">These change every chart, in the gallery and in the app pages. A page with no chart shows no change. Series colors stay the same under every accent, so a series never reads as a status.</p>
  </AppearanceSection>,
  phone: <AppearanceSection {...head("phone")} title="Phone">
    <RadioGroup label="Same as desktop" variant="segmented" value={phoneOverride ? "override" : "same"} onValueChange={choosePhone}>
      <RadioGroupItem value="same" label="Same" />
      <RadioGroupItem value="override" label="Override" />
    </RadioGroup>
    <p className="muted t-label">Below 700px wide the phone choices replace the desktop ones. {phoneHint}</p>
    {phoneOverride && <>
      <Segmented label="Phone shadow" value={settings.phoneShadowStyle} options={settings.phoneShadowStyle === "auto" ? ["inherit", "none", "hard", "soft", "auto"] as const : ["inherit", "none", "hard", "soft"] as const}
        names={{ ...sameNames, auto: "Legacy elevation" }} onChange={phoneShadowStyle => onChange({ phoneShadowStyle })} />
      <VisualSelector label="Phone background" value={settings.phoneBackgroundStyle} onChange={phoneBackgroundStyle => onChange({ phoneBackgroundStyle })}
        preview={background => <BackgroundPreview background={background === "inherit" ? settings.backgroundStyle : background} tone={settings.paperTone} />}
        options={[["inherit", "Same as desktop"], ...backgrounds]} />
      <VisualSelector disabledOptions={phoneCorner === "pixel" ? borders.filter(b => !pixelBorder(b.value)).map(b => b.value) : []} label="Phone border" value={settings.phoneBorderStyle} onChange={phoneBorderStyle => onChange({ phoneBorderStyle })}
        preview={border => <PanelPreview border={border === "inherit" ? settings.borderStyle : border} />}
        options={[["inherit", "Same as desktop"], ...borders.map(b => [b.value, b.label] as [BorderStyle, string])]} />
      {!isExpressive(phoneBorder) && <VisualSelector disabledOptions={pixelBorder(phoneBorder) ? [] : ["pixel"]} label="Phone corners" value={settings.phoneCornerStyle} onChange={phoneCornerStyle => onChange({ phoneCornerStyle })}
        preview={corner => <PanelPreview corner={corner === "inherit" ? settings.cornerStyle : corner} />}
        options={[["inherit", "Same as desktop"], ...corners.map(c => [c.value, c.label] as [CornerStyle, string])]} />}
      <VisualSelector disabledOptions={marks.filter(m => incompatibleMark(m.value, phoneBorder, phoneCorner)).map(m => m.value)} label="Phone marks" value={settings.phoneCornerMarks} onChange={phoneCornerMarks => onChange({ phoneCornerMarks })}
        preview={mark => <PanelPreview marks={mark === "inherit" ? settings.cornerMarks : mark} />}
        options={[["inherit", "Same as desktop"], ...marks.map(m => [m.value, m.label] as [CornerMarks, string])]} />
      <Segmented label="Phone panel fill" value={settings.phonePanelFill} options={["inherit", "solid", "translucent", "glass"] as const} names={sameNames} onChange={phonePanelFill => onChange({ phonePanelFill })} />
    </>}
  </AppearanceSection>,
  };
  return <>{shown.map(id => <Fragment key={id}>{sections[id]}</Fragment>)}</>;
}
