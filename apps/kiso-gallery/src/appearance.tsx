import { useId, type ReactNode } from "react";
import { AccentSelector, ThemeSelector } from "@momoi-labs/kiso-react";
import type { AppearanceSettings, BorderStyle, CornerStyle, CornerMarks, MarkSize, Size } from "./appearance-settings";

const borders: { value: BorderStyle; label: string; description: string }[] = [
  { value: "solid", label: "Solid", description: "A single outline" },
  { value: "none", label: "None", description: "No panel outline, shadow, or marks" },
  { value: "rail", label: "Side rail", description: "A stronger left edge" },
  { value: "dash", label: "Dashed outline", description: "Short dashes around the panel" },
  { value: "bevel", label: "Inset edge", description: "A recessed outline" },
  { value: "double", label: "Double outline", description: "Two lines, set close together" },
  { value: "base", label: "Weighted base", description: "A stronger bottom edge" },
  { value: "offset", label: "Offset outline", description: "A solid, shifted shadow" },
];
const corners: { value: CornerStyle; label: string; description: string }[] = [
  { value: "square", label: "Square", description: "Straight panels, small control corners" },
  { value: "rounded", label: "Rounded", description: "Even curves at every corner" },
  { value: "asym", label: "Asymmetric", description: "Two opposite, wider corners" },
];
const marks: { value: CornerMarks; label: string }[] = [
  { value: "none", label: "None" },
  { value: "ticks", label: "Original ticks" },
  { value: "brackets", label: "Outer brackets" },
  { value: "arcs", label: "Curved brackets" },
  { value: "dots", label: "Corner dots" },
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

function ChoiceSelector<T extends string>({ label, value, onChange, options, disabled = false, disabledOptions = [] }: {
  label: string; value: T; onChange: (size: T) => void; options: readonly T[]; disabled?: boolean; disabledOptions?: readonly T[];
}) {
  const name = useId();
  return <fieldset className="appearance-size" disabled={disabled}>
    <legend className="t-label">{label}</legend>
    <div className="appearance-segments">
      {options.map(size => <label key={size}>
        <input type="radio" name={name} value={size} checked={value === size} disabled={disabledOptions.includes(size)} onChange={() => onChange(size)} />
        <span>{size[0].toUpperCase() + size.slice(1)}</span>
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
  return <>
  <AppearanceSection title="Colors">
    <div className="appearance-colors">
      <ThemeSelector theme={settings.theme} onChange={theme => onChange({ theme })} />
      <AccentSelector preview={false} accent={settings.accent} onChange={accent => onChange({ accent })} />
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
              <span className="card appearance-sample appearance-heading-sample" data-heading-style={heading.value}>
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
  <AppearanceSection title="Borders">
    <fieldset className="appearance-choices">
      <legend className="t-label">Border style</legend>
      <div className="appearance-options">
        {borders.map(border => <label className="appearance-option" key={border.value} title={border.description}>
          <input type="radio" name={borderName} value={border.value} checked={settings.borderStyle === border.value} onChange={() => onChange({ borderStyle: border.value })} />
          <span className="appearance-option-body">
            <span className="appearance-swatch" data-border-style={border.value} aria-hidden="true">
              <span className="card appearance-sample"><i /><i /></span>
            </span>
            <span className="t-label">{border.label}</span>
            <span className="appearance-option-description">{border.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
  </AppearanceSection>
  <AppearanceSection title="Corner style">
    <fieldset className="appearance-choices">
      <legend className="t-label">Corner type</legend>
      <div className="appearance-options">
        {corners.map(corner => <label className="appearance-option" key={corner.value} title={corner.description}>
          <input type="radio" name={cornerName} value={corner.value} checked={settings.cornerStyle === corner.value}
            onChange={() => onChange({ cornerStyle: corner.value, ...(corner.value !== "square" && settings.cornerSize === "off" ? { cornerSize: "medium" } : {}) })} />
          <span className="appearance-option-body">
            <span className="appearance-swatch" data-border-style="solid" data-corner-style={corner.value} data-corner-size="medium" data-corner-marks="none" aria-hidden="true">
              <span className="card appearance-sample"><i /><i /></span>
            </span>
            <span className="t-label">{corner.label}</span>
            <span className="appearance-option-description">{corner.description}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    <ChoiceSelector options={sizes} label="Corner size" value={settings.cornerSize} onChange={cornerSize => onChange({ cornerSize })}
      disabled={settings.cornerStyle === "square"} disabledOptions={["off"]} />
    <p className="muted t-label">Square has no size adjustment. Other shapes require Small, Medium, or Large.</p>
  </AppearanceSection>
  <AppearanceSection title="Corner marks">
    <fieldset className="appearance-choices">
      <legend className="t-label">Corner marks</legend>
      <div className="appearance-options">
        {marks.map(mark => <label className="appearance-option" key={mark.value}>
          <input type="radio" name={markName} value={mark.value} checked={settings.cornerMarks === mark.value} onChange={() => onChange({ cornerMarks: mark.value })} />
          <span className="appearance-option-body">
            <span className="appearance-swatch" data-corner-marks={mark.value} aria-hidden="true">
              <span className="card appearance-sample"><i /><i /></span>
            </span>
            <span className="t-label">{mark.label}</span>
          </span>
        </label>)}
      </div>
    </fieldset>
    <ChoiceSelector options={markSizes} label="Mark size" value={settings.markSize} onChange={markSize => onChange({ markSize })} disabled={settings.cornerMarks === "none"} />
  </AppearanceSection>
  </>;
}
