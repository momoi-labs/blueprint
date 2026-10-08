// Runs before styles and React so saved preferences apply on first paint.
(() => {
  const options = {
    theme: ["system", "light", "dark"],
    accent: ["violet", "terracotta", "teal", "cobalt", "nocturne", "tangerine", "red", "gold", "lime"],
    chartStyle: ["solid", "pixel", "halftone", "rounded"],
    borderStyle: ["solid", "none", "rail", "dash", "bevel", "double", "base", "offset", "manga", "brush"],
    cornerStyle: ["square", "rounded", "asym", "pixel"],
    cornerMarks: ["ticks", "none", "brackets", "arcs", "dots", "diagonal"],
    cornerSize: ["medium", "small", "large", "off"],
    markSize: ["medium", "small", "large"],
    visualStyle: ["default", "editorial"],
    appShell: ["default", "inset"],
    frameScope: ["all", "panels", "outer"],
    markScope: ["panels", "all", "outer"],
    markClearance: ["normal", "sheet"],
    backgroundStyle: ["solid", "dots", "grid", "crosses", "construction", "guides", "fibers", "momoi", "momoi-repeat"],
    backgroundStrength: ["quiet", "visible"],
    backgroundPlacement: ["both", "inside", "outside"],
    frameDetail: ["medium", "small", "large"],
    paperTone: ["theme", "accent"],
    panelFill: ["solid", "translucent"],
  };
  for (const key of ["borderStyle", "cornerStyle", "cornerMarks"]) {
    options[`outer${key[0].toUpperCase()}${key.slice(1)}`] = ["inherit", ...options[key]];
  }
  const defaults = Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values[0]]));
  Object.assign(defaults, { cornerStyle: "pixel", cornerSize: "small", appShell: "inset", backgroundStyle: "fibers", visualStyle: "editorial" });
  const attributes = Object.fromEntries(Object.keys(options).map(key => [key, key]));
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
    if ((settings.cornerStyle !== "square" || ["rounded", "asym", "pixel"].includes(settings.outerCornerStyle)) && settings.cornerSize === "off") settings.cornerSize = defaults.cornerSize;
    return settings;
  }
  function read() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("kiso-gallery-appearance") || "{}") || {}; } catch {}
    // Keep existing theme/accent preferences compatible with their selectors.
    for (const key of ["theme", "accent"]) {
      try { const value = localStorage.getItem(`kiso-${key}`); if (value !== null) saved[key] = value; } catch {}
    }
    // Earlier studies assigned Pixel size to frameDetail. Migrate only on read,
    // so later ink changes cannot overwrite the independent corner size.
    if (saved.version !== 2 && (saved.cornerStyle === "pixel" || saved.outerCornerStyle === "pixel") && options.frameDetail.includes(saved.frameDetail)) {
      saved = { ...saved, cornerSize: saved.frameDetail };
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
    try { localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ ...settings, version: 2 })); } catch {}
    for (const key of ["theme", "accent"]) {
      try { localStorage.setItem(`kiso-${key}`, settings[key]); } catch {}
    }
    return settings;
  }
  window.kisoAppearance = { defaults, read, save };
  apply(read());
})();
