import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
Object.assign(document.documentElement.dataset, { theme: 'dark', accent: 'violet' });
const data = Array.from({ length: 60 }, (_, index) => ({ timestamp: 1000 + index * 1000, values: { a: 20 + (index % 10) * 5 } }));
const series = [{ key: 'a', label: 'User', slot: 1 }];
window.selections = [];
createRoot(document.getElementById('root')).render(h('main', { className: 'page' },
  h(Chart, { label: 'Selectable (%)', data, series, min: 0, max: 100, onRangeSelect: range => window.selections.push(range) }),
  h(Chart, { label: 'Static (%)', data, series, min: 0, max: 100 })));
