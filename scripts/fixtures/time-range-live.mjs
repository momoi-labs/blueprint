import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, TimeRangeControl } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';

// window.update(props) merges props; onValueChange and onTimeZoneChange are recorded.
window.changes = [];
window.zones = [];
const initial = { now: Date.UTC(2026, 8, 12, 14, 27, 40, 500), maxDuration: 1_800_000, resumeDuration: 900_000,
  value: { kind: 'relative', duration: 900_000 } };

function Fixture() {
  const [props, setProps] = useState(initial);
  window.update = next => setProps(current => ({ ...current, ...next }));
  return h('main', { className: 'page' }, h(TimeRangeControl, { mode: 'live', ...props,
    onValueChange: value => { window.changes.push(value); setProps(current => ({ ...current, value })); },
    onTimeZoneChange: zone => window.zones.push(zone) }),
  h(Chart, { label: 'Zoned (%)', timeZone: 'Asia/Tokyo', locale: 'en-GB', series: [{ key: 'a', label: 'User', slot: 1 }],
    data: Array.from({ length: 30 }, (_, index) => ({ timestamp: Date.UTC(2026, 8, 12, 14) + index * 10_000, values: { a: index } })) }));
}
createRoot(document.getElementById('root')).render(h(Fixture));
