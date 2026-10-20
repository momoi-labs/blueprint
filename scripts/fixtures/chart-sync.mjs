import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const data = Array.from({ length: 60 }, (_, index) => ({ timestamp: 1000 + index * 1000, values: { a: 20 + (index % 10) * 5, b: 10 } }));
const series = [{ key: 'a', label: 'User', slot: 1 }, { key: 'b', label: 'System', slot: 2 }];
window.selections = [];
createRoot(document.getElementById('root')).render(h('main', { className: 'page' },
  h(Chart, { id: 'first', label: 'First (%)', data, series, min: 0, max: 100, syncId: 'group', onRangeSelect: range => window.selections.push(range) }),
  h(Chart, { id: 'second', label: 'Second (%)', data, series, min: 0, max: 100, syncId: 'group', variant: 'stacked-area' }),
  h(Chart, { id: 'alone', label: 'Alone (%)', data, series, min: 0, max: 100 })));
