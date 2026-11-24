import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@momoi-labs/kiso-react";
import {
  AppWindow, ChartLine, CodeXml, FileText, Frame, Grid3x3, Layers, LayoutDashboard, Palette, PanelTop,
  Scan, Settings, Smartphone, Sparkles, Square, SquareDashed, SwatchBook, Target, TriangleAlert,
} from "lucide-react";
import { AppearanceControls, type AppearanceSectionId } from "./appearance";
import type { AppearanceSettings } from "./appearance-settings";

export type LookTab = "look" | "layout" | "frame" | "canvas" | "phone" | "code" | "gallery";

const tabs: { id: LookTab; label: string; icon: ReactNode; sections: AppearanceSectionId[] }[] = [
  { id: "look", label: "Look", icon: <Palette className="icon" aria-hidden="true" />, sections: ["presets", "colors"] },
  { id: "layout", label: "Layout", icon: <LayoutDashboard className="icon" aria-hidden="true" />, sections: ["sketch", "shell", "header", "page"] },
  { id: "frame", label: "Frame", icon: <Frame className="icon" aria-hidden="true" />, sections: ["panels", "marks", "scope", "outer"] },
  { id: "canvas", label: "Canvas", icon: <Layers className="icon" aria-hidden="true" />, sections: ["background", "charts"] },
  { id: "phone", label: "Phone", icon: <Smartphone className="icon" aria-hidden="true" />, sections: ["phone"] },
  { id: "code", label: "Code", icon: <CodeXml className="icon" aria-hidden="true" />, sections: [] },
  { id: "gallery", label: "Gallery", icon: <Settings className="icon" aria-hidden="true" />, sections: ["gallery"] },
];

const sectionNames: Partial<Record<AppearanceSectionId, string>> = {
  presets: "Presets", colors: "Colors", shell: "Shell", header: "Header", page: "Page", gallery: "Gallery only",
  panels: "Panels", marks: "Marks", scope: "Scope", outer: "Outer", background: "Background", charts: "Charts", phone: "Phone",
};

const icons: Partial<Record<AppearanceSectionId, ReactNode>> = {
  presets: <Sparkles className="icon" aria-hidden="true" />,
  colors: <SwatchBook className="icon" aria-hidden="true" />,
  shell: <AppWindow className="icon" aria-hidden="true" />,
  header: <PanelTop className="icon" aria-hidden="true" />,
  page: <FileText className="icon" aria-hidden="true" />,
  gallery: <TriangleAlert className="icon" aria-hidden="true" />,
  panels: <Square className="icon" aria-hidden="true" />,
  marks: <Scan className="icon" aria-hidden="true" />,
  scope: <Target className="icon" aria-hidden="true" />,
  outer: <SquareDashed className="icon" aria-hidden="true" />,
  background: <Grid3x3 className="icon" aria-hidden="true" />,
  charts: <ChartLine className="icon" aria-hidden="true" />,
  phone: <Smartphone className="icon" aria-hidden="true" />,
};

export function LookSettings({ settings, onChange, tab, onTabChange, idPrefix, variant, phoneHint, code }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  tab: LookTab;
  onTabChange: (tab: LookTab) => void;
  idPrefix: string;
  variant: "rail" | "stacked";
  phoneHint: string;
  code?: ReactNode;
}) {
  const shown = code ? tabs : tabs.filter(item => item.id !== "code");
  const current = shown.find(item => item.id === tab) ?? shown[0];
  const flash = (id: AppearanceSectionId) => {
    const section = document.getElementById(`${idPrefix}-${id}`);
    if (!section) return;
    section.scrollIntoView({ block: "start" });
    section.classList.remove("gen-flash");
    void section.offsetWidth;
    section.classList.add("gen-flash");
  };
  const jumps = current.sections.filter(id => id !== "sketch");
  return <Tabs className="gen-tabs" data-variant={variant} orientation={variant === "rail" ? "vertical" : "horizontal"} value={current.id} onValueChange={value => onTabChange(value as LookTab)}>
    <TabsList className="gen-nav" aria-label="Settings groups">
      {shown.map(item => <TabsTrigger key={item.id} value={item.id} className={item.id === "gallery" ? "gen-nav-apart" : undefined}>{item.icon}<span>{item.label}</span></TabsTrigger>)}
    </TabsList>
    <div className="gen-panel">
      <div className="gen-panel-head">
        <h2 className="t-h3 gen-panel-title">{current.icon}{current.label}</h2>
        {jumps.length > 1 && <nav className="gen-jumps" aria-label={`${current.label} sections`}>
          {jumps.map(id => <button key={id} type="button" className="gen-jump" onClick={() => flash(id)}>{sectionNames[id]}</button>)}
        </nav>}
      </div>
      {shown.map(item => <TabsContent key={item.id} value={item.id} className="gen-scroll">
        {item.id === "code" ? code : <AppearanceControls settings={settings} onChange={onChange} sections={item.sections}
          icons={icons} idPrefix={idPrefix} galleryOnly phoneHint={phoneHint} onJump={part => flash(part)} />}
      </TabsContent>)}
    </div>
  </Tabs>;
}
