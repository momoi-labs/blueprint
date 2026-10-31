import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Combobox, Dialog, DialogContent, DialogTitle, DialogTrigger, FormField } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
const options = [
 ['shared_buffers', 'memory', 'Memory', 'Memory the server uses for shared buffers.'],
 ['work_mem', 'memory', 'Memory', 'Memory for each sort or hash before it spills to disk.'],
 ['maintenance_work_mem', 'memory', 'Memory', 'Memory for VACUUM, CREATE INDEX, and ALTER TABLE.'],
 ['max_connections', 'integer', 'Connections', 'Maximum number of concurrent connections.'],
 ['statement_timeout', 'time', 'Connections', 'End any statement that runs longer than this.'],
 ['wal_level', 'enum', 'Write-ahead log', 'How much information goes into the WAL.'],
 ['checkpoint_timeout', 'time', 'Write-ahead log', 'Maximum time between automatic checkpoints.'],
 ['pool_mode', 'enum', 'PgBouncer', 'When a server connection returns to the pool.'],
].map(([value, note, group, description]) => ({ value, label: value, note, group, description }));
function Setting({ label = 'Setting' }) {
 const [value, setValue] = useState(null);
 const [query, setQuery] = useState('');
 const [submitted, setSubmitted] = useState(false);
 const error = submitted && !value ? `${query} is not a setting of this node. Pick one from the list.` : undefined;
 return h('form', { className: 'stack', noValidate: true, onSubmit: e => { e.preventDefault(); setSubmitted(true); } },
  h(FormField, { label, error, hint: 'Search by name or description.' },
   h(Combobox, { options, value, onValueChange: setValue, query, onQueryChange: setQuery, mono: true, emptyText: q => `No setting matches "${q}".` })),
  h('output', { 'aria-label': `${label} value` }, value ?? 'none'),
  h(Button, { type: 'submit' }, `Check ${label}`));
}
function Preset() {
 const [value, setValue] = useState('wal_level');
 return h(FormField, { label: 'Preset' }, h(Combobox, { options, value, onValueChange: setValue }));
}
function Fixture() {
 return h('main', { className: 'stack', style: { maxWidth: '30rem' } },
  h(Setting),
  h(FormField, { label: 'Remote' }, h(Combobox, { options: [], loading: true, loadingText: 'Loading settings' })),
  h(Preset),
  h(FormField, { label: 'Disabled' }, h(Combobox, { options, defaultValue: 'work_mem', disabled: true })),
  h(Dialog, null, h(DialogTrigger, { asChild: true }, h(Button, null, 'Open dialog')),
   h(DialogContent, null, h(DialogTitle, null, 'Add override'), h('div', { style: { padding: 'var(--spacing-lg)' } }, h(Setting, { label: 'Dialog setting' })))),
  h('div', { style: { height: params.get('spacer') || '0px' } }),
  h(Setting, { label: 'Bottom setting' }));
}
createRoot(document.getElementById('root')).render(h(Fixture));
