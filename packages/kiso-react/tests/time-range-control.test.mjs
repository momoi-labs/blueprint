import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimeRangeControl } from '../dist/index.js';
import { parseWallTime, wallString } from '../dist/time-zone.js';
import { parseRangeText, relativeRangeText } from '../dist/time-range-text.js';

const render = props => renderToStaticMarkup(createElement(TimeRangeControl, { onValueChange() {}, ...props }));
const chevron = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down icon icon-sm" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>';
const trigger = (name, text) => `<button type="button" data-slot="popover-trigger" data-variant="default" data-size="md" data-presentation="default" class="btn btn-outline time-range-trigger" aria-label="${name}" aria-haspopup="dialog" aria-expanded="false" data-state="closed">${text} ${chevron}</button>`;
const bounds = { from: Date.UTC(2026, 8, 12, 9), to: Date.UTC(2026, 8, 13, 10, 0, 1, 500) };
const value = { from: Date.UTC(2026, 8, 12, 9, 30), to: Date.UTC(2026, 8, 12, 9, 45, 12, 250) };
const now = Date.UTC(2026, 8, 12, 14, 27, 40, 500);
const name = html => (html.match(/time-range-trigger"[^>]*aria-label="([^"]*)"/) ?? html.match(/aria-label="([^"]*)"/))[1];
const pauseName = html => html.match(/time-range-live-pause"[^>]*aria-label="([^"]*)"/)[1];
const visible = html => html.replace(/<[^>]+>/g, '').trim();

test('artifact mode renders exactly as before', () => {
  // Captured from the 1.0 control on main.
  assert.equal(render({ value, bounds }), trigger('Time range: 2026-09-12 09:30:00.000 to 2026-09-12 09:45:12.250 UTC', '09:30 to 09:45:12.250 UTC'));
  assert.equal(render({ value: bounds, bounds, mode: 'artifact' }),
    trigger('Time range: 2026-09-12 09:00:00.000 to 2026-09-13 10:00:01.500 UTC', '2026-09-12 09:00 to 2026-09-13 10:00:01.500 UTC'));
  assert.throws(() => render({ value: { from: 0, to: 9000 }, bounds }), /contained/);
  assert.throws(() => render({ value, bounds, timeZone: 'Mars/Olympus' }), /time zone/);
});

test('artifact mode can show another zone and translated text', () => {
  const html = render({ value, bounds, timeZone: 'America/Sao_Paulo', label: 'Intervalo',
    labels: { range: (from, to, zone) => `${from} até ${to} ${zone}` } });
  assert.equal(name(html), 'Intervalo: 2026-09-12 06:30:00.000 até 2026-09-12 06:45:12.250 GMT-3');
  assert.equal(visible(html), '06:30 até 06:45:12.250 GMT-3');
});

const live = props => render({ mode: 'live', now, maxDuration: 1_800_000, resumeDuration: 900_000,
  timeZone: 'America/Sao_Paulo', locale: 'en-GB', ...props });

test('a live relative value shows its preset label, never times', () => {
  const html = live({ value: { kind: 'relative', duration: 900_000 } });
  assert.equal(visible(html), 'Last 15 minutes');
  assert.match(html, /lucide-radio/);
  assert.match(html, /data-time-range-state="live"/);
  assert.match(html, /^<div class="time-range-live" role="group" aria-label="Time range">/);
  assert.equal(pauseName(html), 'Pause');
  assert.equal(name(html), 'Time range, Live: Last 15 minutes, 12 Sept 2026, 11:12:40 GMT-03:00 to 12 Sept 2026, 11:27:40 GMT-03:00');
});

test('a relative value without a preset gets a generated label', () => {
  assert.equal(visible(live({ value: { kind: 'relative', duration: 7_200_000 } })), 'Last 2 hours');
  assert.equal(visible(live({ value: { kind: 'relative', duration: 86_400_000 } })), 'Last 1 day');
  assert.equal(visible(live({ value: { kind: 'relative', duration: 90_000 } })), 'Last 90 seconds');
});

test('a live absolute value is paused and shows a short range to the second', () => {
  const html = live({ value: { kind: 'absolute', from: Date.UTC(2026, 8, 12, 14, 18, 5, 250), to: Date.UTC(2026, 8, 12, 14, 21, 30) } });
  assert.equal(visible(html), '11:18:05 to 11:21:30 GMT-3');
  assert.match(html, /lucide-pause/);
  assert.equal(pauseName(html), 'Resume live');
  assert.match(name(html), /^Time range, Paused: 11:18:05 to 11:21:30 GMT-3, 12 Sept 2026, 11:18:05 GMT-03:00 to /);
  const days = live({ value: { kind: 'absolute', from: Date.UTC(2026, 8, 11, 20), to: Date.UTC(2026, 8, 12, 4) } });
  assert.equal(visible(days), '11 Sept, 17:00:00 to 12 Sept, 01:00:00 GMT-3');
});

test('live mode follows the locale and translates every fixed string', () => {
  const html = live({ locale: 'pt-BR', label: 'Intervalo', value: { kind: 'absolute', from: Date.UTC(2026, 8, 12, 14, 18, 5), to: Date.UTC(2026, 8, 12, 14, 21, 30) },
    labels: { live: 'Ao vivo', paused: 'Pausado', range: (from, to, zone) => `${from} até ${to} ${zone}`,
      fullRange: (from, to) => `de ${from} até ${to}`,
      triggerName: ({ label, state, text, range }) => `${label} (${state}): ${text}; ${range}` } });
  assert.equal(visible(html), '11:18:05 até 11:21:30 BRT');
  assert.equal(name(html), 'Intervalo (Pausado): 11:18:05 até 11:21:30 BRT; de 12 de set. de 2026, 11:18:05 GMT-03:00 até 12 de set. de 2026, 11:21:30 GMT-03:00');
  assert.doesNotMatch(name(html), /\b(to|Time|Paused|Live)\b/);
  const relative = live({ value: { kind: 'relative', duration: 7_200_000 }, labels: { relative: (count, unit) => `Últimas ${count} ${unit === 'hour' ? 'horas' : unit}` } });
  assert.equal(visible(relative), 'Últimas 2 horas');
});

test('live mode never throws during render', () => {
  for (const props of [
    { now: NaN, value: { kind: 'relative', duration: 900_000 } },
    { now: Infinity, value: { kind: 'absolute', from: 5, to: 1 } },
    { value: { kind: 'absolute', from: NaN, to: NaN } },
    { value: { kind: 'relative', duration: -1 }, presets: [{ label: 'Broken', duration: 0 }] },
    { value: { kind: 'absolute', from: 0, to: 1000 }, timeZone: 'Mars/Olympus', locale: 'not a locale!' },
    { value: { kind: 'relative', duration: 900_000 }, maxDuration: NaN, resumeDuration: NaN },
  ]) {
    const html = live(props);
    assert.match(html, /time-range-trigger/);
  }
  assert.match(visible(live({ now: NaN, value: { kind: 'absolute', from: NaN, to: 1 } })), /Time unavailable/);
});

test('wall times resolve daylight-saving gaps forward and overlaps to the earlier instant', () => {
  const zone = 'America/New_York';
  assert.equal(parseWallTime('2026-03-08T02:30:00', zone), Date.UTC(2026, 2, 8, 7), 'the gap moves to 03:00 EDT');
  assert.equal(parseWallTime('2026-11-01T01:30:00', zone), Date.UTC(2026, 10, 1, 5, 30), 'the overlap takes 01:30 EDT');
  assert.equal(parseWallTime('2026-07-01T12:00:05', 'America/Sao_Paulo'), Date.UTC(2026, 6, 1, 15, 0, 5));
  assert.equal(wallString(Date.UTC(2026, 6, 1, 15, 0, 5, 250), 'America/Sao_Paulo', 'second'), '2026-07-01T12:00:05');
  assert.ok(Number.isNaN(parseWallTime('', zone)));
  assert.ok(Number.isNaN(parseWallTime('2026-13-01T00:00', zone)));
});

test('live field text reads now, offsets, times of day, and dates in the zone', () => {
  const zone = 'America/Sao_Paulo';
  assert.deepEqual(parseRangeText('now', zone, now), { kind: 'relative', offset: 0 });
  assert.deepEqual(parseRangeText(' NOW - 15m ', zone, now), { kind: 'relative', offset: 900_000 });
  assert.deepEqual(parseRangeText('now-2d', zone, now), { kind: 'relative', offset: 172_800_000 });
  assert.deepEqual(parseRangeText('11:20', zone, now), { kind: 'absolute', at: Date.UTC(2026, 8, 12, 14, 20) });
  assert.deepEqual(parseRangeText('2026-09-11 23:59:30', zone, now), { kind: 'absolute', at: Date.UTC(2026, 8, 12, 2, 59, 30) });
  for (const bad of ['', 'now+5m', 'now-5w', 'yesterday', '24:00', '11:60', '2026-02-30 10:00', '2026-13-01 10:00', '2026-09-12 10:00:61']) {
    assert.equal(parseRangeText(bad, zone, now), null, bad);
  }
  assert.equal(parseRangeText('2026-02-30 10:00', 'UTC', now), null, 'no rollover into March in UTC');
  assert.equal(parseRangeText('2028-02-29 10:00', 'UTC', now).at, Date.UTC(2028, 1, 29, 10));
  assert.equal(parseRangeText('10:00', zone, NaN), null, 'a time of day needs a valid now');
  assert.deepEqual(parseRangeText('2026-03-08 02:30', 'America/New_York', now), { kind: 'absolute', at: Date.UTC(2026, 2, 8, 7) });
  assert.deepEqual([relativeRangeText(1_800_000), relativeRangeText(7_200_000), relativeRangeText(86_400_000), relativeRangeText(90_000)],
    ['now-30m', 'now-2h', 'now-1d', 'now-90s']);
});
