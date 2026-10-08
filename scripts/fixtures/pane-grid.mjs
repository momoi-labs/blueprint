import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PaneGrid, GridPane, Button } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: params.get('theme') || 'dark', cornerStyle: 'pixel', cornerMarks: 'brackets' });
const panes = params.has("masonry") ? [
  ["url", "Public URL", 3, 6], ["listener", "Listener", 2, 6],
  ["packages", "Packages", 3, 6], ["start", "Start command", 4, 12, true],
] : [
  ['url', 'Public URL', 3, 6], ['listener', 'Listener', 2, 4], ['start', 'Start command', 4, 12, true],
  ['packages', 'Packages', 3, 6, true], ['variables', 'Variables', 3, 6], ['health', 'Health', 2, 3, true], ['routes', 'Routes', 2, 3],
];
function Fixture() {
  const [layout, setLayout] = useState();
  window.paneLayout = layout;
  return h('main', { className: 'page', style: { maxWidth: 'none' } },
    h(PaneGrid, {
      title: 'Summary', 'aria-label': 'Summary', onLayoutChange: setLayout,
      flow: params.has("masonry") ? "masonry" : "rows",
      overflow: params.get('overflow') || undefined, fill: params.has('fill'), pack: params.has('pack'), debug: params.has('debug'),
    }, ...panes.map(([id, title, min, size, newRow]) => h(GridPane, {
      key: id, id, title, min, size, newRow,
      actions: id === 'start' ? h(Button, { size: 'sm', variant: 'ghost', onClick: () => { window.copied = true; } }, 'Copy') : undefined,
    }, h('p', { style: params.has('masonry') ? { height: id === 'url' ? 360 : 80 } : undefined }, `${title} content`)))),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
