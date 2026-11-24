const tabs = {
  Look: ["Colors and type", "Presets", "Accent", "Neutral", "Primary action", "Typeface", "Visual style"],
  Layout: ["Shell", "Header", "Page", "Gallery only", "Theme", "Application frame", "Outer spacing", "Landing bands", "Header size", "Header width", "Page width", "Page alignment"],
  Frame: ["Panels", "Corner marks", "Where it applies", "Outer frame style", "Border style", "Panel shadow", "Border detail", "Corner type", "Corner size", "Panel fill", "Mark size",
    "Apply frames to", "Apply marks to", "Mark clearance", "Outer shadow", "Outer border", "Outer corners", "Outer marks"],
  Canvas: ["Background", "Charts", "Canvas background", "Paper tone", "Pattern placement", "Background strength", "Chart line", "Chart fill", "Chart layout", "Chart legend"],
  Phone: ["Phone", "Phone shadow", "Phone background", "Phone border", "Phone corners", "Phone marks", "Phone panel fill"],
  Code: ["Use in code"],
};

/** Opens a tab by its label, or by the name of a section or group inside it. */
export async function tab(panel, name) {
  const label = tabs[name] ? name : Object.keys(tabs).find(key => tabs[key].includes(name));
  if (!label) throw new Error(`No settings tab holds ${name}`);
  const trigger = panel.getByRole("tab", { name: label, exact: true });
  if (await trigger.getAttribute("aria-selected") !== "true") await trigger.click();
}

/** A choice group, with its tab open. */
export async function field(panel, name) {
  await tab(panel, name);
  return panel.getByRole("group", { name, exact: true }).or(panel.getByRole("radiogroup", { name, exact: true }));
}

export async function openGenerator(page) {
  const root = page.locator(".catalog-generator");
  if (!await root.isVisible()) {
    await page.evaluate(() => { window.kisoTestBack = ["#theme", "#appearance"].includes(location.hash) ? "#intro" : location.hash; location.hash = "#theme"; });
    await root.waitFor({ timeout: 30_000 });
  }
  return root;
}

export async function closeGenerator(page) {
  if (!await page.locator(".gen-workspace").isVisible()) return;
  await page.evaluate(() => { location.hash = window.kisoTestBack || "#intro"; });
  await page.locator(".gen-workspace").waitFor({ state: "detached", timeout: 30_000 });
}

export async function openOptions(page) {
  const panel = page.locator("#gallery-settings");
  if (!await panel.isVisible()) await page.locator('a[href="#gallery-settings"]').first().click();
  await panel.waitFor();
  return panel;
}
