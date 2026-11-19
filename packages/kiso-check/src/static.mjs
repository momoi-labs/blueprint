import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { cssRules } from "./css.mjs";
import { findElements, lineIndex, parseImports, skipBalanced, stringLiterals, stripScriptComments } from "./source.mjs";

export const KISO_REACT = "@momoi-labs/kiso-react";
const COMPONENTS = ["ConsoleShell", "ListPage", "FormPage", "DetailPage"];
const SCREEN_TAGS = ["PageHeader", ...COMPONENTS];
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "coverage", "generated", "__generated__", "__tests__"]);
const SCRIPT = /\.(tsx|jsx|ts|js)$/;
const SKIP_FILE = /\.d\.ts$|\.(gen|generated|min|test|spec|stories)\.[^.]+$/;
const MINIMUM = { "@momoi-labs/kiso": "1.11.0", "@momoi-labs/kiso-react": "0.33.0" };

export function listFiles(dir) {
  const files = [];
  const walk = current => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(full); continue; }
      if (!entry.isFile() || SKIP_FILE.test(entry.name)) continue;
      if (SCRIPT.test(entry.name) || entry.name.endsWith(".css")) files.push(full);
    }
  };
  walk(dir);
  return files.sort();
}

const compare = (a, b) => {
  const left = a.split("-")[0].split(".").map(Number);
  const right = b.split("-")[0].split(".").map(Number);
  for (let index = 0; index < 3; index++) if ((left[index] || 0) !== (right[index] || 0)) return (left[index] || 0) - (right[index] || 0);
  return 0;
};

function findUp(start, name) {
  let current = path.resolve(start);
  while (true) {
    const candidate = path.join(current, name);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function findDown(start, name, depth) {
  const found = [];
  const walk = (current, left) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (existsSync(path.join(full, name))) found.push(full);
      if (left > 1) walk(full, left - 1);
    }
  };
  walk(path.resolve(start), depth);
  return found.sort();
}

export function readVersions(dir) {
  const result = readVersionsAt(dir);
  if (Object.values(result).some(Boolean)) return result;
  for (const below of findDown(dir, "package-lock.json", 2)) {
    const nested = readVersionsAt(below);
    if (Object.values(nested).some(Boolean)) return nested;
  }
  return result;
}

function readVersionsAt(dir) {
  const result = {};
  const lockfile = findUp(dir, "package-lock.json");
  const lock = lockfile ? JSON.parse(readFileSync(lockfile, "utf8")) : null;
  const lockText = lockfile ? readFileSync(lockfile, "utf8") : "";
  const relative = lockfile ? path.relative(path.dirname(lockfile), path.resolve(dir)).split(path.sep) : [];
  for (const name of Object.keys(MINIMUM)) {
    let found = null;
    if (lock?.packages) {
      for (let depth = relative.length; depth >= 0 && !found; depth--) {
        const prefix = relative.slice(0, depth).filter(Boolean).join("/");
        const key = `${prefix ? `${prefix}/` : ""}node_modules/${name}`;
        const entry = lock.packages[key];
        if (entry) {
          const at = lockText.indexOf(`"${key}"`);
          found = { version: entry.version ?? null, link: Boolean(entry.link), source: lockfile, line: at >= 0 ? lineIndex(lockText)(at) : 1 };
        }
      }
    }
    if (!found) {
      const manifest = findUp(dir, path.join("node_modules", name, "package.json"));
      if (manifest) {
        const real = JSON.parse(readFileSync(manifest, "utf8"));
        found = { version: real.version ?? null, link: false, source: manifest, line: 1 };
      }
    }
    result[name] = found;
  }
  return result;
}

function versionFindings(versions, dir) {
  const findings = [];
  for (const [name, minimum] of Object.entries(MINIMUM)) {
    const found = versions[name];
    if (!found) {
      findings.push({ id: "P1", file: path.resolve(dir), line: 0, message: `${name} not found in a package-lock.json or node_modules above this folder` });
      continue;
    }
    if (found.link || !found.version) continue;
    if (compare(found.version, minimum) < 0) {
      findings.push({ id: "P1", file: found.source, line: found.line, message: `${name} ${found.version} has no ConsoleShell, ListPage, FormPage or DetailPage. Upgrade to ${minimum} or later` });
    }
  }
  return findings;
}

const CSS_SELECTORS = [
  [/\.sidebar-header(?![\w-])/, ".sidebar-header"],
  [/\.topbar(?![\w-])/, ".topbar"],
  [/\.app-shell-phone-brand(?![\w-])/, ".app-shell-phone-brand"],
  [/\.app-shell(?![\w-])/, ".app-shell"],
  [/\[data-width/, "[data-width]"],
  [/\.detail-tabs(?![\w-])/, ".detail-tabs"],
  [/\.card-content\s*>\s*\.empty(?![\w-])/, ".card-content > .empty"],
];

function checkCss(text, file) {
  const findings = [];
  const seen = new Set();
  const add = (line, message) => {
    if (seen.has(line)) return;
    seen.add(line);
    findings.push({ id: "P3", file, line, message });
  };
  for (const rule of cssRules(text)) {
    const selector = rule.selectors.join(", ");
    const hit = CSS_SELECTORS.find(([pattern]) => pattern.test(selector));
    if (hit) add(rule.line, `rule on ${hit[1]} restates CSS that Kiso ships. Delete it`);
    for (const declaration of rule.declarations) {
      if (declaration.property === "--app-shell-brand-inset") add(declaration.line, "sets --app-shell-brand-inset, which Kiso ships");
      if (declaration.property === "box-shadow" && /\binset\b/.test(declaration.value) && /--color-primary/.test(declaration.value)) add(declaration.line, "inset --color-primary stripe, which Kiso ships");
      if (/^padding/.test(declaration.property) && /\.(nav-item|sidebar-link-icon|sidebar-link)(?![\w-])/.test(selector)) add(declaration.line, "nav icon padding, which Kiso ships");
      if (/^(min-)?(height|block-size)$/.test(declaration.property) && /\.page-header(?![\w-])|\[data-slot=["']?page-header["']?\]/.test(selector)) add(declaration.line, ".page-header height, which Kiso ships");
      if (/^border(-[a-z]+)*-radius$/.test(declaration.property) && /\.form-page(?![\w-])/.test(selector)) add(declaration.line, ".form-page radius, which Kiso ships");
    }
  }
  return findings.sort((a, b) => a.line - b.line);
}

function analyzeScript(raw, file) {
  const code = stripScriptComments(raw);
  const lineOf = lineIndex(code);
  const imports = parseImports(code);
  const localName = name => {
    for (const item of imports) for (const spec of item.names) if (spec.imported === name) return { local: spec.local, source: item.source, offset: item.offset };
    return null;
  };
  const uses = {};
  const findings = [];
  for (const name of COMPONENTS) {
    const imported = localName(name);
    const tag = imported?.local ?? name;
    const rendered = findElements(code, tag);
    const definition = code.match(new RegExp(`(?:function|class)\\s+${name}\\b|(?:const|let|var)\\s+${name}\\s*[=:]`));
    if (imported || rendered.length) uses[name] = { source: imported?.source ?? (definition ? "local" : null), rendered: rendered.length > 0 };
    const id = name === "ConsoleShell" ? "P2" : "S1";
    if (definition) findings.push({ id, file, line: lineOf(definition.index), message: `defines its own ${name}. Use the one from ${KISO_REACT}` });
    if (imported && imported.source !== KISO_REACT) findings.push({ id, file, line: lineOf(imported.offset), message: `imports ${name} from ${imported.source}, not ${KISO_REACT}` });
  }
  const renders = SCREEN_TAGS.filter(name => findElements(code, localName(name)?.local ?? name).length);
  const applicationShell = findElements(code, localName("ApplicationShell")?.local ?? "ApplicationShell");
  const shell = renders.includes("ConsoleShell") || applicationShell.length > 0;
  for (const element of applicationShell) {
    findings.push({ id: "P2", file, line: lineOf(element.start), message: `builds the shell from ApplicationShell. Use ConsoleShell from ${KISO_REACT}` });
  }

  const pageMarks = [];
  for (const match of code.matchAll(/\bclass(?:Name)?\s*=\s*/g)) {
    const start = match.index + match[0].length;
    const first = code[start];
    let value = "";
    if (first === "{") value = code.slice(start, skipBalanced(code, start));
    else if (first === '"' || first === "'") value = code.slice(start, code.indexOf(first, start + 1) + 1);
    for (const literal of stringLiterals(value)) {
      if (literal.value.split(/\s+/).includes("page")) pageMarks.push({ offset: start + literal.offset, what: 'className "page"' });
    }
  }
  for (const element of findElements(code, "Page")) pageMarks.push({ offset: element.start, what: "<Page>" });

  for (const element of findElements(code, localName("PageHeaderDescription")?.local ?? "PageHeaderDescription")) {
    findings.push({ id: "S3", file, line: lineOf(element.start), message: "PageHeaderDescription under the header. Delete it" });
  }

  const s4 = new Map();
  const emptyStates = findElements(code, localName("EmptyState")?.local ?? "EmptyState");
  for (const element of emptyStates) {
    for (const attr of element.attrs) {
      if (attr.name === "action" || attr.name === "actions") s4.set(lineOf(attr.start), `EmptyState takes an ${attr.name} prop. An empty state has no button`);
    }
    if (element.inner === undefined) continue;
    for (const button of element.inner.matchAll(/<Button(?=[\s/>])/g)) {
      s4.set(lineOf(element.innerStart + button.index), "Button inside an EmptyState. Delete it, the header holds the action");
    }
  }
  for (const element of findElements(code, localName("EmptyStateActions")?.local ?? "EmptyStateActions")) {
    if (!element.inner || /<Button(?=[\s/>])/.test(element.inner) || !element.inner.trim()) continue;
    s4.set(lineOf(element.start), "EmptyStateActions holds an action. An empty state has no button");
  }
  for (const element of findElements(code, localName("EmptyStateActions")?.local ?? "EmptyStateActions")) {
    if (!element.inner) continue;
    for (const button of element.inner.matchAll(/<Button(?=[\s/>])/g)) {
      const line = lineOf(element.innerStart + button.index);
      if (!s4.has(line)) s4.set(line, "Button inside EmptyStateActions. An empty state has no button");
    }
  }
  for (const [line, message] of s4) findings.push({ id: "S4", file, line, message });

  const disabledAt = value => /^\{\s*false\s*\}$/.test(value ?? "") ? null : true;
  for (const header of findElements(code, localName("PageHeader")?.local ?? "PageHeader")) {
    const actions = header.attrs.find(attr => attr.name === "actions");
    if (!actions?.value) continue;
    for (const button of findElements(actions.value, "Button")) {
      const disabled = button.attrs.find(attr => attr.name === "disabled");
      if (disabled && disabledAt(disabled.value)) findings.push({ id: "S5", file, line: lineOf(actions.valueStart + disabled.start), message: "the PageHeader action is disabled. Hide it until the user can use it" });
    }
  }
  for (const match of code.matchAll(/\baction\s*=\s*\{\{/g)) {
    const start = match.index + match[0].length - 2;
    const value = code.slice(start, skipBalanced(code, start));
    const disabled = value.match(/\bdisabled\s*:\s*([^,}\n]+)/);
    if (disabled && disabled[1].trim() !== "false") findings.push({ id: "S5", file, line: lineOf(start + disabled.index), message: "the action prop is disabled. Hide it until the user can use it" });
  }

  return { uses, renders, shell, screen: renders.length > 0, pageMarks, findings, lineOf };
}

export function checkStatic(dir) {
  const root = path.resolve(dir);
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`${dir} is not a folder`);
  const versions = readVersions(root);
  const findings = versionFindings(versions, root);
  const files = [];
  const scripts = [];
  const all = listFiles(root);
  for (const file of all) {
    const text = readFileSync(file, "utf8");
    if (file.endsWith(".css")) {
      const own = checkCss(text, file);
      findings.push(...own);
      if (own.length) files.push({ file, screen: false, uses: {}, renders: [], findings: own });
      continue;
    }
    const result = analyzeScript(text, file);
    scripts.push({ file, result });
  }
  const shellFiles = scripts.filter(item => item.result.shell).map(item => item.file);
  for (const { file, result } of scripts) {
    if (shellFiles.length && !result.shell) {
      for (const mark of result.pageMarks) {
        result.findings.push({ id: "S2", file, line: result.lineOf(mark.offset), message: `${mark.what} inside the shell, which already renders the one .page` });
      }
    }
    result.findings.sort((a, b) => a.line - b.line || a.id.localeCompare(b.id));
    findings.push(...result.findings);
    if (result.screen || result.findings.length || result.shell) {
      files.push({ file, screen: result.screen, shell: result.shell, uses: result.uses, renders: result.renders, findings: result.findings });
    }
  }
  files.sort((a, b) => a.file.localeCompare(b.file));
  const byId = {};
  for (const finding of findings) byId[finding.id] = (byId[finding.id] ?? 0) + 1;
  const pick = name => versions[name] && { version: versions[name].version, link: versions[name].link, source: versions[name].source };
  return {
    mode: "static",
    dir: root,
    versions: { kiso: pick("@momoi-labs/kiso"), kisoReact: pick("@momoi-labs/kiso-react") },
    shellFiles,
    files,
    findings,
    summary: { scanned: all.length, screens: files.filter(item => item.screen).length, findings: findings.length, byId },
  };
}

export function formatStatic(report) {
  const out = [];
  const rel = file => path.relative(report.dir, file) || ".";
  const version = item => item ? (item.link ? "workspace link" : item.version ?? "unknown") : "not found";
  out.push(`kiso ${version(report.versions.kiso)}, kiso-react ${version(report.versions.kisoReact)}`);
  out.push(`shell: ${report.shellFiles.length ? report.shellFiles.map(rel).join(", ") : "none found"}`);
  const project = report.findings.filter(finding => finding.id === "P1");
  for (const finding of project) out.push(`  ${finding.id}  ${finding.line ? `${finding.file}:${finding.line}` : finding.file}  ${finding.message}`);
  for (const item of report.files) {
    out.push("");
    const uses = Object.entries(item.uses).map(([name, use]) => `${name} from ${use.source ?? "nowhere"}`);
    const tags = [item.shell ? "shell" : null, item.screen ? "screen" : null].filter(Boolean).join(", ");
    out.push(`${rel(item.file)}${tags ? `  (${tags})` : ""}`);
    if (item.screen || item.shell) out.push(`  renders: ${item.renders.join(", ") || "none"}${uses.length ? `; uses ${uses.join(", ")}` : ""}`);
    for (const finding of item.findings) out.push(`  ${finding.id}  ${rel(finding.file)}:${finding.line}  ${finding.message}`);
  }
  out.push("");
  const counts = Object.entries(report.summary.byId).sort().map(([id, count]) => `${id} ${count}`).join(", ");
  out.push(report.findings.length
    ? `${report.findings.length} findings in ${report.summary.scanned} files, ${report.summary.screens} screen files (${counts})`
    : `no findings in ${report.summary.scanned} files, ${report.summary.screens} screen files`);
  return out.join("\n");
}
