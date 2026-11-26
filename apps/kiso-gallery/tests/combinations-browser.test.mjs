import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { preview } from "vite";
import { test } from "./shard.mjs";
import { openGenerator, tab } from "./settings-tabs.mjs";
import {
  importProjectHtml, projectConfigStorageKey, projectPreviewDefaults, settingsFromProject,
} from "../src/project-config.ts";
import {
  expectedPresetLabels, extractDataAttributes, galleryPresets, kebabToCamel, uniqueDeliveryProjects,
} from "./combination-fixtures.mjs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const sandboxWindow = { matchMedia: () => ({ matches: false, addEventListener() {} }) };
runInNewContext(readFileSync(new URL("../public/appearance-init.js", import.meta.url), "utf8"), {
  window: sandboxWindow,
  document: { documentElement: { dataset: {} } },
  localStorage: { getItem: () => null, setItem() {} },
});
const appearanceSource = sandboxWindow.kisoAppearance;

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

let server;
let browser;
let url;
const pools = new Map();

function attachErrorCollector(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", msg => {
    if (msg.type() !== "error") return;
    const locationUrl = msg.location()?.url ?? "";
    if (locationUrl.startsWith("https://fonts.googleapis.com/") || locationUrl.startsWith("https://fonts.gstatic.com/")) return;
    errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

async function getPool(viewport) {
  if (pools.has(viewport.name)) return pools.get(viewport.name);
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: "dark",
  });
  await context.route("https://fonts.googleapis.com/**", route => route.abort());
  await context.addInitScript(() => {
    window.__kisoUnhandledRejections = [];
    window.addEventListener("unhandledrejection", event => {
      window.__kisoUnhandledRejections.push(String(event.reason));
    });
  });

  const gallery = await context.newPage();
  gallery.setDefaultTimeout(15_000);
  const galleryErrors = attachErrorCollector(gallery);

  const example = await context.newPage();
  example.setDefaultTimeout(15_000);
  const exampleErrors = attachErrorCollector(example);

  const pool = { context, gallery, galleryErrors, example, exampleErrors, initializedGallery: false, initializedExample: false };
  pools.set(viewport.name, pool);
  return pool;
}

before(async () => {
  server = await preview({
    root: fileURLToPath(new URL("../", import.meta.url)),
    configFile: false,
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 0 },
  });
  url = `http://127.0.0.1:${server.httpServer.address().port}/`;
  browser = await chromium.launch();
});

after(async () => {
  for (const pool of pools.values()) await pool.context.close();
  pools.clear();
  await browser?.close();
  if (server) await new Promise(resolve => server.httpServer.close(resolve));
});

function expectedDatasetForPreset(defined, isPhone) {
  const expected = {};
  for (const [key, value] of Object.entries(defined)) {
    if (key.startsWith("phone")) {
      const target = key[5].toLowerCase() + key.slice(6);
      if (isPhone && value !== "inherit") expected[target] = value;
      continue;
    }
    if (key === "theme") {
      expected.theme = value === "system" ? null : value;
      continue;
    }
    const overrideKey = `phone${key[0].toUpperCase()}${key.slice(1)}`;
    const override = defined[overrideKey];
    expected[key] = isPhone && override && override !== "inherit" ? override : value;
  }
  return expected;
}

function buildProjectState(project) {
  const imported = importProjectHtml(project.html, appearanceSource);
  assert.equal(imported.error, undefined, `${project.id}: import error`);
  assert.deepEqual(imported.skipped, [], `${project.id}: import skipped`);
  const dataAttrs = extractDataAttributes(project.html);
  const base = { ...appearanceSource.defaults };
  if (dataAttrs["data-theme"]) base.theme = dataAttrs["data-theme"];
  if (dataAttrs["data-header-width"]) base.headerWidth = dataAttrs["data-header-width"];
  if (dataAttrs["data-landing-bands"]) base.landingBands = dataAttrs["data-landing-bands"];
  const settings = settingsFromProject(imported.config, projectPreviewDefaults(appearanceSource.options, base));
  const expected = {};
  for (const [attr, value] of Object.entries(dataAttrs)) {
    const key = kebabToCamel(attr);
    expected[key] = key === "theme" && value === "system" ? null : value;
  }
  return {
    settings,
    projectConfig: imported.config,
    expectedForWidth: () => expected,
  };
}

function buildPresetState(preset) {
  return {
    settings: preset.look,
    projectConfig: null,
    expectedForWidth: isPhone => expectedDatasetForPreset(preset.defined, isPhone),
  };
}

async function auditFrame(frame, { label, expectedForWidth, requiredSelectors, interactiveSelector }) {
  const report = await frame.evaluate(({ requiredSelectors, interactiveSelector }) => {
    const isPhone = window.innerWidth < 700;
    const rejections = window.__kisoUnhandledRejections ? [...window.__kisoUnhandledRejections] : [];
    if (window.__kisoUnhandledRejections) window.__kisoUnhandledRejections.length = 0;

    const dataset = { ...document.documentElement.dataset };
    const overflow = {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      overflows: document.documentElement.scrollWidth > window.innerWidth + 1,
    };

    const isVisibleBox = el => {
      if (!el) return null;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) return null;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? { width: rect.width, height: rect.height } : null;
    };

    const missingRegions = [];
    for (const [name, selector] of requiredSelectors) {
      const candidates = [...document.querySelectorAll(selector)];
      const visible = candidates.find(el => isVisibleBox(el));
      if (!visible) missingRegions.push(`${name} (${selector})`);
    }

    const interactiveMatches = [...document.querySelectorAll(interactiveSelector)].filter(el => isVisibleBox(el));

    const parseColor = value => {
      if (!value || value === "transparent") return null;
      const rgba = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i);
      if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
      const srgb = value.match(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i);
      if (srgb) return [Math.round(Number(srgb[1]) * 255), Math.round(Number(srgb[2]) * 255), Math.round(Number(srgb[3]) * 255), srgb[4] === undefined ? 1 : Number(srgb[4])];
      return null;
    };

    const probe = document.createElement("span");
    probe.style.position = "fixed";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    document.body.appendChild(probe);

    const brokenTokens = [];
    const resolvedTokens = {};
    const requiredTokens = [
      "--color-background",
      "--color-surface",
      "--color-foreground",
      "--color-muted-foreground",
      "--color-border",
      "--color-primary",
      "--color-primary-foreground",
      "--color-card",
      "--color-card-foreground",
      "--color-link",
    ];
    for (const token of requiredTokens) {
      probe.style.backgroundColor = "rgba(0, 0, 0, 0)";
      probe.style.backgroundColor = `var(${token})`;
      const resolved = getComputedStyle(probe).backgroundColor;
      const parsed = parseColor(resolved);
      if (!parsed || parsed[3] <= 0) brokenTokens.push(`${token} -> ${resolved}`);
      else resolvedTokens[token] = resolved;
    }
    probe.remove();

    const sameTokenPairs = [];
    for (const [fg, bg] of [
      ["--color-foreground", "--color-background"],
      ["--color-card-foreground", "--color-card"],
      ["--color-primary-foreground", "--color-primary"],
      ["--color-foreground", "--color-surface"],
    ]) {
      if (resolvedTokens[fg] && resolvedTokens[bg] && resolvedTokens[fg] === resolvedTokens[bg]) {
        sameTokenPairs.push(`${fg} === ${bg} (${resolvedTokens[fg]})`);
      }
    }

    const effectiveBg = el => {
      for (let node = el; node; node = node.parentElement) {
        const bg = getComputedStyle(node).backgroundColor;
        const parsed = parseColor(bg);
        if (parsed && parsed[3] >= 0.9) return { value: bg, rgba: parsed };
      }
      const fallback = resolvedTokens["--color-background"] ?? getComputedStyle(document.body).backgroundColor;
      return { value: fallback, rgba: parseColor(fallback) };
    };

    const unreadableText = [];
    const textNodes = [...document.querySelectorAll('h1, h2, h3, p, button, a, td, th, label, [data-slot="page-header-title"]')]
      .filter(el => !el.closest("[hidden], [aria-hidden='true'], .sr-only, .visually-hidden"))
      .filter(el => (el.textContent ?? "").trim().length > 0)
      .filter(el => {
        const box = isVisibleBox(el);
        return box && box.width > 1 && box.height > 1;
      })
      .slice(0, 40);

    for (const el of textNodes) {
      const style = getComputedStyle(el);
      const colorParsed = parseColor(style.color);
      if (!colorParsed || colorParsed[3] <= 0) {
        unreadableText.push(`invalid color on ${el.tagName.toLowerCase()}: ${style.color}`);
        continue;
      }
      const bg = effectiveBg(el);
      if (bg.rgba && bg.rgba[3] >= 0.9 && style.color === bg.value) {
        unreadableText.push(`color === backgroundColor (${style.color}) on ${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 30)}"`);
      }
    }

    return {
      isPhone,
      rejections,
      dataset,
      overflow,
      missingRegions,
      interactiveCount: interactiveMatches.length,
      brokenTokens,
      sameTokenPairs,
      unreadableText,
    };
  }, { requiredSelectors, interactiveSelector });

  assert.deepEqual(report.rejections, [], `${label}: unhandled promise rejections`);

  const expected = expectedForWidth(report.isPhone);
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actual = report.dataset[key] ?? null;
    assert.equal(actual, expectedValue, `${label}: html dataset.${key} (phone=${report.isPhone})`);
  }

  assert.equal(
    report.overflow.overflows,
    false,
    `${label}: horizontal overflow scrollWidth=${report.overflow.scrollWidth} innerWidth=${report.overflow.innerWidth}`,
  );
  assert.deepEqual(report.missingRegions, [], `${label}: collapsed or missing regions`);
  assert.ok(report.interactiveCount > 0, `${label}: no visible primary interactive elements`);
  assert.deepEqual(report.brokenTokens, [], `${label}: broken CSS variable fallbacks`);
  assert.deepEqual(report.sameTokenPairs, [], `${label}: colliding semantic token pairs`);
  assert.deepEqual(report.unreadableText, [], `${label}: unreadable text containers`);
}

async function applyCombinationToStorage(page, state) {
  await page.evaluate(({ settings, projectConfig, storageKey }) => {
    if (projectConfig) localStorage.setItem(storageKey, JSON.stringify(projectConfig));
    else localStorage.removeItem(storageKey);
    window.kisoAppearance.save(settings);
  }, { settings: state.settings, projectConfig: state.projectConfig, storageKey: projectConfigStorageKey });
}

async function validateCombination(name, state) {
  for (const viewport of viewports) {
    const pool = await getPool(viewport);
    pool.galleryErrors.length = 0;
    pool.exampleErrors.length = 0;

    if (!pool.initializedGallery) {
      await pool.gallery.goto(`${url}#theme`);
      await pool.gallery.locator(".catalog-generator").waitFor();
      pool.initializedGallery = true;
    }

    await applyCombinationToStorage(pool.gallery, state);
    if (new URL(pool.gallery.url()).hash !== "#theme") {
      await pool.gallery.evaluate(() => { window.location.hash = "#theme"; });
    }
    await pool.gallery.reload();
    await pool.gallery.locator('.catalog-heading [data-slot="page-header-title"]', { hasText: "Theme generator" }).waitFor();
    if (state.projectConfig) await pool.gallery.locator(".gen-project-bar").waitFor();
    else assert.equal(await pool.gallery.locator(".gen-project-bar").count(), 0, `${name} [${viewport.name}] #theme: no project bar for preset`);
    await pool.gallery.frameLocator(".gen-frame iframe").locator(".layout-stats").waitFor();
    await pool.gallery.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    await auditFrame(pool.gallery.mainFrame(), {
      label: `${name} [${viewport.name}] #theme`,
      expectedForWidth: state.expectedForWidth,
      requiredSelectors: [
        ["shell header", ".catalog-header"],
        ["main region", ".catalog-main.catalog-generator"],
        ["page title", '.catalog-heading [data-slot="page-header-title"]'],
        ["generator rail", ".gen-rail"],
        ["generator preview", ".gen-preview"],
        ["preview iframe", ".gen-frame iframe"],
      ],
      interactiveSelector: ".catalog-heading button, .gen-rail button",
    });

    const previewFrame = pool.gallery.frames().find(frame => frame.url().includes("phone-frame"));
    assert.ok(previewFrame, `${name} [${viewport.name}] #theme: preview iframe attached`);
    await previewFrame.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    await auditFrame(previewFrame, {
      label: `${name} [${viewport.name}] #theme iframe`,
      expectedForWidth: state.expectedForWidth,
      requiredSelectors: [
        ["iframe shell header", 'header, [data-slot="app-shell-header"], .app-shell-header'],
        ["iframe main region", '.app-shell > main, .app-shell > [data-slot="app-shell-main"]'],
        ["iframe dashboard stats", ".layout-stats"],
      ],
      interactiveSelector: "main button, main a, header button",
    });

    await pool.gallery.evaluate(() => { window.location.hash = "#components/button"; });
    await pool.gallery.locator('.catalog-heading [data-slot="page-header-title"]', { hasText: "Button" }).waitFor();
    await pool.gallery.locator(".catalog-detail .catalog-preview button").first().waitFor();
    await pool.gallery.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    await auditFrame(pool.gallery.mainFrame(), {
      label: `${name} [${viewport.name}] #components/button`,
      expectedForWidth: state.expectedForWidth,
      requiredSelectors: [
        ["shell header", ".catalog-header"],
        ["main region", ".catalog-main.catalog-detail"],
        ["page title", '.catalog-heading [data-slot="page-header-title"]'],
        ["component preview", ".catalog-preview"],
      ],
      interactiveSelector: ".catalog-preview button",
    });

    if (!pool.initializedExample) {
      await pool.example.goto(`${url}?phone-frame#example/dashboard`);
      pool.initializedExample = true;
    } else {
      await pool.example.evaluate(() => {
        window.kisoAppearance.apply(window.kisoAppearance.read());
        window.dispatchEvent(new StorageEvent("storage", { key: "kiso-gallery-appearance", storageArea: localStorage }));
        window.location.hash = "#example/dashboard";
      });
    }
    await pool.example.locator('[data-slot="page-header-title"]', { hasText: "Overview" }).waitFor();
    await pool.example.locator(".layout-stats").waitFor();
    await pool.example.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    await auditFrame(pool.example.mainFrame(), {
      label: `${name} [${viewport.name}] #example/dashboard`,
      expectedForWidth: state.expectedForWidth,
      requiredSelectors: [
        ["shell header", 'header, [data-slot="app-shell-header"], .app-shell-header'],
        ["main region", '.app-shell > main, .app-shell > [data-slot="app-shell-main"]'],
        ["page title", '[data-slot="page-header-title"]'],
        ["dashboard stats", ".layout-stats"],
      ],
      interactiveSelector: "main button, main a, header button",
    });

    await pool.example.evaluate(() => { window.location.hash = "#example/crud"; });
    await pool.example.locator('[data-slot="page-header-title"]', { hasText: "Products" }).waitFor();
    await pool.example.locator(".list-filters").waitFor();
    await pool.example.locator("table tbody tr").first().waitFor();
    await pool.example.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    await auditFrame(pool.example.mainFrame(), {
      label: `${name} [${viewport.name}] #example/crud`,
      expectedForWidth: state.expectedForWidth,
      requiredSelectors: [
        ["shell header", 'header, [data-slot="app-shell-header"], .app-shell-header'],
        ["main region", '.app-shell > main, .app-shell > [data-slot="app-shell-main"]'],
        ["page title", '[data-slot="page-header-title"]'],
        ["products table", "table"],
      ],
      interactiveSelector: "main button, main input, main a",
    });

    await pool.example.evaluate(() => { window.location.hash = "#example/landing"; });
    await pool.example.locator("#storefront-title").waitFor();
    await pool.example.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    await auditFrame(pool.example.mainFrame(), {
      label: `${name} [${viewport.name}] #example/landing`,
      expectedForWidth: state.expectedForWidth,
      requiredSelectors: [
        ["landing brand header", ".studio-hero .brand"],
        ["main region", 'main, [data-slot="app-shell-main"]'],
        ["hero title", "#storefront-title"],
        ["product card", ".studio-live-example"],
      ],
      interactiveSelector: ".intro-actions button, .intro-actions a",
    });

    assert.deepEqual(pool.galleryErrors, [], `${name} [${viewport.name}]: gallery errors`);
    assert.deepEqual(pool.exampleErrors, [], `${name} [${viewport.name}]: example errors`);
  }
}

test("Theme Generator renders all 11 gallery presets", async () => {
  const pool = await getPool(viewports[0]);
  pool.galleryErrors.length = 0;
  await pool.gallery.goto(`${url}#theme`);
  pool.initializedGallery = true;
  const panel = await openGenerator(pool.gallery);
  await tab(panel, "Presets");
  const renderedLabels = await panel.locator(".appearance-composition[aria-pressed]").evaluateAll(
    nodes => nodes.map(node => node.textContent.trim()),
  );
  assert.deepEqual(renderedLabels, expectedPresetLabels);
  assert.deepEqual(pool.galleryErrors, []);
});

for (const preset of galleryPresets) {
  test(`preset: ${preset.label} renders cleanly across desktop and phone views`, async () => {
    await validateCombination(`preset/${preset.label}`, buildPresetState(preset));
  });
}

for (const project of uniqueDeliveryProjects) {
  const coverLabel = project.covers.length > 1 ? `${project.id} (${project.covers.join(", ")})` : project.id;
  test(`project: ${coverLabel} renders cleanly across desktop and phone views`, async () => {
    await validateCombination(`project/${project.id}`, buildProjectState(project));
  });
}
