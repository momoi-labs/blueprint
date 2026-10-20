import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, DashboardGrid, DashboardPanel, Meter } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const q = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: q.get('theme') || 'dark', accent: 'violet' });
const data = Array.from({ length: 60 }, (_, index) => ({ timestamp: 1000 + index * 1000, values: { a: 20 + (index % 10) * 5, b: 10 + (index % 7) * 3 } }));
const series = [{ key: 'a', label: 'User', slot: 1 }, { key: 'b', label: 'System', slot: 2 }];
const chart = label => h(Chart, { label, data, series, min: 0, max: 100, layout: 'compact', legend: 'inline', syncId: 'fixture' });
function Fixture() {
  const [layout, setLayout] = useState();
  window.dashboardLayout = layout;
  return h('main', { className: 'page', style: { maxWidth: 'none' } },
    h('input', { 'aria-label': 'Filter' }),
    h(DashboardGrid, { 'aria-label': 'Metrics', onLayoutChange: setLayout },
      h(DashboardPanel, { id: 'cpu', title: 'CPU (%)', size: 8, min: 4, expandable: true }, chart('CPU (%)')),
      h(DashboardPanel, { id: 'memory', title: 'Memory (%)', size: 4, min: 3, expandable: true }, chart('Memory (%)')),
      h(DashboardPanel, { id: 'connections', title: 'Connections', size: 12, newRow: true }, h(Meter, { label: 'Connections', value: 64, max: 100 }))));
}
createRoot(document.getElementById('root')).render(h(Fixture));
