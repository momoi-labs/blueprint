import { StrictMode, useCallback, useEffect, useLayoutEffect, useState, type SetStateAction } from "react";
import { AppShell, AppShellMain, Toasts, useToast } from "@momoi-labs/kiso-react";
import { createRoot } from "react-dom/client";
import { ComponentGallery } from "../../../kiso/blocks/react-prototype/src/gallery";
import { LayoutExamples, layouts, phoneFrame, standalone } from "./layout-examples";
import { KisoBrand } from "./kiso-brand";
import { Intro } from "./intro";
import { TuiGallery, useTuiGallery } from "./tui-gallery";
import { Accents } from "./accents";
import { ThemeGenerator } from "./theme-generator";
import { GallerySettings } from "./gallery-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { readShare, shareParam, type ShareResult } from "./appearance-share";
import { announceShare, demoSchema } from "./appearance-share-ui";
import {
  applyPresetToProjectConfig, exportedPatch, parseProjectConfig, projectConfigStorageKey,
  projectPreviewDefaults, settingsFromProject, type ProjectConfig,
} from "./project-config";
import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import "@momoi-labs/kiso-react/styles.css";
import "../../../kiso/blocks/react-prototype/src/gallery.css";
import "./app.css";
import "./appearance.css";
import "./gallery-settings.css";
import "./accents.css";
import "./theme-generator.css";

const readSavedProject = () => {
  try {
    return parseProjectConfig(localStorage.getItem(projectConfigStorageKey), window.kisoAppearance);
  } catch {
    return null;
  }
};
const saveProject = (config: ProjectConfig | null) => {
  try {
    if (config) localStorage.setItem(projectConfigStorageKey, JSON.stringify(config));
    else localStorage.removeItem(projectConfigStorageKey);
  } catch {
    return;
  }
};

// A share link applies and saves its look, then drops the code from the URL.
// The hash keeps the route, so the code lives in the query string.
let incomingLook: ShareResult | null = null;
let incomingDemos: DemoOptions = {};
if (!phoneFrame && !standalone) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get(shareParam);
  if (code !== null) {
    incomingLook = readShare(code, window.kisoAppearance, demoSchema);
    if (incomingLook.project) {
      saveProject(incomingLook.project);
      window.kisoAppearance.save(settingsFromProject(
        incomingLook.project,
        projectPreviewDefaults(window.kisoAppearance.options, window.kisoAppearance.read()),
      ));
    } else if (incomingLook.settings) {
      saveProject(null);
      window.kisoAppearance.save(incomingLook.settings);
    }
    incomingDemos = incomingLook.demos;
    url.searchParams.delete(shareParam);
    window.history.replaceState(null, "", url);
  }
}

// A frame URL can carry a look for itself alone. It applies without saving,
// so a measured or linked frame does not change the reader's gallery.
let frameLook: AppearanceSettings | null = null;
if (phoneFrame || standalone) {
  const code = new URLSearchParams(window.location.search).get(shareParam);
  const result = code === null ? null : readShare(code, window.kisoAppearance, demoSchema);
  const look = result?.project
    ? settingsFromProject(result.project, projectPreviewDefaults(window.kisoAppearance.options, window.kisoAppearance.read()))
    : result?.settings ?? null;
  if (look) frameLook = window.kisoAppearance.apply(look);
}
const readLook = () => frameLook ?? window.kisoAppearance.read();
const keepLook = (next: AppearanceSettings) => frameLook ? (frameLook = window.kisoAppearance.apply(next)) : window.kisoAppearance.save(next);

function App() {
  const notify = useToast();
  useEffect(() => {
    const look = incomingLook;
    incomingLook = null;
    if (look) announceShare(look, notify);
  }, [notify]);
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "intro"
  );
  const [settings, setSettings] = useState(window.kisoAppearance.read);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(readSavedProject);
  const [demos, setDemos] = useState<DemoOptions>(() => incomingLook?.settings ? incomingDemos : (projectConfig?.demos ?? {}));
  const update = useCallback((patch: Partial<AppearanceSettings>) => {
    setSettings(current => ({ ...current, ...patch }));
    const exported = exportedPatch(patch);
    if (Object.keys(exported).length) {
      setProjectConfig(current => current ? applyPresetToProjectConfig(current, exported) : null);
    }
  }, []);
  const applyPreset = useCallback((defined: Partial<AppearanceSettings>) => {
    const exported = exportedPatch(defined);
    if (Object.keys(exported).length) {
      setSettings(current => ({ ...current, ...exported }));
      setProjectConfig(current => current ? applyPresetToProjectConfig(current, exported) : null);
    }
  }, []);
  const updateDemos = useCallback((next: SetStateAction<DemoOptions>) => {
    const resolved = typeof next === "function" ? next(demos) : next;
    setDemos(resolved);
    const cleaned = Object.fromEntries(Object.entries(resolved).filter(([, values]) => Object.keys(values).length));
    setProjectConfig(current => {
      if (!current) return null;
      const updated = { ...current };
      if (Object.keys(cleaned).length) updated.demos = cleaned;
      else delete updated.demos;
      return updated;
    });
  }, [demos]);
  const onThemeChange = useCallback((theme: string) => update({ theme }), [update]);
  const onAccentChange = useCallback((accent: AppearanceSettings["accent"]) => update({ accent }), [update]);
  const example = <LayoutExamples route={route} accent={settings.accent} theme={settings.theme} onThemeChange={onThemeChange} />;
  const intro = <Intro />;
  const tui = useTuiGallery(route === "tui" || route.startsWith("tui/"));
  const terminal = <TuiGallery route={route} data={tui} accent={settings.accent} theme={settings.theme} />;
  const terminalPages = tui && tui !== "failed" ? tui.pages.map((page) => ({ id: page.id, label: page.name })) : [];

  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1) || "intro");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useLayoutEffect(() => {
    window.kisoAppearance.save(settings);
  }, [settings]);
  useLayoutEffect(() => {
    saveProject(projectConfig);
  }, [projectConfig]);
  useEffect(() => {
    const follow = (event: StorageEvent) => {
      if (event.key === null || event.key === "kiso-gallery-appearance") setSettings(window.kisoAppearance.read());
      if (event.key === null || event.key === projectConfigStorageKey) {
        const saved = readSavedProject();
        setProjectConfig(saved);
        setDemos(saved?.demos ?? {});
      }
    };
    window.addEventListener("storage", follow);
    return () => window.removeEventListener("storage", follow);
  }, []);
  const reset = useCallback(() => {
    setProjectConfig(null);
    setSettings({ ...window.kisoAppearance.defaults });
    setDemos({});
  }, []);
  const applyShare = useCallback((next: AppearanceSettings, nextDemos: DemoOptions, project?: ProjectConfig) => {
    setProjectConfig(project ?? null);
    setSettings(current => project
      ? settingsFromProject(project, projectPreviewDefaults(window.kisoAppearance.options, current))
      : next);
    setDemos(nextDemos);
  }, []);
  const importProject = useCallback((config: ProjectConfig, nextSettings: AppearanceSettings, nextDemos: DemoOptions) => {
    setProjectConfig(config);
    setSettings(nextSettings);
    setDemos(nextDemos);
  }, []);
  const clearProject = useCallback(() => {
    setProjectConfig(null);
  }, []);
  useEffect(() => {
    if (route === "appearance") window.location.replace("#theme");
  }, [route]);

  return (
    <GallerySettings settings={settings} onChange={update} onPreset={applyPreset} projectConfig={projectConfig} onClearProject={clearProject}
      demos={demos} onDemosChange={updateDemos} lookDisabled={route === "theme" || route === "appearance"}
      lookNote={route === "tui" || route.startsWith("tui/") ? "The terminal follows the accent and light or dark. Other settings change the page around it." : undefined}>
      {(panel, chip) => <ComponentGallery
        panel={panel}
        tools={route === "theme" || route === "appearance" ? undefined : chip}
        route={route === "appearance" ? "theme" : route}
        brand={<KisoBrand />}
        version={import.meta.env.VITE_KISO_VERSION}
        theme={settings.theme}
        onThemeChange={onThemeChange}
        accent={settings.accent}
        onAccentChange={onAccentChange}
        example={example}
        examples={layouts}
        terminal={terminal}
        terminalPages={terminalPages}
        intro={intro}
        accents={<Accents />}
        generator={<ThemeGenerator settings={settings} onChange={update} onPreset={applyPreset} onReset={reset} demos={demos} onShare={applyShare}
          projectConfig={projectConfig} onImport={importProject} onClearProject={clearProject} />}
        settingsEnabled
      />}
    </GallerySettings>
  );
}

// Login and the landing page have no shell of their own. On a desktop they
// sit in the gallery's shell, which carries the paper tone and background;
// alone, a shell of their own gives them the same canvas.
const ownShell = (route: string) => ["dashboard", "crud", "charts", "reports", "report"].includes(route.split("/")[1] ?? "login");

// The phone preview frame: the layout alone, following the gallery's saved
// appearance as it changes in the parent page.
function PhoneFrame() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1));
  const [settings, setSettings] = useState(readLook);
  useEffect(() => {
    const navigate = () => {
      const next = window.location.hash.slice(1);
      setRoute(next);
      try {
        const outer = window.parent.location;
        if (window.parent !== window && next.startsWith("example/") && outer.hash.startsWith("#example/") && outer.hash !== `#${next}`) outer.hash = next;
      } catch {
        return;
      }
    };
    const appearance = (event: StorageEvent) => { if (!frameLook && (event.key === null || event.key === "kiso-gallery-appearance")) setSettings(window.kisoAppearance.apply(window.kisoAppearance.read())); };
    if (!frameLook) setSettings(window.kisoAppearance.apply(window.kisoAppearance.read()));
    window.addEventListener("hashchange", navigate);
    window.addEventListener("storage", appearance);
    return () => { window.removeEventListener("hashchange", navigate); window.removeEventListener("storage", appearance); };
  }, []);
  const onThemeChange = (theme: string) => setSettings(keepLook({ ...settings, theme } as AppearanceSettings));
  const example = <LayoutExamples route={route} accent={settings.accent} theme={settings.theme} onThemeChange={onThemeChange} />;
  return ownShell(route)
    ? <div className="layout-phone-document">{example}</div>
    : <AppShell className="layout-phone-document" data-layout="topbar"><AppShellMain>{example}</AppShellMain></AppShell>;
}

// The example alone in a tab, as a product would show it: a bar with its
// controls and the device choice, then the page filling the rest of the
// window, following the gallery's saved appearance.
function Standalone() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1));
  const [settings, setSettings] = useState(readLook);
  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1));
    const appearance = (event: StorageEvent) => { if (!frameLook && (event.key === null || event.key === "kiso-gallery-appearance")) setSettings(window.kisoAppearance.apply(window.kisoAppearance.read())); };
    if (!frameLook) setSettings(window.kisoAppearance.apply(window.kisoAppearance.read()));
    window.addEventListener("hashchange", navigate);
    window.addEventListener("storage", appearance);
    return () => { window.removeEventListener("hashchange", navigate); window.removeEventListener("storage", appearance); };
  }, []);
  // Login and the landing page have no shell of their own; as in the phone
  // frame, a shell lends them the paper colors.
  const onThemeChange = (theme: string) => setSettings(keepLook({ ...settings, theme } as AppearanceSettings));
  const page = <div className="layout-standalone">
    <LayoutExamples route={route} accent={settings.accent} theme={settings.theme} onThemeChange={onThemeChange} />
  </div>;
  return !ownShell(route)
    ? <AppShell className="layout-standalone-shell" data-layout="topbar"><AppShellMain>{page}</AppShellMain></AppShell>
    : page;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toasts>{phoneFrame ? <PhoneFrame /> : standalone ? <Standalone /> : <App />}</Toasts>
  </StrictMode>
);
