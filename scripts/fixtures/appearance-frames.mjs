import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, FormField, Button, TableFrame, Table, TableBody, TableRow, TableCell, Alert, AlertContent, AlertTitle, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogBody, Drawer, DrawerTrigger, DrawerContent } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: params.get('theme') || 'light', borderStyle: params.get('border') || 'solid', cornerSize: params.get('size') || 'medium', cornerMarks: 'arcs' });
if (params.has('corners')) document.documentElement.dataset.cornerStyle = params.get('corners');
function Sample({ id = 'sample', title = 'Environment' }) {
  return h(Card, { id },
    h(CardHeader, null, h(CardTitle, null, title)),
    h(CardContent, null,
      h(FormField, { label: 'RAM', layout: 'inline', suffix: 'GB', defaultValue: '4', type: 'number' }),
      h(TableFrame, null, h(Table, { 'aria-label': `${title} values` }, h(TableBody, null,
        h(TableRow, null, h(TableCell, null, 'shared_buffers'), h(TableCell, null, '512MB')),
        h(TableRow, null, h(TableCell, null, 'work_mem'), h(TableCell, null, '4MB')),
      ))),
      h(Alert, { appearance: 'rail', variant: 'info', role: 'note' }, h(AlertContent, null, h(AlertTitle, null, 'Per-session tuning'))),
    ),
    h(CardFooter, null, h(Button, null, 'Apply')),
  );
}
function Fixture() {
  if (params.has('matrix')) return h('main', { className: 'page' },
    h('h1', null, 'Border style and corner shape'),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))', gap: 'var(--spacing-xl)' } },
      ...['solid', 'none'].flatMap(border => ['square', 'rounded', 'asym'].map(corners => h('section', { key: `${border}-${corners}`, 'data-border-style': border, 'data-corner-style': corners }, h(Sample, { id: `${border}-${corners}`, title: `${border} / ${corners}` })))),
    ),
  );
  return h('main', { className: 'page' },
    h('h1', null, 'Panel appearance'),
    h(Sample),
    h('div', { id: 'nested', 'data-border-style': 'double' }, h(Card, null, h(CardContent, null, 'A nested frame retains the selected corners.'))),
    h('pre', { id: 'code' }, h('code', null, 'work_mem = 4MB')),
    h('div', { className: 'logview', id: 'log' }, h('div', { className: 'log-scroll' }, 'Ready')),
    h('div', { className: 'palette', id: 'palette' }, h('div', { className: 'palette-list' }, 'Command palette frame')),
    h('div', { className: 'app-shell', 'data-layout': 'topbar', 'data-variant': 'inset' }, h('main', { id: 'inset', 'data-slot': 'app-shell-main' }, 'Inset shell content')),
    h(Dialog, null, h(DialogTrigger, { asChild: true }, h(Button, null, 'Open dialog')), h(DialogContent, null, h(DialogHeader, null, h(DialogTitle, null, 'Dialog frame')), h(DialogBody, null, h(FormField, { label: 'Dialog value', defaultValue: 'Retained border' })))),
    h(Drawer, null, h(DrawerTrigger, { asChild: true }, h(Button, null, 'Open drawer')), h(DrawerContent, null, h(DialogHeader, null, h(DialogTitle, null, 'Drawer frame')), h(DialogBody, null, 'Drawer content'))),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
