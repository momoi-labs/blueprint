import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { Chart, ChartLegend, Meter, Progress, BarGauge, Disclosure, DashboardGrid,
  DashboardPanel, TimeRangeControl, Sparkline } from '../packages/kiso-react/dist/index.js';
import { seriesSummary, validateChart } from '../packages/kiso-react/dist/chart-data.js';

const series = [{ key: 'cpu', label: 'CPU', slot: 1 }];
const data = [
  { timestamp: 1000, values: { cpu: 0 } },
  { timestamp: 2000, values: { cpu: 10 } },
  { timestamp: 3000, values: { cpu: null } },
  { timestamp: 4000, values: { cpu: NaN } },
];
assert.deepEqual(seriesSummary(data, 'cpu'), { min: 0, max: 10, avg: 5, current: null });
assert.deepEqual(seriesSummary([], 'cpu'), { min: null, max: null, avg: null, current: null });
assert.throws(() => validateChart([data[1], data[0]], series), /strictly increasing/);
assert.throws(() => validateChart([data[0], data[0]], series), /strictly increasing/);
assert.throws(() => validateChart([{ timestamp: 1e20, values: {} }], series), /timestamps/);
assert.throws(() => render(h(Chart, { label: 'CPU', data, series, min: 10, max: 0 })), /ordered/);
assert.throws(() => validateChart(data, [...series, ...series]), /unique keys/);
assert.throws(() => validateChart(data, []), /one to five/);
assert.throws(() => render(h(Chart, { label: 'CPU', data: [{ timestamp: 0, values: { cpu: -1 } }], series, variant: 'stacked-area' })), /nonnegative/);
const chart = render(h(Chart, { label: 'CPU (%)', data, series }));
assert.match(chart, /<figure[^>]*aria-labelledby=/);
assert.match(chart, /<figcaption[^>]*>CPU \(%\)/);
assert.match(chart, /View exact values/);
assert.match(chart, /1970-01-01T00:00:01.000Z/);
assert.match(chart, /<td>0<\/td>/);
assert.match(chart, /Not collected/);
assert.doesNotMatch(chart, />NaN</);
const empty = render(h(Chart, { label: 'CPU', data: [], series }));
assert.match(empty, /No collected samples/);
assert.match(empty, /<caption>CPU: summary/);
const legend = render(h(ChartLegend, { label: 'CPU summary', data, series }));
assert.match(legend, /<th scope="col">Current/);
assert.match(legend, /<td>5<\/td><td>Not collected/);
const meter = render(h(Meter, { label: 'Capacity', value: 120, max: 100 }));
assert.match(meter, /role="meter"/);
assert.match(meter, /aria-valuenow="100"/);
assert.match(meter, /aria-valuetext="120 \/ 100"/);
assert.match(meter, /width:100%/);
assert.doesNotMatch(render(h(Meter, { label: 'Missing', value: null })), /aria-valuenow|role="meter"/);
assert.match(render(h(Meter, { label: 'Zero', value: 0 })), /aria-valuenow="0"/);
assert.match(render(h(Progress, { label: 'Collecting' })), /role="progressbar"/);
assert.doesNotMatch(render(h(Progress, { label: 'Collecting' })), /aria-valuenow/);
assert.throws(() => render(h(Meter, { label: 'Invalid', value: 0, min: 1, max: 1 })), /exceed min/);
assert.throws(() => render(h(BarGauge, { label: 'Invalid', rows: [], max: 0 })), /positive/);
assert.match(render(h(BarGauge, { label: 'Memory', rows: [{ key: 'db', label: 'Database', value: 0 }], max: 100 })), /aria-valuenow="0"/);
assert.match(render(h(Disclosure, { summary: 'System', open: true }, 'CPU')), /<details[^>]*open=""[^>]*><summary>System/);
assert.match(render(h(DashboardGrid, null, h(DashboardPanel, { span: 12 }, 'Metrics'))), /data-span="12"/);
const bounds = { from: 1000, to: 10000 };
assert.match(render(h(TimeRangeControl, { value: bounds, bounds, onValueChange() {} })), /UTC/);
assert.throws(() => render(h(TimeRangeControl, { value: { from: 0, to: 9000 }, bounds, onValueChange() {} })), /contained/);
assert.equal(render(h(Sparkline, { values: [null, 4, null, NaN] })), '');
assert.match(render(h(Sparkline, { values: [1, null, 4] })), /sparkline/);
console.log('Metrics data, missing values, summaries, semantics, and range bounds passed.');

// Every supported presentation keeps exact values and distinct missing data.
for (const variant of ['line', 'stacked-area']) {
  for (const layout of variant === 'line' ? ['standard', 'compact', 'split'] : ['standard', 'compact']) {
    for (const legend of ['table', 'inline', 'sidebar']) {
      const result = render(h(Chart, { label: 'CPU (%)', data, series, variant, layout, legend, highlightSeries: 'cpu' }));
      assert.match(result, new RegExp('data-layout="' + layout + '"'));
      assert.match(result, new RegExp('data-legend="' + legend + '"'));
      assert.match(result, /aria-pressed="true"/);
      assert.match(result, /View exact values/);
      assert.match(result, /Not collected/);
      assert.doesNotMatch(result, /layout="[^" ]*" layout=/);
    }
  }
}
assert.throws(() => render(h(Chart, { label: 'CPU', data, series, variant: 'stacked-area', layout: 'split' })), /Split layout requires line/);
const inspectedLegend = render(h(ChartLegend, { label: 'CPU', data, series, variant: 'sidebar', activeTimestamp: 1000 }));
assert.match(inspectedLegend, /1970-01-01T00:00:01.000Z/);
assert.match(inspectedLegend, /<dd>0<\/dd>/);
assert.doesNotMatch(inspectedLegend, /aria-pressed/);
console.log('Chart layouts, legend forms, controlled highlights, and sidebar timestamps passed.');
