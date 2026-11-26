import { useState, type FormEvent } from "react";
import {
  Alert, AlertContent, AlertDescription, AlertTitle, Badge, Button, Card, CodeBlock, Dialog, DialogBody, DialogClose,
  DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, FormField, PageHeader,
  PageHeaderDescription, PageHeaderTitle, RadioGroup, RadioGroupItem, Textarea, useToast,
} from "@momoi-labs/kiso-react";
import { CodeXml, FileJson, Monitor, RotateCcw, Smartphone, SquareTerminal, TriangleAlert, Upload, X } from "lucide-react";
import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { LookSettings, type LookTab } from "./look-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { projectShareText, readShare } from "./appearance-share";
import { AppearanceShare, demoSchema } from "./appearance-share-ui";
import { AppearanceUsage } from "./appearance-usage";
import { ThemePreview, type Device } from "./layout-examples";
import {
  applyPresetToProjectConfig, checkTuiDivergence, exportProjectHtml, exportRustSnippet, fieldClass, importProjectHtml,
  type ProjectConfig,
} from "./project-config";
import { shopPages } from "./templates/shop";

function projectPreviewDefaults(options: Window["kisoAppearance"]["options"], current: AppearanceSettings): AppearanceSettings {
  return {
    ...Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values[0]])),
    shadowStyle: "auto",
    frameScope: "panels",
    theme: current.theme,
    headerWidth: current.headerWidth,
    landingBands: current.landingBands,
  } as unknown as AppearanceSettings;
}

function settingsFromProject(config: ProjectConfig, defaults: AppearanceSettings): AppearanceSettings {
  const next = { ...defaults } as unknown as Record<string, string>;
  for (const section of [config.appearance, config.structure]) {
    for (const [key, value] of Object.entries(section)) {
      if (key === "phone" && value && typeof value === "object") {
        for (const [name, override] of Object.entries(value)) {
          next[`phone${name[0].toUpperCase()}${name.slice(1)}`] = override;
        }
      } else if (typeof value === "string") {
        next[key] = value;
      }
    }
  }
  return next as unknown as AppearanceSettings;
}

function projectFromSettings(settings: AppearanceSettings, demos?: DemoOptions): ProjectConfig {
  const config = applyPresetToProjectConfig({ appearance: {}, structure: {}, rest: [{ name: "lang", value: "en" }] }, settings);
  return demos && Object.keys(demos).length ? { ...config, demos } : config;
}

function countProjectFields(config: ProjectConfig) {
  const appearance = Object.keys(config.appearance).filter(key => key !== "phone").length;
  const phone = Object.keys(config.appearance.phone ?? {}).length;
  const structure = Object.keys(config.structure).length;
  return appearance + phone + structure;
}

function exportedPatch(patch: Partial<AppearanceSettings>): Partial<AppearanceSettings> {
  return Object.fromEntries(
    Object.entries(patch).filter(([key]) => fieldClass[key as keyof AppearanceSettings] !== "galleryOnly"),
  ) as Partial<AppearanceSettings>;
}

function resolvedTuiMode(theme: string): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function formatProjectJson(config: ProjectConfig, demos: DemoOptions) {
  return JSON.stringify(JSON.parse(projectShareText(config, demos)), null, 2);
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
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);

  const handleChange = (patch: Partial<AppearanceSettings>) => {
    onChange(patch);
    setProjectConfig(current => current ? applyPresetToProjectConfig(current, patch) : null);
  };

  const handlePreset = (defined: Partial<AppearanceSettings>) => {
    onChange(exportedPatch(defined));
    setProjectConfig(current => current ? applyPresetToProjectConfig(current, defined) : null);
  };

  const handleReset = () => {
    setProjectConfig(null);
    onReset();
  };

  const handleShareApply = (next: AppearanceSettings, nextDemos: DemoOptions, project?: ProjectConfig) => {
    setProjectConfig(project ?? null);
    onShare(project ? settingsFromProject(project, projectPreviewDefaults(window.kisoAppearance.options, settings)) : next, nextDemos);
  };

  const handleImport = (config: ProjectConfig, nextSettings: AppearanceSettings, nextDemos: DemoOptions) => {
    setProjectConfig(config);
    onShare(nextSettings, nextDemos);
  };

  return <>
    <div className="catalog-heading">
      <PageHeader actions={<>
        <Button size="sm" onClick={handleReset}><RotateCcw className="icon" aria-hidden="true" />Reset</Button>
        <AppearanceShare settings={settings} demos={demos} onApply={handleShareApply} />
        <ImportDialog settings={settings} onImport={handleImport} />
        <Button variant="primary" size="sm" disabled={tab === "code"} onClick={() => setTab("code")}><CodeXml className="icon" aria-hidden="true" />Export</Button>
      </>}>
        <PageHeaderTitle tabIndex={-1}>Theme generator</PageHeaderTitle>
        <PageHeaderDescription>Build a look, see it on real pages and export it for your project.</PageHeaderDescription>
      </PageHeader>
    </div>
    <div className="gen-workspace">
    <Card className="gen-rail">
      {projectConfig && <ProjectModeBar config={projectConfig} onClear={() => setProjectConfig(null)} />}
      <LookSettings settings={settings} onChange={handleChange} onPreset={projectConfig ? handlePreset : undefined}
        tab={tab} onTabChange={setTab} idPrefix="gen" variant="rail"
        phoneHint="Switch the preview to Phone to see the result."
        code={<><ExportPanel settings={settings} demos={demos} projectConfig={projectConfig} device={device} /><AppearanceUsage settings={settings} diagram={demos.diagram} /></>} />
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

function ProjectModeBar({ config, onClear }: { config: ProjectConfig; onClear: () => void }) {
  const fields = countProjectFields(config);
  const preserved = config.rest?.length ?? 0;
  const parts = [`${fields} ${fields === 1 ? "field" : "fields"}`];
  if (preserved > 0) parts.push(`${preserved} preserved`);
  if (config.tui) parts.push("TUI");
  return (
    <div className="gen-project-bar" role="status">
      <div className="gen-project-meta">
        <Badge variant="info">Project config</Badge>
        <span className="muted t-label">{parts.join(" · ")}</span>
      </div>
      <Button size="xs" variant="ghost" onClick={onClear}>
        <X className="icon" aria-hidden="true" />Clear project
      </Button>
    </div>
  );
}

function ImportDialog({ settings, onImport }: {
  settings: AppearanceSettings;
  onImport: (config: ProjectConfig, nextSettings: AppearanceSettings, nextDemos: DemoOptions) => void;
}) {
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setError("");
  };

  const announce = (skipped: string[]) => {
    if (skipped.length) {
      notify("warning", `Project imported, ${skipped.length} skipped`, `Skipped: ${skipped.join(", ")}.`);
    } else {
      notify("success", "Project imported");
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Nothing to import. Paste an <html> tag, JSON config, or share link, then retry.");
      return;
    }
    if (/<html/i.test(trimmed)) {
      const result = importProjectHtml(trimmed, window.kisoAppearance);
      if (!result.config) {
        setError(`${result.error ?? "Could not read HTML."} Paste an <html> tag from index.html, then retry.`);
        return;
      }
      const nextSettings = settingsFromProject(result.config, projectPreviewDefaults(window.kisoAppearance.options, settings));
      onImport(result.config, nextSettings, {});
      setOpen(false);
      setText("");
      setError("");
      announce(result.skipped);
      return;
    }
    const result = readShare(trimmed, window.kisoAppearance, demoSchema);
    if (!result.settings) {
      setError(`${result.error ?? "Could not read input."} Paste an <html> tag, JSON config, or share link, then retry.`);
      return;
    }
    const config = result.project ?? projectFromSettings(result.settings, result.demos);
    const nextSettings = result.project
      ? settingsFromProject(result.project, projectPreviewDefaults(window.kisoAppearance.options, settings))
      : result.settings;
    onImport(config, nextSettings, result.demos);
    setOpen(false);
    setText("");
    setError("");
    announce(result.skipped);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm"><Upload className="icon" aria-hidden="true" />Import</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="dialog-scroll" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Import project config</DialogTitle>
            <DialogDescription>
              Paste an <code>&lt;html&gt;</code> tag from <code>index.html</code>, a v3/v2/v1 JSON config, or a share link.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <FormField
              label="Project HTML, JSON, or share link"
              hint="Unset attributes stay absent when exported. Phone scripts in <head> are imported too."
              error={error || undefined}
            >
              <Textarea
                className="gen-import-input"
                rows={8}
                value={text}
                onChange={event => {
                  setText(event.target.value);
                  if (error) setError("");
                }}
                placeholder={'<html lang="en" data-accent="cobalt" data-corner-style="rounded">'}
                spellCheck={false}
              />
            </FormField>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild><Button type="button">Cancel</Button></DialogClose>
            <Button variant="primary" type="submit">Import</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExportPanel({ settings, demos, projectConfig, device }: {
  settings: AppearanceSettings;
  demos: DemoOptions;
  projectConfig: ProjectConfig | null;
  device: Device;
}) {
  const activeConfig = projectConfig ?? projectFromSettings(settings, demos);
  const htmlCode = exportProjectHtml(activeConfig);
  const jsonCode = formatProjectJson(activeConfig, demos);
  const showTui = Boolean(projectConfig?.tui) || device === "tui";
  const tuiConfig: ProjectConfig = projectConfig?.tui
    ? projectConfig
    : { ...activeConfig, tui: { accent: settings.accent, mode: resolvedTuiMode(settings.theme) } };
  const rustCode = showTui ? exportRustSnippet(tuiConfig) : null;
  const warnings = projectConfig?.tui ? checkTuiDivergence(projectConfig) : [];

  return <>
    <section className="appearance-section gen-export" aria-labelledby="gen-export-title">
      <h3 id="gen-export-title" className="t-caps"><CodeXml className="icon" aria-hidden="true" />Project HTML</h3>
      <p className="muted t-label">
        {projectConfig
          ? "Only set fields and preserved attributes are written. Unset fields stay absent."
          : <>Put these attributes on the <code>&lt;html&gt;</code> tag of your project's <code>index.html</code>. Phone overrides add a small script.</>}
      </p>
      <CodeBlock code={htmlCode} copy="HTML" wrap />
      <p className="muted t-label gen-row"><Badge>Gallery only</Badge>Light or dark, header width and landing bands stay out. Your project takes light or dark from the reader.</p>
    </section>
    <section className="appearance-section gen-export-json" aria-labelledby="gen-json-title">
      <h3 id="gen-json-title" className="t-caps"><FileJson className="icon" aria-hidden="true" />Config JSON (v3)</h3>
      <p className="muted t-label">Version 3 config separating appearance, structure, and optional TUI settings.</p>
      <CodeBlock code={jsonCode} copy="JSON" wrap />
    </section>
    {showTui && (
      <section className="appearance-section gen-export-rust" aria-labelledby="gen-rust-title">
        <h3 id="gen-rust-title" className="t-caps"><SquareTerminal className="icon" aria-hidden="true" />Rust (tui-kiso)</h3>
        {warnings.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert className="icon" aria-hidden="true" />
            <AlertContent>
              <AlertTitle>Web and TUI settings diverge</AlertTitle>
              {warnings.length === 1
                ? <AlertDescription>{warnings[0]}</AlertDescription>
                : <div className="alert-body"><ul className="gen-warnings">{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
            </AlertContent>
          </Alert>
        )}
        {rustCode
          ? <CodeBlock code={rustCode} copy="Rust" wrap />
          : <p className="muted t-label">No tui-kiso snippet matches the current TUI accent.</p>}
      </section>
    )}
  </>;
}
