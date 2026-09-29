import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { BarGauge, Card, CardContent, DashboardGrid, DashboardPanel, Meter, Progress } from '@momoi-labs/kiso-react';
import '@momoi-labs/kiso-react/styles.css';

const params = new URLSearchParams(location.search);
const component = params.get('component');
const long = params.has('long');
const rows = [
  { key: 'zero', label: long ? 'X'.repeat(200) : 'CPU', value: 0 },
  { key: 'missing', label: long ? 'services/production/database/'.repeat(8) : 'Collector', value: null },
  { key: 'negative', label: long ? 'Negative measurement '.repeat(12) : 'Offset', value: -5 },
  { key: 'over', label: long ? 'Y'.repeat(200) : 'Capacity', value: 120 },
];
const metrics = component === 'BarGauge'
  ? h(BarGauge, { label: 'Resources', max: 100, rows })
  : h('div', { className: 'stack' }, rows.map(row => h(component === 'Meter' ? Meter : Progress, {
    key: row.key, label: row.label, value: row.value,
    ...(component === 'Meter' ? { min: -100 } : {}),
  })));

createRoot(document.getElementById('root')).render(h('main', { className: 'stack' },
  h('h1', { className: 't-h3' }, component),
  params.has('panel')
    ? h(DashboardGrid, null, h(DashboardPanel, { span: 12 }, h(Card, null, h(CardContent, null, metrics))))
    : metrics,
));
