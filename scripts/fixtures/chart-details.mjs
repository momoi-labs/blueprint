import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, DetailSelect, Sparkline, Meter, Progress, BarGauge, StepBar, TerminalIcon } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const q = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: q.get('theme') || 'dark', accent: 'violet', chartStyle: q.get('style') || 'solid', frameScope: 'all', cornerStyle: 'pixel', cornerSize: 'small' });
const values = [10, 40, 80, null, 30, 90, 60];
const data = values.map((a, index) => ({ timestamp: 1000 + index * 1000, values: { a, b: a === null ? null : 100 - a } }));
const series = [{ key: 'a', label: 'User', slot: 1 }, { key: 'b', label: 'System', slot: 2 }];
function Fixture() {
  const [value, setValue] = useState('0');
  const [changes, setChanges] = useState(0);
  const [links, setLinks] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const options = Array.from({ length: 8 }, (_, i) => ({ value: String(i), label: `Option ${i}`, disabled: i === 1,
    icon: h(TerminalIcon), illustration: h(Sparkline, { values, height: 64, label: `Illustration ${i}`, chartStyle: 'pixel' }),
    description: h('div', null,
      h('p', null, 'A detailed explanation with multiple lines and measurements. '.repeat(4)),
      h('a', { href: '#guide', onClick: e => { e.preventDefault(); setLinks(n => n + 1); } }, `Guide ${i}`),
      h('pre', { style: { width: 700 } }, 'Samples -> process -> result')),
  }));
  if (q.get('mode') === 'select') return h('main', { className: 'stack', style: { height: 'calc(100dvh - 32px)', maxWidth: 800 } },
    h('div', { style: { marginTop: q.has('bottom') ? 'auto' : 0 } },
      h(DetailSelect, { label: 'Definition', value, onValueChange: next => { setValue(next); setChanges(n => n + 1); }, options: q.has('empty') ? [] : options, disabled: q.has('disabled') }),
      h('output', { 'aria-label': 'Selected' }, value), h('output', { 'aria-label': 'Changes' }, changes), h('output', { 'aria-label': 'Links' }, links)));
  return h('main', { className: 'stack', style: { maxWidth: 800 } },
    h(Chart, { label: 'CPU (%)', data, series, min: 0, max: 100, variant: q.get('variant') || 'line', layout: q.get('layout') || 'standard' }),
    h('div', { id: 'scoped', 'data-chart-style': 'pixel' }, h(Sparkline, { values, label: 'Scoped trend', height: 64 })),
    h(Sparkline, { values: loaded ? values : [], label: 'Loaded trend', height: 64 }),
    h('button', { onClick: () => setLoaded(true) }, 'Load samples'),
    h(Meter, { label: 'Connections', value: 37 }), h(Meter, { label: 'Missing', value: null }),
    h(Progress, { label: 'Work', value: 37 }), h(Progress, { label: 'Waiting' }),
    h(BarGauge, { label: 'Limits', max: 100, rows: [{ key: 'cpu', label: 'CPU limit', value: 37 }] }),
    h(StepBar, { label: 'Run states', steps: [{ key: 'a', label: 'Done', state: 'done' }, { key: 'b', label: 'Failed', state: 'failed' }, { key: 'c', label: 'Skipped', state: 'skipped' }, { key: 'd', label: 'Running', state: 'running', progress: 0.37 }] }));
}
createRoot(document.getElementById('root')).render(h(Fixture));
