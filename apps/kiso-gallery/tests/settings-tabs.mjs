// The Appearance panel groups its settings in tabs. Below 1024px the tabs are
// sections, one open at a time. These helpers open the tab that holds a
// section or a choice group, so tests can then work on its contents.
const tabs = {
  Look: ["Colors", "Presets", "Theme", "Accent"],
  Canvas: ["Background", "Charts", "Canvas background", "Paper tone", "Pattern placement", "Background strength", "Panel fill"],
  Frame: ["Main style", "Where to apply", "Layout", "Border style", "Border detail", "Corner type", "Corner size", "Corner marks", "Mark size",
    "Apply frames to", "Apply marks to", "Mark clearance", "Outer border", "Outer corners", "Outer marks", "Visual style", "Application frame", "Outer frame"],
  Phone: ["Phone", "Phone background", "Phone border", "Phone corners", "Phone marks", "Phone panel fill"],
  Code: ["Use in code"],
};

/** Opens a tab by its label, or by the name of a section or group inside it. */
export async function tab(panel, name) {
  const label = tabs[name] ? name : Object.keys(tabs).find(key => tabs[key].includes(name));
  if (!label) throw new Error(`No settings tab holds ${name}`);
  const trigger = panel.getByRole("tab", { name: label, exact: true });
  if (await trigger.isVisible()) {
    if (await trigger.getAttribute("aria-selected") !== "true") await trigger.click();
    return;
  }
  const header = panel.locator(".tabs-section").filter({ hasText: new RegExp(`^${label}$`) });
  if (await header.getAttribute("aria-expanded") !== "true") await header.click();
}

/** A choice group, with its tab open. */
export async function field(panel, name) {
  await tab(panel, name);
  return panel.getByRole("group", { name, exact: true });
}
