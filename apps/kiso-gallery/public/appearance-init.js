// Runs before styles and React so saved preferences apply on first paint.
(() => {
  const options = {
    theme: ["system", "light", "dark"],
    accent: ["violet", "terracotta", "teal", "cobalt", "nocturne"],
    borderStyle: ["solid", "none", "rail", "dash", "bevel", "double", "base", "offset"],
    cornerStyle: ["square", "rounded", "asym"],
    cornerMarks: ["ticks", "none", "brackets", "arcs", "dots"],
    cornerSize: ["medium", "small", "large", "off"],
    markSize: ["medium", "small", "large"],
    visualStyle: ["default", "editorial"],
    appShell: ["default", "inset"],
  };
  const defaults = Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values[0]]));
  const attributes = { theme: "theme", accent: "accent", borderStyle: "borderStyle", cornerStyle: "cornerStyle", cornerMarks: "cornerMarks", cornerSize: "cornerSize", markSize: "markSize", visualStyle: "visualStyle", appShell: "appShell" };
  function validate(value) {
    // Split the old radius presets into border and corner choices.
    if (["square", "soft", "round", "asym"].includes(value?.borderStyle)) {
      value = { ...value, cornerStyle: value.cornerStyle ?? value.borderStyle, borderStyle: "solid" };
    }
    // Earlier decorative borders used rounded corners.
    if (value?.cornerStyle === undefined && options.borderStyle.includes(value?.borderStyle) && !["solid", "none"].includes(value.borderStyle)) {
      value = { ...value, cornerStyle: "soft" };
    }
    // Fold the earlier rounded presets into one type and the nearest size.
    if (value?.cornerStyle === "soft") {
      value = { ...value, cornerStyle: "rounded", cornerSize: value.cornerSize === "off" ? "off" : value.cornerSize === "large" ? "medium" : "small" };
    } else if (value?.cornerStyle === "round") {
      value = { ...value, cornerStyle: "rounded" };
    }
    // Carry forward the earlier heading-only preference.
    if (value?.visualStyle === undefined && options.visualStyle.includes(value?.pageHeader)) {
      value = { ...value, visualStyle: value.pageHeader };
    }
    // Preserve hidden marks from the earlier Off size setting.
    if (value?.markSize === "off") value = { ...value, cornerMarks: "none", markSize: "medium" };
    const settings = Object.fromEntries(Object.entries(options).map(([key, values]) => [
      key, value && values.includes(value[key]) ? value[key] : defaults[key],
    ]));
    if (settings.cornerStyle !== "square" && settings.cornerSize === "off") settings.cornerSize = defaults.cornerSize;
    return settings;
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
    delete document.documentElement.dataset.pageHeader;
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
