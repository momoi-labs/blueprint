import { StrictMode, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComponentGallery } from "../../../kiso/blocks/react-prototype/src/gallery";
import { LayoutExamples, layouts } from "./layout-examples";
import { Intro } from "./intro";
import { GallerySettings } from "./gallery-settings";
import type { AppearanceSettings } from "./appearance-settings";
import "@momoi-labs/kiso-react/styles.css";
import "../../../kiso/blocks/react-prototype/src/gallery.css";
import "./app.css";
import "./appearance.css";
import "./gallery-settings.css";

function App() {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "intro"
  );
  const [settings, setSettings] = useState(window.kisoAppearance.read);
  const update = useCallback((patch: Partial<AppearanceSettings>) => setSettings(current => ({ ...current, ...patch })), []);
  const onThemeChange = useCallback((theme: string) => update({ theme }), [update]);
  const onAccentChange = useCallback((accent: AppearanceSettings["accent"]) => update({ accent }), [update]);
  const example = <LayoutExamples route={route} />;
  const intro = <Intro />;

  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1) || "intro");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useLayoutEffect(() => {
    window.kisoAppearance.save(settings);
  }, [settings]);

  return (
    <GallerySettings route={route} settings={settings} onChange={update} onReset={() => setSettings({ ...window.kisoAppearance.defaults })}>
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
        intro={intro}
        settingsEnabled
      />}
    </GallerySettings>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
