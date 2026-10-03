import { useId, type ReactNode } from "react";
import { AccentSelector, Button, ThemeSelector } from "@momoi-labs/kiso-react";
import type { AppearanceSettings, BorderStyle, CornerStyle, CornerMarks, MarkSize, Size } from "./appearance-settings";
import { randomAppearance } from "./appearance-settings";
import { BackgroundPreview, PanelPreview, PlacementPreview, ScopePreview } from "./appearance-previews";

const borders: { value: BorderStyle; label: string; description: string }[] = [
  { value: "solid", label: "Solid", description: "A single outline" },
  { value: "none", label: "None", description: "No panel outline, shadow, or marks" },
  { value: "rail", label: "Side rail", description: "A stronger left edge" },
  { value: "dash", label: "Dashed outline", description: "Short dashes around the panel" },
  { value: "double", label: "Double outline", description: "Two lines, set close together" },
  { value: "base", label: "Weighted base", description: "A stronger bottom edge" },
  { value: "offset", label: "Offset outline", description: "A solid, shifted shadow" },
];
const expressiveBorders: typeof borders = [
  { value: "manga", label: "Manga panel", description: "An angled, heavy ink outline" },
  { value: "brush", label: "Brush frame", description: "An irregular ink outline" },
];
borders.push(...expressiveBorders);
const corners: { value: CornerStyle; label: string; description: string }[] = [
  { value: "square", label: "Square", description: "Straight panels, small control corners" },
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

const visualStyles = [
  { value: "default", label: "Default", description: "Compact hierarchy and spacing" },
  { value: "editorial", label: "Editorial", description: "Prominent titles, metrics, and more space" },
] as const;

const applicationFrames = [
  { value: "default", label: "Default", description: "Content meets the application edges" },
  { value: "inset", label: "Inset", description: "Content sits inside a separate frame" },
] as const;

const compositions: { label: string; settings: Partial<AppearanceSettings> }[] = [
  { label: "Default", settings: { theme: "system", appShell: "default", frameScope: "all" } },
  { label: "Blueprint", settings: { accent: "cobalt", paperTone: "accent", backgroundStyle: "guides", backgroundPlacement: "inside", outerBorderStyle: "double" } },
  { label: "Drawing plate", settings: { accent: "terracotta", backgroundStyle: "fibers", outerBorderStyle: "double", cornerMarks: "none", outerCornerMarks: "ticks", markScope: "outer" } },
  { label: "Drafting sheet", settings: { backgroundStyle: "dots", cornerMarks: "none", outerCornerMarks: "ticks", markScope: "outer" } },
  { label: "Pixel workshop", settings: { backgroundStyle: "dots", outerCornerStyle: "pixel", cornerMarks: "none", outerCornerMarks: "brackets", markScope: "outer" } },
  { label: "Manga board", settings: { backgroundStyle: "grid", outerBorderStyle: "manga", cornerMarks: "none", outerCornerMarks: "diagonal", markScope: "outer" } },
  { label: "Brush study", settings: { backgroundStyle: "fibers", outerBorderStyle: "brush", cornerMarks: "none", frameScope: "outer", markScope: "outer" } },
  { label: "Momoi signature", settings: { backgroundStyle: "momoi", cornerStyle: "rounded", outerCornerStyle: "asym", cornerMarks: "none", panelFill: "translucent", markScope: "outer" } },
  { label: "Pixel everywhere", settings: { theme: "system", cornerStyle: "pixel", cornerSize: "small", backgroundStyle: "fibers", visualStyle: "editorial", frameScope: "all", markScope: "panels" } },
];

function ChoiceSelector<T extends string>({ label, value, onChange, options, disabled = false, disabledOptions = [], preview }: {
  label: string; value: T; onChange: (size: T) => void; options: readonly T[]; disabled?: boolean; disabledOptions?: readonly T[];
  preview?: (value: T) => ReactNode;
}) {
  const name = useId();
  return <fieldset className="appearance-size" disabled={disabled}>
    <legend className="t-label">{label}</legend>
    <div className="appearance-segments">
      {options.map(size => <label key={size}>
        <input type="radio" name={name} value={size} checked={value === size} disabled={disabledOptions.includes(size)} onChange={() => onChange(size)} />
        <span className="appearance-segment-body">{preview?.(size)}{size[0].toUpperCase() + size.slice(1)}</span>
      </label>)}
    </div>
  </fieldset>;
}

function VisualSelector<T extends string>({ label, value, options, onChange, preview, disabled = false, disabledOptions = [], layout = "compact" }: {
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

function FramePreview({ inset }: { inset: boolean }) {
  const x = inset ? 13 : 10;
  const y = inset ? 4 : 1;
  const width = inset ? 22 : 28;
  const height = inset ? 28 : 34;
  return <svg className="appearance-frame-sample" viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="1.5" focusable="false">
    <rect className="appearance-frame-outline" x="1" y="1" width="46" height="34" rx="2" />
    <path d="M4 7h3m-3 5h3m-3 5h3M41 7h3m-3 5h3m-3 5h3" />
    <g transform={`translate(${x} ${y})`}>
      <rect className="appearance-frame-main" width={width} height={height} rx={inset ? 2 : 0} />
      <path d={`M0 7h${width}M4 12h${width - 8}M4 17h${width - 12}`} />
    </g>
  </svg>;
}

function AppearanceSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <section className="appearance-section" aria-labelledby={id}>
    <h3 id={id} className="t-caps">{title}</h3>
    {children}
  </section>;
}

export function AppearanceControls({ settings, onChange }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
}) {
  const borderName = useId();
  const cornerName = useId();
  const markName = useId();
  const styleName = useId();
  const frameName = useId();
  const backgroundName = useId();
  const borderOptions = settings.borderStyle === "bevel" ? [...borders, { value: "bevel" as const, label: "Inset edge (legacy)", description: "Saved appearance. Replace to leave the legacy style." }] : borders;
  const markOptions = settings.cornerMarks === "dots" ? [...marks, { value: "dots" as const, label: "Corner dots (legacy)" }] : marks;
  const pixelBorder = (border: string) => ["solid", "none", "manga", "brush"].includes(border);
  const incompatibleMark = (mark: string, border: string, corner: string) =>
    (mark === "arcs" && (["manga", "brush"].includes(border) || corner === "pixel")) || (mark === "brackets" && border === "brush");
  const outerBorder = settings.outerBorderStyle === "inherit" ? settings.borderStyle : settings.outerBorderStyle;
  const outerCorner = settings.outerCornerStyle === "inherit" ? settings.cornerStyle : settings.outerCornerStyle;
  const outerMark = settings.outerCornerMarks === "inherit" ? settings.cornerMarks : settings.outerCornerMarks;
  const expressive = ["manga", "brush"].includes(settings.borderStyle);
  const detailBorder = expressive ? settings.borderStyle : ["manga", "brush"].includes(outerBorder) ? outerBorder : "solid";
  const sizedCorner = !expressive && settings.cornerStyle !== "square" ? settings.cornerStyle
    : !["manga", "brush"].includes(outerBorder) && outerCorner !== "square" ? outerCorner : null;
  const borderDetail = <ChoiceSelector label="Border detail" options={markSizes} value={settings.frameDetail}
    onChange={frameDetail => onChange({ frameDetail })}
    preview={detail => <PanelPreview border={detailBorder} detail={detail} />} />;
  const backgrounds = [
    ["solid", "Solid"], ["dots", "Dot grid"], ["grid", "Fine grid"], ["crosses", "Cross grid"],
    ["construction", "Construction lines"], ["guides", "Drawing guides"], ["fibers", "Paper fibers"], ["momoi", "Momoi watermark"], ["momoi-repeat", "Momoi repeat"],
  ] as const;
  return <>
  <AppearanceSection title="Colors">
    <div className="appearance-colors">
      <ThemeSelector theme={settings.theme} onChange={theme => onChange({ theme })} />
      <AccentSelector preview={false} accent={settings.accent} onChange={accent => onChange({ accent })} />
    </div>
  </AppearanceSection>
  <AppearanceSection title="Compositions">
    <p className="muted t-label">Pixel everywhere is the starting appearance. Default restores the previous look. Both follow your system theme; other studies keep your theme.</p>
    <div className="appearance-options">
      {compositions.map(composition => {
        const next = { ...window.kisoAppearance.defaults, theme: settings.theme, cornerStyle: "square" as const, cornerSize: "medium" as const, backgroundStyle: "solid" as const, visualStyle: "default" as const, appShell: "inset" as const, frameScope: "panels" as const, ...composition.settings };
        return <Button key={composition.label} variant="ghost" className="appearance-composition" aria-pressed={Object.entries(next).every(([key, value]) => settings[key as keyof AppearanceSettings] === value)} onClick={() => onChange(next)}>
          <span className="appearance-composition-preview" data-accent={next.accent} data-preview-tone={next.paperTone} aria-hidden="true">
            <BackgroundPreview background={next.backgroundStyle} tone={next.paperTone} />
            <PanelPreview border={next.outerBorderStyle === "inherit" ? next.borderStyle : next.outerBorderStyle} corner={next.outerCornerStyle === "inherit" ? next.cornerStyle : next.outerCornerStyle} marks={next.outerCornerMarks === "inherit" ? next.cornerMarks : next.outerCornerMarks} size={next.cornerSize} markSize={next.markSize} detail={next.frameDetail} />
          </span>
          <span>{composition.label}</span>
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
  </AppearanceSection>
  <AppearanceSection title="Layout">

    <fieldset className="appearance-choices">
      <legend className="t-label">Visual style</legend>
      <div className="appearance-options">
        {visualStyles.map(heading => <label className="appearance-option" key={heading.value} title={heading.description}>
          <input type="radio" name={styleName} value={heading.value}
            checked={settings.visualStyle === heading.value}
            onChange={() => onChange({ visualStyle: heading.value })}
            aria-labelledby={`${styleName}-${heading.value}-label`}
            aria-describedby={`${styleName}-${heading.value}-description`} />
          <span className="appearance-option-body">
            <span className="appearance-swatch" aria-hidden="true">
              <span className="appearance-sample appearance-heading-sample" data-heading-style={heading.value}>
                <span className="appearance-heading-title">Aa</span><i /><i />
              </span>
            </span>
            <span id={`${styleName}-${heading.value}-label`} className="t-label">{heading.label}</span>
            <span id={`${styleName}-${heading.value}-description`} className="appearance-option-description">{heading.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    <fieldset className="appearance-choices">
      <legend className="t-label">Application frame</legend>
      <div className="appearance-options">
        {applicationFrames.map(frame => <label className="appearance-option" key={frame.value} title={frame.description}>
          <input type="radio" name={frameName} value={frame.value}
            checked={settings.appShell === frame.value}
            onChange={() => onChange({ appShell: frame.value })}
            aria-labelledby={`${frameName}-${frame.value}-label`}
            aria-describedby={`${frameName}-${frame.value}-description`} />
          <span className="appearance-option-body">
            <span className="appearance-swatch" aria-hidden="true">
              <FramePreview inset={frame.value === "inset"} />
            </span>
            <span id={`${frameName}-${frame.value}-label`} className="t-label">{frame.label}</span>
            <span id={`${frameName}-${frame.value}-description`} className="appearance-option-description">{frame.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
  </AppearanceSection>
  <AppearanceSection title="Main style">
    <p className="muted t-label">Panels and controls use this style. The outer frame follows it unless customized below.</p>
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
    {expressive && borderDetail}
    <fieldset className="appearance-choices">
      <legend className="t-label">Corner type</legend>
      <div className="appearance-options">
        {corners.map(corner => <label className="appearance-option" key={corner.value} title={corner.description}>
          <input type="radio" name={cornerName} value={corner.value} checked={settings.cornerStyle === corner.value} disabled={expressive || (corner.value === "pixel" && !pixelBorder(settings.borderStyle))}
            onChange={() => onChange({ cornerStyle: corner.value, ...(corner.value !== "square" && settings.cornerSize === "off" ? { cornerSize: "medium" } : {}) })} />
          <span className="appearance-option-body">
            <PanelPreview corner={corner.value} />
            <span className="t-label">{corner.label}</span>
            <span className="appearance-option-description">{corner.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    <ChoiceSelector options={sizes} label="Corner size" value={settings.cornerSize} onChange={cornerSize => onChange({ cornerSize })}
      preview={size => <PanelPreview corner={sizedCorner ?? "rounded"} size={size} />}
      disabled={!sizedCorner} disabledOptions={["off"]} />
    <p className="muted t-label">Corner size controls Rounded, Asymmetric and Pixel. Manga and Brush use Border detail and keep their own contour.</p>
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
    <ChoiceSelector options={markSizes} label="Mark size" value={settings.markSize} onChange={markSize => onChange({ markSize })} disabled={settings.cornerMarks === "none" && outerMark === "none"}
      preview={markSize => <PanelPreview marks={settings.cornerMarks === "none" ? outerMark === "none" ? "ticks" : outerMark : settings.cornerMarks} markSize={markSize} />} />
  </AppearanceSection>
  <AppearanceSection title="Where to apply">
    <VisualSelector label="Apply frames to" value={settings.frameScope} onChange={frameScope => onChange({ frameScope })} layout="scope" preview={scope => <ScopePreview scope={scope} />}
      options={[["outer", "Outer only"], ["panels", "With panels"], ["all", "With controls"]]} />
    <VisualSelector label="Apply marks to" value={settings.markScope} onChange={markScope => onChange({ markScope })} layout="scope" preview={scope => <ScopePreview scope={scope} marks />}
      options={[["outer", "Outer only"], ["panels", "With panels"], ["all", "With controls"]]} />
    <VisualSelector label="Mark clearance" value={settings.markClearance} onChange={markClearance => onChange({ markClearance })}
      preview={clearance => <PanelPreview clearance={clearance} marks={outerMark === "none" ? "ticks" : outerMark} />}
      options={[["normal", "Normal"], ["sheet", "Drawing sheet"]]} />
    <details className="disclosure appearance-outer-customization">
      <summary>Customize outer frame</summary>
      <div className="disclosure-content">
        <p className="muted t-label">Applies to the Inset application frame. Choose Same as main style to follow the panels again. Corner size, mark size and border detail are shared.</p>
        <VisualSelector disabledOptions={outerCorner === "pixel" ? borders.filter(b => !pixelBorder(b.value)).map(b => b.value) : []} label="Outer border" value={settings.outerBorderStyle} onChange={outerBorderStyle => onChange({ outerBorderStyle })}
          preview={border => <PanelPreview border={border === "inherit" ? settings.borderStyle : border} />}
          options={[["inherit", "Same as main style"], ...borders.map(b => [b.value, b.label] as [BorderStyle, string]), ...(settings.outerBorderStyle === "bevel" ? [["bevel", "Inset edge (legacy)"] as [BorderStyle, string]] : [])]} />
        <VisualSelector disabledOptions={pixelBorder(outerBorder) ? [] : ["pixel"]} label="Outer corners" value={settings.outerCornerStyle} onChange={outerCornerStyle => onChange({ outerCornerStyle })}
          preview={corner => <PanelPreview corner={corner === "inherit" ? settings.cornerStyle : corner} />}
          disabled={["manga", "brush"].includes(settings.outerBorderStyle === "inherit" ? settings.borderStyle : settings.outerBorderStyle)}
          options={[["inherit", "Same as main style"], ...corners.map(c => [c.value, c.label] as [CornerStyle, string])]} />
        <VisualSelector disabledOptions={marks.filter(m => incompatibleMark(m.value, outerBorder, outerCorner)).map(m => m.value)} label="Outer marks" value={settings.outerCornerMarks} onChange={outerCornerMarks => onChange({ outerCornerMarks })}
          preview={mark => <PanelPreview marks={mark === "inherit" ? settings.cornerMarks : mark} />}
          options={[["inherit", "Same as main style"], ...marks.map(m => [m.value, m.label] as [CornerMarks, string]), ...(settings.outerCornerMarks === "dots" ? [["dots", "Corner dots (legacy)"] as [CornerMarks, string]] : [])]} />
        {!expressive && detailBorder !== "solid" && borderDetail}
      </div>
    </details>
    <p className="muted t-label">The outer frame uses the Inset layout. Native controls use compact internal guides. Menus and tooltips keep their standard outlines.</p>
  </AppearanceSection>
  <AppearanceSection title="Background">
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
    <VisualSelector label="Paper tone" options={[["theme", "Theme paper"], ["accent", "Accent paper"]]} value={settings.paperTone} onChange={paperTone => onChange({ paperTone })} layout="wide"
      preview={tone => <BackgroundPreview background={settings.backgroundStyle} tone={tone} />} />
    <VisualSelector label="Pattern placement" options={[["outside", "Around frame"], ["inside", "Inside frame"], ["both", "Both"]]} value={settings.backgroundPlacement} onChange={backgroundPlacement => onChange({ backgroundPlacement })} layout="scope" disabled={settings.backgroundStyle === "solid"}
      preview={placement => <PlacementPreview placement={placement} />} />
    <VisualSelector label="Background strength" options={[["quiet", "Quiet"], ["visible", "Visible"]]} value={settings.backgroundStrength} onChange={backgroundStrength => onChange({ backgroundStrength })} disabled={settings.backgroundStyle === "solid"} layout="wide"
      preview={strength => <BackgroundPreview background={settings.backgroundStyle} strength={strength} tone={settings.paperTone} />} />
    <VisualSelector label="Panel fill" options={[["solid", "Solid"], ["translucent", "Translucent"]]} value={settings.panelFill} onChange={panelFill => onChange({ panelFill })} layout="wide"
      preview={fill => <BackgroundPreview background={settings.backgroundStyle} strength={settings.backgroundStrength} fill={fill} tone={settings.paperTone} />} />
    <p className="muted t-label">Translucency affects panel fills. Text, fields and data samples stay opaque.</p>
  </AppearanceSection>
  </>;
}
