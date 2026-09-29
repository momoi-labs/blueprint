import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { LogView, LogViewLine, LogViewTime, LogViewLevel } from '@momoi-labs/kiso-react';
const lines = ['info', 'warn', 'error'].map((level, index) => h(LogViewLine, { key: level },
  h(LogViewTime, null, `09:41:02.${index}14`),
  h(LogViewLevel, { level }, `${level.toUpperCase()} `),
  h('span', { 'data-case': 'message' }, ['Service starting', 'Retry scheduled', 'Connection failed'][index]),
));
createRoot(document.getElementById('root')).render(h('main', { style: { maxWidth: '45rem' } },
  h('h1', null, 'Build output'),
  h(LogView, { style: { height: 200 }, 'aria-label': 'Build output' }, lines),
  h('section', { className: 'detail-logs' },
    h('h2', null, 'Detail screen log'),
    h(LogView, { style: { height: 200 }, 'aria-label': 'Detail output' }, lines),
  ),
));
