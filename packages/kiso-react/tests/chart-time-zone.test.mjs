import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Chart } from '../dist/index.js';

const series = [{ key: 'user', label: 'User' }];
const data = [{ timestamp: Date.UTC(2026, 8, 12, 9), values: { user: 1 } },
  { timestamp: Date.UTC(2026, 8, 12, 9, 0, 1, 250), values: { user: null } }];
const render = props => renderToStaticMarkup(createElement(Chart, { label: 'CPU (%)', series, data, ...props }));
const rows = html => [...html.matchAll(/<th scope="row">([^<]*)<\/th>/g)].map(match => match[1]);
const caption = html => [...html.matchAll(/<caption>([^<]*)<\/caption>/g)].at(-1)[1];

test('without timeZone and locale, Chart renders exactly as before', () => {
  // Captured from Chart on main, before timeZone and locale existed.
  assert.equal(render({}), readFileSync(new URL('./fixtures/chart-utc.html', import.meta.url), 'utf8'));
});

test('the exact table shows the date, the second, milliseconds, and the offset in timeZone', () => {
  const html = render({ timeZone: 'America/Sao_Paulo', locale: 'en-GB' });
  assert.deepEqual(rows(html), ['12/09/2026, 06:00:00.000 GMT-03:00', '12/09/2026, 06:00:01.250 GMT-03:00']);
  assert.equal(caption(html), 'CPU (%): collected samples, timestamps in America/Sao_Paulo');
  const whole = render({ timeZone: 'Asia/Kolkata', locale: 'en-GB', data: data.slice(0, 1) });
  assert.deepEqual(rows(whole), ['12/09/2026, 14:30:00 GMT+05:30']);
});

test('a locale alone formats in UTC, and the caption text comes from labels', () => {
  const html = render({ locale: 'pt-BR', labels: { samples: (label, zone) => `${label}: amostras, horários em ${zone}` } });
  assert.deepEqual(rows(html), ['12/09/2026, 09:00:00,000 GMT+00:00', '12/09/2026, 09:00:01,250 GMT+00:00']);
  assert.equal(caption(html), 'CPU (%): amostras, horários em UTC');
  assert.throws(() => render({ timeZone: 'Mars/Olympus' }), /time zone/);
});

test('formatTime never changes the exact table', () => {
  const html = render({ timeZone: 'UTC', locale: 'en-GB', formatTime: () => 'custom' });
  assert.deepEqual(rows(html), ['12/09/2026, 09:00:00.000 GMT+00:00', '12/09/2026, 09:00:01.250 GMT+00:00']);
});
