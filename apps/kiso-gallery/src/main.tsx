import { StrictMode, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AppShell, AppShellMain, Toasts, useToast } from "@momoi-labs/kiso-react";
import { createRoot } from "react-dom/client";
import { ComponentGallery } from "../../../kiso/blocks/react-prototype/src/gallery";
import { LayoutExamples, layouts, phoneFrame, standalone } from "./layout-examples";
import { Intro } from "./intro";
import { TuiGallery, useTuiGallery } from "./tui-gallery";
import { Accents } from "./accents";
import { GallerySettings } from "./gallery-settings";
import type { AppearanceSettings } from "./appearance-settings";
import { readShare, shareParam, type ShareResult } from "./appearance-share";
import { announceShare, demoSchema } from "./appearance-share-ui";
import type { DemoOptions } from "../../../kiso/blocks/react-prototype/src/demo-settings";
import "@momoi-labs/kiso-react/styles.css";
import "../../../kiso/blocks/react-prototype/src/gallery.css";
import "./app.css";
import "./appearance.css";
import "./gallery-settings.css";
import "./accents.css";

// A share link applies and saves its look, then drops the code from the URL.
// The hash keeps the route, so the code lives in the query string.
let incomingLook: ShareResult | null = null;
let incomingDemos: DemoOptions = {};
if (!phoneFrame && !standalone) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get(shareParam);
  if (code !== null) {
    incomingLook = readShare(code, window.kisoAppearance, demoSchema);
    if (incomingLook.settings) window.kisoAppearance.save(incomingLook.settings);
    incomingDemos = incomingLook.demos;
    url.searchParams.delete(shareParam);
    window.history.replaceState(null, "", url);
  }
}

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
  const [demos, setDemos] = useState(incomingDemos);
  const update = useCallback((patch: Partial<AppearanceSettings>) => setSettings(current => ({ ...current, ...patch })), []);
  const onThemeChange = useCallback((theme: string) => update({ theme }), [update]);
  const onAccentChange = useCallback((accent: AppearanceSettings["accent"]) => update({ accent }), [update]);
  const example = <LayoutExamples route={route} accent={settings.accent} theme={settings.theme} />;
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

  return (
    <GallerySettings route={route} settings={settings} onChange={update} demos={demos} onDemosChange={setDemos}
      onReset={() => { setSettings({ ...window.kisoAppearance.defaults }); setDemos({}); }}>
      {(panel, toggle) => <ComponentGallery
        panel={panel}
        settingsToggle={toggle}
        route={route === "appearance" ? "intro" : route}
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
        settingsEnabled
      />}
    </GallerySettings>
  );
}

// Login and the report have no shell of their own. On a desktop they sit in
// the gallery's shell, which carries the paper tone and background; alone, a
// shell of their own gives them the same canvas.
const ownShell = (route: string) => ["dashboard", "crud", "charts"].includes(route.split("/")[1] ?? "dashboard");

// The phone preview frame: the layout alone, following the gallery's saved
// appearance as it changes in the parent page.
function PhoneFrame() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1));
    const appearance = () => window.kisoAppearance.save(window.kisoAppearance.read());
    window.addEventListener("hashchange", navigate);
    window.addEventListener("storage", appearance);
    return () => { window.removeEventListener("hashchange", navigate); window.removeEventListener("storage", appearance); };
  }, []);
  const settings = window.kisoAppearance.read();
  const example = <LayoutExamples route={route} accent={settings.accent} theme={settings.theme} />;
  return ownShell(route)
    ? <div className="layout-phone-document">{example}</div>
    : <AppShell className="layout-phone-document" data-layout="topbar"><AppShellMain>{example}</AppShellMain></AppShell>;
}

// The example alone in a tab, as a product would show it: a bar with its
// controls and the device choice, then the page filling the rest of the
// window, following the gallery's saved appearance.
function Standalone() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1));
  const [settings, setSettings] = useState(window.kisoAppearance.read);
  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1));
    const appearance = () => { const next = window.kisoAppearance.read(); window.kisoAppearance.save(next); setSettings(next); };
    window.addEventListener("hashchange", navigate);
    window.addEventListener("storage", appearance);
    return () => { window.removeEventListener("hashchange", navigate); window.removeEventListener("storage", appearance); };
  }, []);
  // Login and the report have no shell of their own; as in the phone frame,
  // a shell lends them the paper colors.
  const page = <div className="layout-standalone">
    <LayoutExamples route={route} accent={settings.accent} theme={settings.theme} />
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
