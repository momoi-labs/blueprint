// Kiso component gallery: a throwaway preview of @momoi-labs/kiso-react.
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComponentGallery } from "./gallery";
import "@momoi-labs/kiso-react/styles.css";
import "./gallery.css";

function App() {
  const [route, setRoute] = useState(
    () => window.location.hash.slice(1) || "components",
  );
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const navigate = () =>
      setRoute(window.location.hash.slice(1) || "components");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <ComponentGallery route={route} theme={theme} onThemeChange={setTheme} />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
