import { useLayoutEffect, useRef, useState } from "react";
import {
  accents,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Disclosure,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type Accent,
} from "@momoi-labs/kiso-react";

const about: Record<Accent, string> = {
  violet: "The default. Violet ink and fill on the warm neutrals.",
  terracotta: "Same roles, hue turned to terracotta.",
  teal: "Same roles, hue turned to teal.",
  cobalt: "Same roles, hue turned to cobalt.",
  nocturne: "The marketing site's palette: cool slate neutrals under a muted indigo ink.",
  tangerine: "Bright orange fill and dark text, with separate ink.",
  red: "Red ink and fill, close to the danger color. Made for admin pages that should feel like attention.",
  gold: "Golden yellow fill and dark text, with separate ink.",
  lime: "Neon lime fill and dark text, with separate ink.",
  plum: "Same roles, hue turned to plum, between violet and red.",
  stone: "Warm gray in the paper's hue. The dark fill is light, with dark text.",
  steel: "Blue-gray, with enough chroma to read apart from stone.",
};

const steps = ["50", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const themes = ["light", "dark"] as const;

// Each check reads two rendered colors from probes inside a sample, so the
// numbers follow the shipped tokens rather than a copy of them.
const checks = [
  { label: "Primary button text", fg: "primary-foreground", bg: "primary", min: 4.5 },
  { label: "Primary hover text", fg: "primary-foreground", bg: "primary-hover", min: 4.5 },
  { label: "Link on background", fg: "link", bg: "background", min: 4.5 },
  { label: "Link on card", fg: "link", bg: "card", min: 4.5 },
  { label: "Link on popover", fg: "link", bg: "popover", min: 4.5 },
  { label: "Focus ring on background", fg: "focus", bg: "background", min: 3 },
] as const;
const probes = [...new Set(checks.flatMap((check) => [check.fg, check.bg]))];

type Ratios = Record<string, number>;

function luminance(color: string) {
  const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map((channel) => {
    const value = Number(channel) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (light + 0.05) / (dark + 0.05);
}

function AccentSample({ accent, theme, onMeasure }: {
  accent: Accent;
  theme: (typeof themes)[number];
  onMeasure: (ratios: Ratios) => void;
}) {
  const sample = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const colors = Object.fromEntries(probes.map((role) => [
      role,
      getComputedStyle(sample.current!.querySelector(`[data-probe="${role}"]`)!).color,
    ]));
    onMeasure(Object.fromEntries(checks.map((check) => [check.label, contrast(colors[check.fg], colors[check.bg])])));
  }, [onMeasure]);
  const id = `accent-${accent}-${theme}`;

  return (
    <div ref={sample} className="accent-sample" data-accent={accent} data-theme={theme} data-background-style="momoi-repeat">
      <p className="t-caps accent-sample-theme">{theme === "light" ? "Light" : "Dark"}</p>
      <Card>
        <CardHeader><CardTitle>Deploy pipeline</CardTitle></CardHeader>
        <CardContent className="stack-sm">
          <p>Last run finished in 3m 12s. <a href="#accents">View logs</a> or read the <a href="#accents">runbook</a>.</p>
          <div className="accent-sample-row">
            <Button variant="primary" size="sm">Deploy</Button>
            <Button variant="primary" size="sm" className="accent-sample-hover">Hover</Button>
            <Button size="sm">Cancel</Button>
            <Button size="sm" className="accent-sample-focus">Focused</Button>
          </div>
          <div className="accent-sample-row">
            <Badge className="badge-solid">Live</Badge>
            <Badge className="accent-sample-badge">Beta</Badge>
            <Badge className="badge-outline">v2.4</Badge>
            <span className="accent-sample-field">
              <Checkbox id={`${id}-notify`} defaultChecked />
              <Label htmlFor={`${id}-notify`}>Notify team</Label>
            </span>
            <Switch aria-label="Auto deploy" defaultChecked />
          </div>
          <Table>
            <TableBody>
              <TableRow className="accent-sample-row-hover"><TableCell>Overview</TableCell><TableCell className="muted">hover</TableCell></TableRow>
              <TableRow aria-selected="true"><TableCell>Deployments</TableCell><TableCell className="muted">selected</TableCell></TableRow>
              <TableRow><TableCell>Settings</TableCell><TableCell /></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="accent-sample-scale" aria-label={`${accent} scale`} role="img">
        {steps.map((step) => <span key={step} style={{ background: `var(--color-accent-${step})` }}><span>{step}</span></span>)}
      </div>
      <span hidden>{probes.map((role) => <span key={role} data-probe={role} style={{ color: `var(--color-${role})` }} />)}</span>
    </div>
  );
}

function AccentSection({ accent }: { accent: Accent }) {
  const [ratios, setRatios] = useState<Partial<Record<(typeof themes)[number], Ratios>>>({});
  const [measure] = useState(() => Object.fromEntries(themes.map((theme) => [
    theme,
    (next: Ratios) => setRatios((current) => ({ ...current, [theme]: next })),
  ])) as Record<(typeof themes)[number], (ratios: Ratios) => void>);
  const name = `${accent[0].toUpperCase()}${accent.slice(1)}`;

  return (
    <section className="accents-section" aria-labelledby={`accents-${accent}`}>
      <div>
        <h2 id={`accents-${accent}`} className="t-h3">{name}</h2>
        <p className="muted">{about[accent]} <code>data-accent="{accent}"</code></p>
      </div>
      <div className="accents-pair">
        {themes.map((theme) => <AccentSample key={theme} accent={accent} theme={theme} onMeasure={measure[theme]} />)}
      </div>
      <Disclosure summary="Contrast">
        <Table>
          <TableHeader><TableRow><TableHead>Check</TableHead><TableHead>Light</TableHead><TableHead>Dark</TableHead></TableRow></TableHeader>
          <TableBody>
            {checks.map((check) => (
              <TableRow key={check.label}>
                <TableCell>{check.label} <span className="muted">(at least {check.min}:1)</span></TableCell>
                {themes.map((theme) => {
                  const ratio = ratios[theme]?.[check.label];
                  return <TableCell key={theme} className="mono">
                    {ratio === undefined ? "-" : <Badge variant={ratio >= check.min ? "success" : "danger"}>{ratio.toFixed(2)}:1</Badge>}
                  </TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Disclosure>
    </section>
  );
}

export function Accents() {
  return <div className="accents-page">{accents.map((accent) => <AccentSection key={accent} accent={accent} />)}</div>;
}
