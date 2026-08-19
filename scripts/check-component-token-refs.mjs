#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const tokensPath = process.argv[2] ?? 'tokens/build/tokens.css';
const docsPath = process.argv[3] ?? 'kiso/docs/components';
const tokenPattern = /--[a-z][a-z0-9-]*(?:[|*][a-z0-9*|-]*)?/g;

async function main() {
  const css = await readFile(tokensPath, 'utf8');
  const emittedTokens = new Set(css.match(/--[a-z][a-z0-9-]*(?=\s*:)/g) ?? []);
  const docs = (await readdir(docsPath, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(docsPath, entry.name))
    .sort();
  const failures = [];
  let references = 0;

  for (const path of docs) {
    const lines = (await readFile(path, 'utf8')).split('\n');
    for (const [index, line] of lines.entries()) {
      for (const token of line.match(tokenPattern) ?? []) {
        references += 1;
        if (!emittedTokens.has(token)) {
          failures.push(`${relative('.', path)}:${index + 1}: ${token}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error(`Component token reference check failed (${failures.length} unresolved):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Component token reference check passed: ${references} references across ${docs.length} docs.`,
  );
}

main().catch((error) => {
  console.error(`Component token reference check could not run: ${error.message}`);
  process.exitCode = 1;
});
