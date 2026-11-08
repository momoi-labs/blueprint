// Runs before styles and React so saved preferences apply on first paint.
(() => {
  const options = {
    theme: ["system", "light", "dark"],
    accent: ["violet", "terracotta", "teal", "cobalt", "nocturne", "tangerine", "red", "gold", "lime", "plum", "stone", "steel", "snes"],
    neutral: ["warm", "zinc"],
    primary: ["accent", "contrast"],
    typeface: ["inter", "dm-sans"],
    chartLine: ["straight", "stepped", "curved"],
    chartFill: ["none", "dots", "tint", "squares", "scanlines"],
    chartLayout: ["standard", "compact", "split"],
    chartLegend: ["table", "inline", "sidebar"],
    shadowStyle: ["none", "hard", "soft", "auto"],
    borderStyle: ["solid", "none", "rail", "dash", "bevel", "double", "base", "offset", "manga", "brush"],
    cornerStyle: ["square", "rounded", "asym", "pixel"],
    cornerMarks: ["ticks", "none", "brackets", "arcs", "dots", "diagonal"],
    cornerSize: ["medium", "small", "large", "off"],
    markSize: ["medium", "small", "large"],
    visualStyle: ["default", "editorial"],
    appShell: ["default", "inset"],
    headerVariant: ["default", "plain", "floating"],
    headerSize: ["default", "compact", "editorial"],
    headerWidth: ["page", "outset"],
    appShellOuter: ["auto", "full", "compact", "none"],
    pageWidth: ["full", "contained"],
    pageAlign: ["start", "center", "end"],
    frameScope: ["all", "panels", "outer"],
    markScope: ["panels", "all", "outer"],
    markClearance: ["normal", "sheet"],
    backgroundStyle: ["solid", "dots", "grid", "crosses", "construction", "guides", "fibers", "momoi", "momoi-repeat", "enso", "checker", "glow", "stripes", "rings"],
    backgroundStrength: ["quiet", "visible"],
    backgroundPlacement: ["both", "inside", "outside"],
    frameDetail: ["medium", "small", "large"],
    paperTone: ["theme", "accent"],
    panelFill: ["solid", "translucent", "glass"],
  };
  for (const key of ["borderStyle", "cornerStyle", "cornerMarks", "shadowStyle"]) {
    options[`outer${key[0].toUpperCase()}${key.slice(1)}`] = ["inherit", ...options[key]];
  }
  // Phone overrides replace a main choice below 700px wide.
  const phoneKeys = ["backgroundStyle", "borderStyle", "cornerStyle", "cornerMarks", "panelFill", "shadowStyle"];
  const phoneKey = key => `phone${key[0].toUpperCase()}${key.slice(1)}`;
  for (const key of phoneKeys) options[phoneKey(key)] = ["inherit", ...options[key]];
  const phone = window.matchMedia?.("(max-width: 699px)");
  const presetDefaults = Object.fromEntries(Object.entries(options).map(([key, values]) => [key, values[0]]));
  Object.assign(presetDefaults, { cornerStyle: "pixel", cornerSize: "small", appShell: "inset", backgroundStyle: "fibers", visualStyle: "editorial" });
  const defaults = { ...presetDefaults };
  Object.assign(defaults, { theme: "system", accent: "snes", chartLine: "straight", chartFill: "none", chartLayout: "standard", chartLegend: "table", shadowStyle: "soft", borderStyle: "solid", cornerStyle: "rounded", cornerMarks: "none", cornerSize: "large", markSize: "medium", visualStyle: "default", appShell: "inset", headerVariant: "floating", headerSize: "default", headerWidth: "page", appShellOuter: "full", pageWidth: "contained", pageAlign: "center", frameScope: "all", markScope: "panels", markClearance: "normal", backgroundStyle: "glow", backgroundStrength: "quiet", backgroundPlacement: "both", frameDetail: "medium", paperTone: "theme", panelFill: "glass", outerBorderStyle: "none", outerCornerStyle: "square", outerCornerMarks: "none", outerShadowStyle: "none", phoneBackgroundStyle: "inherit", phoneBorderStyle: "inherit", phoneCornerStyle: "inherit", phoneCornerMarks: "inherit", phonePanelFill: "inherit", phoneShadowStyle: "inherit" });
  const attributes = Object.fromEntries(Object.keys(options).filter(key => !key.startsWith("phone")).map(key => [key, key]));
  // The earlier single chart style is a preset of line and fill.
  const chartPresets = { solid: ["straight", "none"], pixel: ["stepped", "none"], halftone: ["straight", "dots"], rounded: ["curved", "none"] };
  function validate(value) {
    const preset = chartPresets[value?.chartStyle];
    if (preset) value = { ...value, chartLine: value.chartLine ?? preset[0], chartFill: value.chartFill ?? preset[1] };
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
    try {
      const parsed = JSON.parse(localStorage.getItem("kiso-gallery-appearance") || "null");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && (
        Object.keys(options).some(key => options[key].includes(parsed[key])) ||
        options.visualStyle.includes(parsed.pageHeader) || chartPresets[parsed.chartStyle] ||
        ["square", "soft", "round", "asym"].includes(parsed.borderStyle) || parsed.markSize === "off"
      )) {
        saved = parsed;
        if (saved.shadowStyle === undefined && (saved.version === undefined || saved.version < 3)) saved.shadowStyle = "auto";
      }
    } catch {}
    // Keep existing theme/accent preferences compatible with their selectors.
    for (const key of ["theme", "accent"]) {
      try { const value = localStorage.getItem(`kiso-${key}`); if (value !== null) saved[key] = value; } catch {}
    }
    // Earlier studies assigned Pixel size to frameDetail. Migrate only on read,
    // so later ink changes cannot overwrite the independent corner size.
    if ((saved.version === undefined || saved.version < 2) && (saved.cornerStyle === "pixel" || saved.outerCornerStyle === "pixel") && options.frameDetail.includes(saved.frameDetail)) {
      saved = { ...saved, cornerSize: saved.frameDetail };
    }
    return validate(saved);
  }
  function apply(value) {
    const settings = validate(value);
    const shown = { ...settings };
    if (phone?.matches) for (const key of phoneKeys) if (settings[phoneKey(key)] !== "inherit") shown[key] = settings[phoneKey(key)];
    delete document.documentElement.dataset.pageHeader;
    delete document.documentElement.dataset.chartStyle;
    for (const [key, attr] of Object.entries(attributes)) {
      if (key === "theme" && shown[key] === "system") delete document.documentElement.dataset[attr];
      else document.documentElement.dataset[attr] = shown[key];
    }
    return settings;
  }
  function save(value) {
    const settings = apply(value);
    try { localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ ...settings, version: 3 })); } catch {}
    for (const key of ["theme", "accent"]) {
      try { localStorage.setItem(`kiso-${key}`, settings[key]); } catch {}
    }
    return settings;
  }
  window.kisoAppearance = { defaults, presetDefaults, options, read, save };
  apply(read());
  phone?.addEventListener?.("change", () => apply(read()));
})();
