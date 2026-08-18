#!/usr/bin/env node

import Ajv from 'ajv';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const schemaPath = process.argv[2] ?? join(here, 'dtcg-format.schema.json');
const tokensPath = process.argv[3] ?? join(here, '..', 'tokens', 'tokens.json');

const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const tokens = JSON.parse(await readFile(tokensPath, 'utf8'));

// The official format.json is a self-contained bundle: every value/group/token
// definition lives under `definitions`, keyed by its own $id. Registering each
// under that $id lets the root schema's absolute $refs resolve without network.
const ajv = new Ajv({ allErrors: true, strict: false, logger: false });
for (const [id, definition] of Object.entries(schema.definitions)) {
  ajv.addSchema(definition, id);
}

const validate = ajv.compile(schema);
if (validate(tokens)) {
  console.log('DTCG 2025.10 schema validation passed.');
} else {
  const seen = new Set();
  for (const error of validate.errors) {
    const line = '  ' + (error.instancePath || '/') + ' ' + error.message;
    if (seen.has(line)) continue;
    seen.add(line);
    console.error(line);
  }
  console.error('DTCG 2025.10 schema validation failed: ' + seen.size + ' distinct error(s).');
  process.exit(1);
}
