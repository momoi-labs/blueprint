import { useState, type ReactNode } from "react";
import { Badge, Button, CodeBlock, RadioGroup, RadioGroupItem, Tabs, TabsContent, TabsList, TabsTrigger } from "@momoi-labs/kiso-react";
import {
  AppWindow, ChartLine, CodeXml, FileText, Frame, Grid3x3, Layers, LayoutDashboard, Monitor, Palette, PanelTop, PencilRuler, RotateCcw,
  Scan, Smartphone, Sparkles, Square, SquareDashed, SquareTerminal, SwatchBook, Target, TriangleAlert,
} from "lucide-react";
import { AppearanceControls, type AppearanceSectionId } from "./appearance";
import type { AppearanceSettings } from "./appearance-settings";
import { ThemePreview, type Device } from "./layout-examples";
import { shopPages } from "./templates/shop";

type TabId = "look" | "layout" | "frame" | "canvas" | "phone" | "code";

const tabs: { id: TabId; label: string; icon: ReactNode; sections: AppearanceSectionId[] }[] = [
  { id: "look", label: "Look", icon: <Palette className="icon" />, sections: ["presets", "colors"] },
  { id: "layout", label: "Layout", icon: <LayoutDashboard className="icon" />, sections: ["sketch", "shell", "header", "page", "gallery"] },
  { id: "frame", label: "Frame", icon: <Frame className="icon" />, sections: ["panels", "marks", "scope", "outer"] },
  { id: "canvas", label: "Canvas", icon: <Layers className="icon" />, sections: ["background", "charts"] },
  { id: "phone", label: "Phone", icon: <Smartphone className="icon" />, sections: ["phone"] },
  { id: "code", label: "Code", icon: <CodeXml className="icon" />, sections: [] },
];

const sectionNames: Partial<Record<AppearanceSectionId, string>> = {
  presets: "Presets", colors: "Colors", shell: "Shell", header: "Header", page: "Page", gallery: "Gallery only",
  panels: "Panels", marks: "Marks", scope: "Scope", outer: "Outer", background: "Background", charts: "Charts", phone: "Phone",
};

const icons: Partial<Record<AppearanceSectionId, ReactNode>> = {
  presets: <Sparkles className="icon" />,
  colors: <SwatchBook className="icon" />,
  shell: <AppWindow className="icon" />,
  header: <PanelTop className="icon" />,
  page: <FileText className="icon" />,
  gallery: <TriangleAlert className="icon" />,
  panels: <Square className="icon" />,
  marks: <Scan className="icon" />,
  scope: <Target className="icon" />,
  outer: <SquareDashed className="icon" />,
  background: <Grid3x3 className="icon" />,
  charts: <ChartLine className="icon" />,
  phone: <Smartphone className="icon" />,
};

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

export function ThemeGenerator({ settings, onChange, onReset }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<TabId>("look");
  const [page, setPage] = useState("dashboard");
  const [device, setDevice] = useState<Device>("desktop");
  const current = tabs.find(item => item.id === tab)!;
  const flash = (id: AppearanceSectionId) => {
    const section = document.getElementById(`gen-${id}`);
    if (!section) return;
    section.scrollIntoView({ block: "start" });
    section.classList.remove("gen-flash");
    void section.offsetWidth;
    section.classList.add("gen-flash");
  };
  const jumps = current.sections.filter(id => id !== "sketch");
  return <div className="gen-workspace">
    <div className="gen-rail">
      <Tabs className="gen-tabs" orientation="vertical" value={tab} onValueChange={value => setTab(value as TabId)}>
        <TabsList className="gen-nav" aria-label="Settings groups">
          {tabs.map(item => <TabsTrigger key={item.id} value={item.id}>{item.icon}<span>{item.label}</span></TabsTrigger>)}
        </TabsList>
        <div className="gen-panel">
          <div className="gen-panel-head">
            <div className="gen-panel-title">
              <h2 className="t-h3">{current.icon}{current.label}</h2>
              {tab !== "code" && <Button variant="ghost" size="sm" onClick={onReset}><RotateCcw className="icon" />Reset</Button>}
              <Button variant="primary" size="sm" disabled={tab === "code"} onClick={() => setTab("code")}><CodeXml className="icon" />Export</Button>
            </div>
            {jumps.length > 1 && <nav className="gen-jumps" aria-label={`${current.label} sections`}>
              {jumps.map(id => <button key={id} type="button" className="gen-jump" onClick={() => flash(id)}>{sectionNames[id]}</button>)}
            </nav>}
          </div>
          {tabs.map(item => <TabsContent key={item.id} value={item.id} className="gen-scroll">
            {item.id === "code" ? <ExportPanel settings={settings} /> : <AppearanceControls settings={settings} onChange={onChange} sections={item.sections}
              icons={icons} idPrefix="gen" presetFields="defined" galleryOnly
              onJump={part => flash(part)} />}
          </TabsContent>)}
        </div>
      </Tabs>
    </div>
    <section className="gen-preview" aria-label="Live preview">
      <div className="gen-preview-head">
        <RadioGroup label="Preview page" variant="segmented" value={page.split("/")[0]} onValueChange={setPage}>
          {shopPages.map(([value, label]) => <RadioGroupItem key={value} value={value} label={label} />)}
        </RadioGroup>
        <RadioGroup label="Preview device" variant="segmented" value={device} onValueChange={value => setDevice(value as Device)}>
          <RadioGroupItem value="desktop" label="Desktop" icon={<Monitor className="icon" />} />
          <RadioGroupItem value="phone" label="Phone" icon={<Smartphone className="icon" />} />
          <RadioGroupItem value="tui" label="TUI" icon={<SquareTerminal className="icon" />} />
        </RadioGroup>
      </div>
      <div className="gen-frame">
        <ThemePreview page={page} device={device} accent={settings.accent} theme={settings.theme} onPage={setPage} />
      </div>
    </section>
  </div>;
}

function ExportPanel({ settings }: { settings: AppearanceSettings }) {
  return <section className="appearance-section gen-export" aria-labelledby="gen-export-title">
    <h3 id="gen-export-title" className="t-caps"><CodeXml className="icon" />Project HTML</h3>
    <p className="muted t-label">Put these attributes on the <code>&lt;html&gt;</code> tag of your project's <code>index.html</code>. Phone overrides add a small script.</p>
    <CodeBlock code={exportCode(settings)} copy="HTML" wrap />
    <p className="muted t-label gen-row"><Badge>Gallery only</Badge>Light or dark, header width and landing bands stay out. Your project takes light or dark from the reader.</p>
  </section>;
}
