// Runs before styles and React so saved preferences apply on first paint.
(() => {
  const { options, phoneKeys, defaults, presetDefaults } = __APPEARANCE_FIELDS__;
  const phoneKey = key => `phone${key[0].toUpperCase()}${key.slice(1)}`;
  const phone = window.matchMedia?.("(max-width: 699px)");
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
  let current = null;
  function apply(value) {
    const settings = validate(value);
    current = settings;
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
    for (const key of ["theme", "accent"]) {
      try { localStorage.setItem(`kiso-${key}`, settings[key]); } catch {}
    }
    try { localStorage.setItem("kiso-gallery-appearance", JSON.stringify({ ...settings, version: 3 })); } catch {}
    return settings;
  }
  window.kisoAppearance = { defaults, presetDefaults, options, read, save, apply };
  apply(read());
  phone?.addEventListener?.("change", () => apply(current ?? read()));
})();
