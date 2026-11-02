import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Waves } from 'lucide-react';
import { DiagramEdgeKey, StatusBadge } from '../dist/index.js';

const html = (type, props, label) => renderToStaticMarkup(createElement(type, props, label));

test('DiagramEdgeKey draws the neutral series in muted grey with its own dash', () => {
  const key = html(DiagramEdgeKey, { series: 'neutral' }, 'WAL');
  assert.match(key, /style="color:var\(--color-muted-foreground\)"/);
  assert.match(key, /data-series="neutral" data-dash="neutral"/);
});

test('DiagramEdgeKey keeps the chart colour and dash of a numbered series', () => {
  const key = html(DiagramEdgeKey, { series: 3 }, 'WAL');
  assert.match(key, /style="color:var\(--color-chart-3\)"/);
  assert.match(key, /data-series="3" data-dash="3"/);
});

test('StatusBadge with a series takes its colour, not a tone', () => {
  const badge = html(StatusBadge, { series: 1, pulse: true }, 'Streaming');
  assert.match(badge, /class="badge badge-neutral badge-series"/);
  assert.match(badge, /data-variant="series"/);
  assert.match(badge, /--badge-series:var\(--color-chart-1\)/);
  assert.match(badge, /class="dot dot-pulse"/);
});

test('StatusBadge with a series and an icon pulses around the icon', () => {
  const badge = html(StatusBadge, { series: 'neutral', icon: Waves, pulse: true }, 'Archiving');
  assert.match(badge, /--badge-series:var\(--color-muted-foreground\)/);
  assert.match(badge, /class="badge-series-icon dot-pulse" aria-hidden="true"><svg/);
  assert.doesNotMatch(badge, /data-slot="dot"/);
});

test('StatusBadge with a tone renders as before', () => {
  const badge = html(StatusBadge, { tone: 'success', pulse: true }, 'Running');
  assert.match(badge, /class="badge badge-success"/);
  assert.doesNotMatch(badge, /badge-series/);
});
