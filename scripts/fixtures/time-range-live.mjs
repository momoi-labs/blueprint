import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, TimeRangeControl } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';

// window.update(props) merges props; onValueChange and onTimeZoneChange are recorded.
window.changes = [];
window.zones = [];
const initial = { now: Date.UTC(2026, 8, 12, 14, 27, 40, 500), maxDuration: 1_800_000, resumeDuration: 900_000,
  value: { kind: 'relative', duration: 900_000 } };

// An artifact run in New York that spans the 2026-11-01 overlap: 01:45 EDT to 01:15 EST.
const overlap = { from: Date.UTC(2026, 10, 1, 5, 45), to: Date.UTC(2026, 10, 1, 6, 15) };
window.artifactChanges = [];
function Artifact() {
  const [value, setValue] = useState({ from: Date.UTC(2026, 10, 1, 6, 10, 0, 250), to: Date.UTC(2026, 10, 1, 6, 14) });
  return h(TimeRangeControl, { label: 'Artifact range', timeZone: 'America/New_York', bounds: overlap, value,
    onValueChange: range => { window.artifactChanges.push(range); setValue(range); } });
}

function Fixture() {
  const [props, setProps] = useState(initial);
  window.update = next => setProps(current => ({ ...current, ...next }));
  return h('main', { className: 'page' }, h(Artifact), h(TimeRangeControl, { mode: 'live', ...props,
    onValueChange: value => { window.changes.push(value); setProps(current => ({ ...current, value })); },
    onTimeZoneChange: zone => window.zones.push(zone) }),
  h(Chart, { label: 'Zoned (%)', timeZone: 'Asia/Tokyo', locale: 'en-GB', series: [{ key: 'a', label: 'User', slot: 1 }],
    data: Array.from({ length: 30 }, (_, index) => ({ timestamp: Date.UTC(2026, 8, 12, 14) + index * 10_000, values: { a: index } })) }));
}
createRoot(document.getElementById('root')).render(h(Fixture));
