import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkStatic } from "../src/static.mjs";

const fixture = name => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
const bin = fileURLToPath(new URL("../bin/kiso-check.mjs", import.meta.url));
const found = report => report.findings.map(finding => `${finding.id} ${finding.file.split("/fixtures/")[1]}:${finding.line}`).sort();

test("a clean product has no findings", () => {
  const report = checkStatic(fixture("clean"));
  assert.deepEqual(found(report), []);
  assert.equal(report.versions.kiso.version, "1.11.0");
  assert.deepEqual(report.shellFiles.map(file => file.split("/").pop()), ["App.tsx"]);
  const list = report.files.find(item => item.file.endsWith("ClustersList.tsx"));
  assert.equal(list.uses.ListPage.source, "@momoi-labs/kiso-react");
});

test("a repo root finds the lockfile of its frontend folder", () => {
  const root = mkdtempSync(path.join(tmpdir(), "kiso-check-"));
  try {
    cpSync(fixture("clean"), path.join(root, "web"), { recursive: true });
    const report = checkStatic(root);
    assert.deepEqual(report.findings, []);
    assert.equal(report.versions.kiso.version, "1.11.0");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a workspace link is not too old", () => {
  const report = checkStatic(fixture("linked"));
  assert.deepEqual(found(report), []);
  assert.equal(report.versions.kisoReact.link, true);
});

test("every static rule fires on the drift fixture", () => {
  assert.deepEqual(found(checkStatic(fixture("drift"))), [
    "P1 drift/package-lock.json:6",
    "P1 drift/package-lock.json:7",
    "P2 drift/src/Shell.tsx:3",
    "P2 drift/src/Shell.tsx:5",
    "P3 drift/src/shell.css:1",
    "P3 drift/src/shell.css:11",
    "P3 drift/src/shell.css:12",
    "P3 drift/src/shell.css:13",
    "P3 drift/src/shell.css:14",
    "P3 drift/src/shell.css:5",
    "P3 drift/src/shell.css:6",
    "P3 drift/src/shell.css:9",
    "S1 drift/src/Screen.tsx:2",
    "S2 drift/src/Screen.tsx:18",
    "S2 drift/src/Screen.tsx:7",
    "S3 drift/src/Screen.tsx:16",
    "S4 drift/src/Screen.tsx:20",
    "S4 drift/src/Screen.tsx:23",
    "S5 drift/src/Screen.tsx:10",
    "S5 drift/src/Screen.tsx:25",
  ]);
});

test("the cli exits 1 on findings, 0 when clean, 2 on bad usage", () => {
  const run = (...args) => spawnSync(process.execPath, [bin, ...args], { encoding: "utf8" });
  assert.equal(run(fixture("clean")).status, 0);
  const drift = run(fixture("drift"), "--json");
  assert.equal(drift.status, 1);
  assert.equal(JSON.parse(drift.stdout).summary.findings, 20);
  assert.equal(run().status, 2);
  assert.equal(run(fixture("clean"), "--url", "https://example.com/").status, 2);
  assert.equal(run("--nope").status, 2);
});
