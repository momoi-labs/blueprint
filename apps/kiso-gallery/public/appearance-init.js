// Runs before styles and React so saved preferences apply on first paint.
(() => {
  const options = {
    theme: ["system", "light", "dark"],
    accent: ["violet", "terracotta", "teal", "cobalt", "nocturne"],
    borderStyle: ["square", "soft", "round", "asym", "rail", "dash", "bevel", "double", "base", "offset"],
    cornerMarks: ["ticks", "none", "brackets", "arcs", "dots"],
    cornerSize: ["medium", "small", "large", "off"],
    markSize: ["medium", "small", "large"],
  };
  const defaults = Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values[0]]));
  const attributes = { theme: "theme", accent: "accent", borderStyle: "borderStyle", cornerMarks: "cornerMarks", cornerSize: "cornerSize", markSize: "markSize" };
  function validate(value) {
    // Preserve hidden marks from the earlier Off size setting.
    if (value?.markSize === "off") value = { ...value, cornerMarks: "none", markSize: "medium" };
    return Object.fromEntries(Object.entries(options).map(([key, values]) => [
      key, value && values.includes(value[key]) ? value[key] : defaults[key],
    ]));
  }
  function read() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("kiso-gallery-appearance") || "{}") || {}; } catch {}
    // Keep existing theme/accent preferences compatible with their selectors.
    for (const key of ["theme", "accent"]) {
      try { const value = localStorage.getItem(`kiso-${key}`); if (value !== null) saved[key] = value; } catch {}
    }
    return validate(saved);
  }
  function apply(value) {
    const settings = validate(value);
    for (const [key, attr] of Object.entries(attributes)) {
      if (key === "theme" && settings[key] === "system") delete document.documentElement.dataset[attr];
      else document.documentElement.dataset[attr] = settings[key];
    }
    return settings;
  }
  function save(value) {
    const settings = apply(value);
    try { localStorage.setItem("kiso-gallery-appearance", JSON.stringify(settings)); } catch {}
    for (const key of ["theme", "accent"]) {
      try { localStorage.setItem(`kiso-${key}`, settings[key]); } catch {}
    }
    return settings;
  }
  window.kisoAppearance = { defaults, read, save };
  apply(read());
})();
