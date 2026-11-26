import { useState, type FormEvent } from "react";
import {
  Alert, AlertContent, AlertDescription, AlertTitle, Badge, Button, Card, CodeBlock, Dialog, DialogBody, DialogClose,
  DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, FormField, PageHeader,
  PageHeaderDescription, PageHeaderTitle, RadioGroup, RadioGroupItem, Textarea, useToast,
} from "@momoi-labs/kiso-react";
import { CodeXml, FileJson, Monitor, RotateCcw, Smartphone, SquareTerminal, TriangleAlert, Upload } from "lucide-react";
import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import { LookSettings, ProjectModeBar, type LookTab } from "./look-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { projectShareText, readShare } from "./appearance-share";
import { AppearanceShare, demoSchema } from "./appearance-share-ui";
import { AppearanceUsage } from "./appearance-usage";
import { ThemePreview, type Device } from "./layout-examples";
import {
  checkTuiDivergence, exportProjectHtml, exportRustSnippet, importProjectHtml, projectFromSettings,
  projectPreviewDefaults, settingsFromProject, type ProjectConfig,
} from "./project-config";
import { shopPages } from "./templates/shop";

function resolvedTuiMode(theme: string): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function formatProjectJson(config: ProjectConfig, demos: DemoOptions) {
  return JSON.stringify(JSON.parse(projectShareText(config, demos)), null, 2);
}

export function ThemeGenerator({ settings, onChange, onPreset, onReset, demos, onShare, projectConfig, onImport, onClearProject }: {
  settings: AppearanceSettings;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onPreset: (defined: Partial<AppearanceSettings>) => void;
  onReset: () => void;
  demos: DemoOptions;
  onShare: (settings: AppearanceSettings, demos: DemoOptions, project?: ProjectConfig) => void;
  projectConfig: ProjectConfig | null;
  onImport: (config: ProjectConfig, nextSettings: AppearanceSettings, nextDemos: DemoOptions) => void;
  onClearProject: () => void;
}) {
  const [tab, setTab] = useState<LookTab>("look");
  const [page, setPage] = useState("dashboard");
  const [device, setDevice] = useState<Device>("desktop");

  return <>
    <div className="catalog-heading">
      <PageHeader actions={<>
        <Button size="sm" onClick={onReset}><RotateCcw className="icon" aria-hidden="true" />Reset</Button>
        <AppearanceShare settings={settings} demos={demos} onApply={onShare} />
        <ImportDialog settings={settings} onImport={onImport} />
        <Button variant="primary" size="sm" disabled={tab === "code"} onClick={() => setTab("code")}><CodeXml className="icon" aria-hidden="true" />Export</Button>
      </>}>
        <PageHeaderTitle tabIndex={-1}>Theme generator</PageHeaderTitle>
        <PageHeaderDescription>Build a look, see it on real pages and export it for your project.</PageHeaderDescription>
      </PageHeader>
    </div>
    <div className="gen-workspace">
    <Card className="gen-rail">
      {projectConfig && <ProjectModeBar config={projectConfig} onClear={onClearProject} />}
      <LookSettings settings={settings} onChange={onChange} onPreset={projectConfig ? onPreset : undefined}
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
