import { useId, useState } from "react";
import {
  AccentSelector, Badge, Button, Card, CardContent, CardFooter, CardHeader,
  CardTitle, Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, Disclosure, Input, Navigation, NavigationItem, NavigationLink,
  NavigationList, PageHeader, PageHeaderDescription, PageHeaderTitle,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThemeSelector,
} from "@momoi-labs/kiso-react";
import { AppearanceUsage } from "./appearance-usage";
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
  { value: "soft", label: "Subtle", description: "Small, rounded corners" },
  { value: "round", label: "Wide", description: "Larger, rounded corners" },
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

function ChoiceSelector<T extends string>({ label, value, onChange, options, disabled = false }: {
  label: string; value: T; onChange: (size: T) => void; options: readonly T[]; disabled?: boolean;
}) {
  const name = useId();
  return <fieldset className="appearance-size" disabled={disabled}>
    <legend className="t-label">{label}</legend>
    <div className="appearance-segments">
      {options.map(size => <label key={size}>
        <input type="radio" name={name} value={size} checked={value === size} onChange={() => onChange(size)} />
        <span>{size[0].toUpperCase() + size.slice(1)}</span>
      </label>)}
    </div>
  </fieldset>;
}

export function Appearance({ settings, onChange, onReset }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onReset: () => void;
}) {
  const borderName = useId();
  const cornerName = useId();
  const markName = useId();
  const styleName = useId();
  const frameName = useId();
  const [message, setMessage] = useState("");
  return <div className="appearance-page">
    <PageHeader actions={<Button variant="default" onClick={() => { onReset(); setMessage("Appearance reset to the gallery defaults."); }}>Reset appearance</Button>}>
      <PageHeaderTitle tabIndex={-1}>Appearance</PageHeaderTitle>
      <PageHeaderDescription>Changes apply across the gallery and stay saved in this browser.</PageHeaderDescription>
    </PageHeader>
    <div className="appearance-workbench">
      <section className="appearance-preview appearance-demos" aria-labelledby="appearance-preview-title">
        <h2 id="appearance-preview-title" className="t-h3">Live preview</h2>
        <div className="appearance-demo-scroll">
          <div className="appearance-preview-grid">
            <Card>
              <CardHeader><CardTitle>Service overview</CardTitle><p className="muted t-label">Production workspace</p></CardHeader>
              <CardContent>
                <Navigation aria-label="Sample service navigation"><NavigationList className="nav-row">
                  <NavigationItem><NavigationLink href="#appearance" active>Overview</NavigationLink></NavigationItem>
                  <NavigationItem><NavigationLink href="#components/navigation">Navigation example</NavigationLink></NavigationItem>
                </NavigationList></Navigation>
                <div className="appearance-metric"><span className="t-display">99.98%</span><Badge variant="success">Healthy</Badge></div>
                <label className="appearance-field"><span className="t-label">Service name</span><Input defaultValue="api-production" /></label>
              </CardContent>
              <CardFooter>
                <Button variant="primary" onClick={() => setMessage("Sample changes saved. No service was updated.")}>Save changes</Button>
                <Button variant="default" onClick={() => setMessage("Sample deployment queued. No service was deployed.")}>Deploy</Button>
                <Dialog><DialogTrigger asChild><Button variant="ghost">Open dialog</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Appearance preview</DialogTitle></DialogHeader><DialogBody><p>This dialog inherits the same global settings.</p><Input aria-label="Sample dialog field" placeholder="Try keyboard focus" /></DialogBody></DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
            <div className="appearance-preview-table">
              <div className="table-wrap"><Table aria-label="Sample services">
                <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Status</TableHead><TableHead>Latency</TableHead></TableRow></TableHeader>
                <TableBody>{["API", "Workers", "Auth"].map((name, index) => <TableRow key={name}><TableCell>{name}</TableCell><TableCell><Badge variant="success">Healthy</Badge></TableCell><TableCell>{[42, 18, 26][index]} ms</TableCell></TableRow>)}</TableBody>
              </Table></div>
              <p className="muted t-label">Use Components and Layouts to check this combination on complete screens.</p>
            </div>
          </div>
          <p role="status" className="muted t-label appearance-status">{message}</p>
          <AppearanceUsage settings={settings} />
        </div>
      </section>
      <aside className="card appearance-controls" aria-labelledby="appearance-options-title">
        <div className="appearance-controls-heading">
          <h2 id="appearance-options-title" className="t-h3">Appearance options</h2>
          <p className="muted t-label">Changes apply immediately.</p>
        </div>
        <div className="appearance-controls-scroll" role="region" aria-label="Appearance settings" tabIndex={0}>
          <Disclosure summary="Colors" open>
            <div className="appearance-colors">
              <ThemeSelector variant="cards" theme={settings.theme} onChange={theme => onChange({ theme })} />
              <AccentSelector accent={settings.accent} onChange={accent => onChange({ accent })} />
            </div>
          </Disclosure>
          <Disclosure summary="Layout" open>
            <fieldset className="appearance-choices">
              <legend className="t-label">Visual style</legend>
              <div className="appearance-options">
                {visualStyles.map(heading => <label className="appearance-option" key={heading.value}>
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
                    <span id={`${styleName}-${heading.value}-description`} className="muted t-label">{heading.description}</span>
                  </span>
                </label>)}
              </div>
            </fieldset>
            <fieldset className="appearance-choices">
              <legend className="t-label">Application frame</legend>
              <div className="appearance-options">
                {applicationFrames.map(frame => <label className="appearance-option" key={frame.value}>
                  <input type="radio" name={frameName} value={frame.value}
                    checked={settings.appShell === frame.value}
                    onChange={() => onChange({ appShell: frame.value })}
                    aria-labelledby={`${frameName}-${frame.value}-label`}
                    aria-describedby={`${frameName}-${frame.value}-description`} />
                  <span className="appearance-option-body">
                    <span className="appearance-swatch" aria-hidden="true">
                      <span className="appearance-frame-sample" data-frame-style={frame.value}>
                        <span className="appearance-frame-rail"><i /><i /><i /></span>
                        <span className={`appearance-frame-main${frame.value === "inset" ? " card" : ""}`}>
                          <span className="appearance-frame-header" />
                          <span className="appearance-frame-content"><i /><i /></span>
                        </span>
                      </span>
                    </span>
                    <span id={`${frameName}-${frame.value}-label`} className="t-label">{frame.label}</span>
                    <span id={`${frameName}-${frame.value}-description`} className="muted t-label">{frame.description}</span>
                  </span>
                </label>)}
              </div>
            </fieldset>
            <p className="muted t-label">Editorial adjusts headings, cards, metrics, and section spacing. Controls and tables keep their density. Inset controls the application frame independently.</p>
          </Disclosure>
          <Disclosure summary="Borders">
            <fieldset className="appearance-choices">
              <legend className="t-h3">Border style</legend>
              <div className="appearance-options">
                {borders.map(border => <label className="appearance-option" key={border.value}>
                  <input type="radio" name={borderName} value={border.value} checked={settings.borderStyle === border.value} onChange={() => onChange({ borderStyle: border.value })} />
                  <span className="appearance-option-body">
                    <span className="appearance-swatch" data-border-style={border.value} aria-hidden="true">
                      <span className="card appearance-sample"><i /><i /></span>
                    </span>
                    <span className="t-label">{border.label}</span>
                    <span className="muted t-label">{border.description}</span>
                  </span>
                </label>)}
              </div>
            </fieldset>
            <fieldset className="appearance-choices">
              <legend className="t-h3">Corner shape</legend>
              <div className="appearance-options">
                {corners.map(corner => <label className="appearance-option" key={corner.value}>
                  <input type="radio" name={cornerName} value={corner.value} checked={settings.cornerStyle === corner.value} onChange={() => onChange({ cornerStyle: corner.value })} />
                  <span className="appearance-option-body">
                    <span className="appearance-swatch" data-border-style="solid" data-corner-style={corner.value} aria-hidden="true">
                      <span className="card appearance-sample"><i /><i /></span>
                    </span>
                    <span className="t-label">{corner.label}</span>
                    <span className="muted t-label">{corner.description}</span>
                  </span>
                </label>)}
              </div>
            </fieldset>
            <ChoiceSelector options={sizes} label="Corner size" value={settings.cornerSize} onChange={cornerSize => onChange({ cornerSize })} />
            <p className="muted t-label">Corner shape and size apply independently of the border. Off removes all rounding.</p>
          </Disclosure>
          <Disclosure summary="Corner marks">
            <fieldset className="appearance-choices">
              <legend className="t-h3">Corner marks</legend>
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
            <p className="muted t-label">Choose None to hide the marks. Mark size sets their length and gap.</p>
          </Disclosure>
        </div>
      </aside>
    </div>
  </div>;
}
