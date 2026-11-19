#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { runLive } from "../src/live.mjs";
import { UsageError } from "../src/live/lib.mjs";
import { checkStatic, formatStatic } from "../src/static.mjs";

const USAGE = `usage:
  kiso-check <dir> [--json]
  kiso-check --url <url> [--url <url>...] [options]
  kiso-check --cases <file> --base <url> [options]

Static mode reads the sources under <dir>. Live mode measures the running app.

Live options:
  --url <url>            a page, or <list|form|detail>:<left|center|right|full>=<url>
  --cases <file>         one case per line: <kind> <layout> <url> [#hash or selector]
  --base <url>           resolves relative case urls
  --only <names>         any of jump,layouts,margins,brand
  --widths <list>        viewport widths (jump 1280, layouts and margins 1280,390)
  --themes <list>        layouts themes (light,dark)
  --theme <light|dark>   theme for jump and margins
  --phone <px>           margins: widest phone width (699)
  --brand <url>          brand: the list url
  --brand-other <url>    brand: a url without a header action
  --shots <dir>          brand: save screenshots
  --table                layouts: print the measured boxes
  --verbose              margins: print every block
  --json                 print one JSON object

Exit codes: 0 clean, 1 findings or a failed measurement, 2 usage or runtime error.`;

const OPTIONS = {
  json: { type: "boolean" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean" },
  url: { type: "string", multiple: true },
  cases: { type: "string" },
  base: { type: "string" },
  only: { type: "string" },
  widths: { type: "string" },
  themes: { type: "string" },
  theme: { type: "string" },
  phone: { type: "string" },
  brand: { type: "string" },
  "brand-other": { type: "string" },
  shots: { type: "string" },
  table: { type: "boolean" },
  verbose: { type: "boolean" },
};

function fail(message) {
  console.error(message);
  process.exit(2);
}

let parsed;
try {
  parsed = parseArgs({ args: process.argv.slice(2), options: OPTIONS, allowPositionals: true });
} catch (error) {
  fail(`${error.message}\n\n${USAGE}`);
}
const { values: options, positionals } = parsed;

if (options.help) {
  console.log(USAGE);
  process.exit(0);
}
if (options.version) {
  console.log(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
  process.exit(0);
}

const live = Boolean(options.url || options.cases || options.brand);
if (live && positionals.length) fail(`pass a folder or live options, not both\n\n${USAGE}`);
if (!live && positionals.length !== 1) fail(USAGE);

try {
  if (live) {
    const log = options.json ? () => {} : line => console.log(line);
    const report = await runLive(options, log);
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else console.log(report.ok ? "all measurements pass" : `failed: ${report.measurements.filter(item => !item.ok).map(item => item.name).join(", ")}`);
    process.exit(report.ok ? 0 : 1);
  } else {
    const report = checkStatic(positionals[0]);
    console.log(options.json ? JSON.stringify(report, null, 2) : formatStatic(report));
    process.exit(report.findings.length ? 1 : 0);
  }
} catch (error) {
  fail(error instanceof UsageError ? error.message : `kiso-check: ${error.message}`);
}
