import { useState } from "react";
import { Badge, Button, Card, CodeBlock, PageHeader, PageHeaderDescription, PageHeaderTitle, RadioGroup, RadioGroupItem } from "@momoi-labs/kiso-react";
import { CodeXml, Monitor, RotateCcw, Smartphone, SquareTerminal } from "lucide-react";
import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { LookSettings, type LookTab } from "./look-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { AppearanceShare } from "./appearance-share-ui";
import { AppearanceUsage } from "./appearance-usage";
import { ThemePreview, type Device } from "./layout-examples";
import { shopPages } from "./templates/shop";

const galleryOnly = new Set(["theme", "headerWidth", "landingBands"]);
const kebab = (name: string) => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

function exportCode(settings: AppearanceSettings) {
  const fields = Object.entries(settings).filter(([name]) => !galleryOnly.has(name));
  const main = fields.filter(([name]) => !name.startsWith("phone"));
  const phone = Object.fromEntries(fields
    .filter(([name, value]) => name.startsWith("phone") && value !== "inherit")
    .map(([name, value]) => [name[5].toLowerCase() + name.slice(6), value]));
  const html = `<html lang="en"\n${main.map(([name, value]) => `  data-${kebab(name)}="${value}"`).join("\n")}\n>`;
  if (Object.keys(phone).length === 0) return html;
  const desktop = Object.fromEntries(main.filter(([name]) => name in phone));
  return `${html}\n<head>\n  <script>\n    const phone = ${JSON.stringify(phone)};\n    const desktop = ${JSON.stringify(desktop)};\n    const phoneQuery = matchMedia("(max-width: 699px)");\n    const apply = () => Object.assign(document.documentElement.dataset, phoneQuery.matches ? phone : desktop);\n    apply();\n    phoneQuery.addEventListener("change", apply);\n  </script>\n</head>`;
}

export function ThemeGenerator({ settings, onChange, onReset, demos, onShare }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onReset: () => void;
  demos: DemoOptions;
  onShare: (settings: AppearanceSettings, demos: DemoOptions) => void;
}) {
  const [tab, setTab] = useState<LookTab>("look");
  const [page, setPage] = useState("dashboard");
  const [device, setDevice] = useState<Device>("desktop");
  return <>
    <div className="catalog-heading">
      <PageHeader actions={<>
        <Button size="sm" onClick={onReset}><RotateCcw className="icon" aria-hidden="true" />Reset</Button>
        <AppearanceShare settings={settings} demos={demos} onApply={onShare} />
        <Button variant="primary" size="sm" disabled={tab === "code"} onClick={() => setTab("code")}><CodeXml className="icon" aria-hidden="true" />Export</Button>
      </>}>
        <PageHeaderTitle tabIndex={-1}>Theme generator</PageHeaderTitle>
        <PageHeaderDescription>Build a look, see it on real pages and export it for your project.</PageHeaderDescription>
      </PageHeader>
    </div>
    <div className="gen-workspace">
    <Card className="gen-rail">
      <LookSettings settings={settings} onChange={onChange} tab={tab} onTabChange={setTab} idPrefix="gen" variant="rail"
        phoneHint="Switch the preview to Phone to see the result."
        code={<><ExportPanel settings={settings} /><AppearanceUsage settings={settings} diagram={demos.diagram} /></>} />
    </Card>
    <Card className="gen-preview" role="region" aria-label="Live preview">
      <div className="gen-preview-head">
        <RadioGroup label="Preview page" variant="segmented" value={page.split("/")[0]} onValueChange={setPage}>
          {shopPages.map(([value, label]) => <RadioGroupItem key={value} value={value} label={label} />)}
        </RadioGroup>
        <RadioGroup label="Preview device" variant="segmented" value={device} onValueChange={value => setDevice(value as Device)}>
          <RadioGroupItem value="desktop" label="Desktop" icon={<Monitor className="icon" aria-hidden="true" />} />
          <RadioGroupItem value="phone" label="Phone" icon={<Smartphone className="icon" aria-hidden="true" />} />
          <RadioGroupItem value="tui" label="TUI" icon={<SquareTerminal className="icon" aria-hidden="true" />} />
        </RadioGroup>
      </div>
      <div className="gen-frame">
        <ThemePreview page={page} device={device} accent={settings.accent} theme={settings.theme} onPage={setPage} />
      </div>
    </Card>
    </div>
  </>;
}

function ExportPanel({ settings }: { settings: AppearanceSettings }) {
  return <section className="appearance-section gen-export" aria-labelledby="gen-export-title">
    <h3 id="gen-export-title" className="t-caps"><CodeXml className="icon" aria-hidden="true" />Project HTML</h3>
    <p className="muted t-label">Put these attributes on the <code>&lt;html&gt;</code> tag of your project's <code>index.html</code>. Phone overrides add a small script.</p>
    <CodeBlock code={exportCode(settings)} copy="HTML" wrap />
    <p className="muted t-label gen-row"><Badge>Gallery only</Badge>Light or dark, header width and landing bands stay out. Your project takes light or dark from the reader.</p>
  </section>;
}
