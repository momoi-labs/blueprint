import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Badge } from '../dist/index.js';

const classes = props => renderToStaticMarkup(createElement(Badge, props, 'Beta'))
  .match(/class="([^"]*)"/)[1].split(' ');

test('Badge applies badge-neutral by default and for variant="neutral"', () => {
  assert.deepEqual(classes({}), ['badge', 'badge-neutral']);
  assert.deepEqual(classes({ variant: 'neutral' }), ['badge', 'badge-neutral']);
});
