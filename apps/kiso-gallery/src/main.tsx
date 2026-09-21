import { StrictMode, useEffect, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComponentGallery } from "../../../kiso/blocks/react-prototype/src/gallery";
import { LayoutExamples, layouts } from "./layout-examples";
import { Intro } from "./intro";
import { Appearance } from "./appearance";
import type { AppearanceSettings } from "./appearance-settings";
import "@momoi-labs/kiso-react/styles.css";
import "../../../kiso/blocks/react-prototype/src/gallery.css";
import "./app.css";
import "./appearance.css";

function App() {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "intro"
  );
  const [settings, setSettings] = useState(window.kisoAppearance.read);
  const update = (patch: Partial<AppearanceSettings>) => setSettings(current => ({ ...current, ...patch }));

  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1) || "intro");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useLayoutEffect(() => {
    window.kisoAppearance.save(settings);
  }, [settings]);

  return (
    <ComponentGallery
      route={route}
      theme={settings.theme}
      onThemeChange={theme => update({ theme })}
      accent={settings.accent}
      onAccentChange={accent => update({ accent })}
      example={<LayoutExamples route={route} />}
      examples={layouts}
      intro={<Intro />}
      appearance={<Appearance settings={settings} onChange={update} onReset={() => setSettings({ ...window.kisoAppearance.defaults })} />}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
