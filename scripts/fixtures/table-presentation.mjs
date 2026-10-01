import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Table, TableFrame, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: params.get('theme') || 'light', borderStyle: params.get('border') || 'round', cornerMarks: 'brackets' });
function Fixture() {
  const [expanded, setExpanded] = useState(false);
  return h('main', { className: 'page' },
    ...['comfortable', 'compact', 'spacious'].map(density => h(TableFrame, { key: density, id: density, 'data-fill': 'false', frame: params.has('frameless') ? 'none' : 'default' },
      h(Table, { density, className: 'comparison-table', header: params.has('plain') ? 'plain' : 'tinted', 'aria-label': density },
        h(TableHeader, null, h(TableRow, null, h(TableHead, null, 'Parameter'), h(TableHead, { className: 'num', 'data-selected': params.has('selected') || undefined }, 'Value'))),
        h(TableBody, null,
          h(TableRow, null, h(TableCell, null, 'shared_buffers'), h(TableCell, { className: 'num' }, '512 MB')),
          h(TableRow, null, h(TableCell, null, h(Button, { size: 'sm', 'aria-expanded': expanded, 'aria-controls': `${density}-detail`, onClick: () => setExpanded(!expanded) }, 'work_mem')), h(TableCell, { className: 'num' }, '4 MB')),
          h(TableRow, { className: 'table-detail', id: `${density}-detail`, hidden: !expanded }, h(TableCell, { colSpan: 2 }, h('p', null, 'Memory per operation.'), h('a', { href: '#details' }, 'Read documentation'))),
        ),
      ),
    )),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
