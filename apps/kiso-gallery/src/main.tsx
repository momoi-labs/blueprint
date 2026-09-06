import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComponentGallery } from "../../../kiso/blocks/react-prototype/src/gallery";
import { LayoutExamples } from "./layout-examples";
import { Intro } from "./intro";
import "@momoi-labs/kiso-react/styles.css";
import "../../../kiso/blocks/react-prototype/src/gallery.css";
import "./app.css";

function App() {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "intro"
  );
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const navigate = () => setRoute(window.location.hash.slice(1) || "intro");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <ComponentGallery
      route={route}
      theme={theme}
      onThemeChange={setTheme}
      example={<LayoutExamples route={route} />}
      intro={<Intro />}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
