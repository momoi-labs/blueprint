import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from '../dist/status-badge.js';

/* crates/kiso-core writes these fixtures from its spec. React must render the
   same markup, so a prop or variant cannot drift between the two. */
const fixtures = JSON.parse(readFileSync(new URL('../../../crates/kiso-core/fixtures/status-badge.json', import.meta.url)));

for (const { props: { label, ...props }, html } of fixtures) {
  test(`StatusBadge matches kiso-core: ${JSON.stringify(props)}`, () => {
    assert.equal(renderToStaticMarkup(createElement(StatusBadge, props, label)), html);
  });
}
