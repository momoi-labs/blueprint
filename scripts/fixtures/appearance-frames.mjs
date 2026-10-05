import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, FormField, Form, FormActions, Button, TableFrame, Table, TableHeader, TableHead, TableBody, TableRow, TableCell, Alert, AlertContent, AlertTitle, Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogBody, DialogFooter, Drawer, DrawerTrigger, DrawerContent, AppShell, AppShellMain, AppShellPanel, Header, Input, Checkbox, Switch, Textarea, ChipInput, ChipInputBox, ChipInputField, Chip, ChipName, ChipValue, ChipRemove, FilterInput, Lifecycle, StatusBadge, ThemeSelector } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: params.get('theme') || 'light', borderStyle: params.get('border') || 'solid', cornerSize: params.get('size') || 'medium', cornerMarks: params.get('marks') || 'arcs' });
if (params.has('corners')) document.documentElement.dataset.cornerStyle = params.get('corners');
for (const key of ['outerBorderStyle', 'outerCornerStyle', 'outerCornerMarks', 'frameScope', 'markScope', 'markClearance', 'backgroundStyle', 'backgroundStrength', 'panelFill', 'paperTone', 'backgroundPlacement', 'frameDetail']) {
  if (params.has(key)) document.documentElement.dataset[key] = params.get(key);
}
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
    h(CardFooter, null, h(Button, { variant: 'primary' }, 'Apply')),
  );
}
function Fixture() {
  if (params.has('contents')) return h(ContentFixture);
  if (params.has('controls')) return h('main', { id: 'controls', className: 'page', style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' } },
    h(Checkbox, { 'aria-label': 'Unchecked' }),
    h(Checkbox, { 'aria-label': 'Checked', defaultChecked: true }),
    h(Checkbox, { 'aria-label': 'Mixed', checked: 'indeterminate', onCheckedChange: () => {} }),
    h('label', { className: 'check' }, h('input', { type: 'checkbox', 'aria-label': 'Native unchecked' })),
    h('label', { className: 'check' }, h('input', { type: 'checkbox', 'aria-label': 'Native checked', defaultChecked: true })),
    h('label', { className: 'check' }, h('input', { type: 'checkbox', 'aria-label': 'Native disabled', disabled: true })),
    h(Switch, { 'aria-label': 'Switch off' }),
    h(Switch, { 'aria-label': 'Switch on', defaultChecked: true }),
    h('label', { className: 'switch' }, h('input', { type: 'checkbox', role: 'switch', 'aria-label': 'Native switch off' })),
    h('label', { className: 'switch' }, h('input', { type: 'checkbox', role: 'switch', 'aria-label': 'Native switch on', defaultChecked: true })),
  );
  if (params.has('canvas')) return h(AppShell, { variant: 'inset', id: 'canvas' },
    h('aside', { className: 'sidebar', id: 'rail' }, 'Navigation'),
    h(AppShellMain, { id: 'outer' }, h(Header, null, 'Document tools', h(Button, null, 'Header action')), h('div', { className: 'page' },
      h('h1', null, 'Canvas composition'), h(Sample),
      h('div', { id: 'nested', 'data-border-style': 'solid', 'data-corner-style': 'rounded' }, h(Card, null, h(CardContent, null, 'Local override'))),
      h(Input, { 'aria-label': 'Native field', defaultValue: 'Editable', 'aria-invalid': 'true' }),
      h(Dialog, null, h(DialogTrigger, { asChild: true }, h(Button, null, 'Open dialog')),
        h(DialogContent, null, h(DialogHeader, null, h(DialogTitle, null, 'Dialog frame')), h(DialogBody, null, h(Input, { 'aria-label': 'Dialog field', defaultValue: 'Retained' })), h(DialogFooter, null, h(Button, null, 'Save dialog')))),
    )),
    h(AppShellPanel, { id: 'settings', hidden: params.has('hidePanel') }, 'Settings'),
  );
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

function ContentFixture() {
  const [expanded, setExpanded] = useState(false);
  const [version, setVersion] = useState('latest');
  const [chip, setChip] = useState(true);
  const [filters, setFilters] = useState([]);
  const [theme, setTheme] = useState('system');
  const table = id => h(Table, { 'aria-label': id },
    h(TableHeader, null, h(TableRow, null, h(TableHead, null, 'Parameter'), h(TableHead, null, 'Value'))),
    h(TableBody, null,
      h(TableRow, null, h(TableCell, null, 'shared_buffers'), h(TableCell, null, '512 MB')),
      h(TableRow, null, h(TableCell, null, h(Button, { variant: 'ghost', size: 'sm', 'aria-expanded': expanded, onClick: () => setExpanded(!expanded) }, 'work_mem')), h(TableCell, null, '4 MB')),
      h(TableRow, { hidden: !expanded, className: 'table-detail' }, h(TableCell, { colSpan: 2 }, h('a', { href: '#details' }, 'Memory details'))),
    ));
  return h('main', { className: 'page', id: 'sample' },
    h('h1', null, 'Frame contents'),
    h(TableFrame, { id: 'plain-table', frame: params.has('frameless') ? 'none' : 'default' }, table('Memory comparison')),
    h(TableFrame, { id: 'chrome-table' },
      h('div', { className: 'table-toolbar' }, h(Input, { 'aria-label': 'Filter rows', placeholder: 'Filter rows' })),
      table('Memory with controls'),
      h('div', { className: 'table-footer' }, '2 records', h(Button, { size: 'sm' }, 'Next page'))),
    h(Card, { id: 'band-card' }, h(CardHeader, null, h(CardTitle, null, 'Deployment')), h(CardContent, null, 'Ready to apply'), h(CardFooter, null, h(Button, null, 'Apply changes'))),
    h(Card, { id: 'form-card' }, h(Form, { onSubmit: event => event.preventDefault() }, h('div', { className: 'form-body' }, h(FormField, { label: 'Project name', defaultValue: 'Retained' })), h(FormActions, { tone: 'warning', sticky: true, message: 'Unsaved changes' }, h(Button, { type: 'submit' }, 'Save project')))),
    h('div', { id: 'fields', className: 'stack' },
      h(Input, { 'aria-label': 'Name', defaultValue: 'Retained' }),
      h(Textarea, { 'aria-label': 'Notes', defaultValue: 'Notes' }),
      h(FormField, { label: 'RAM', layout: 'inline', suffix: 'GB', defaultValue: '4' }),
      h(ChipInput, null, h(ChipInputBox, null,
        chip && h(Chip, null, h(ChipName, null, 'node'), h(ChipValue, { value: version, onCommit: setVersion, editLabel: 'Edit version' }), h(ChipRemove, { 'aria-label': 'Remove node', onClick: () => setChip(false) })),
        h(ChipInputField, { 'aria-label': 'Dependencies' }))),
      h(FilterInput, { label: 'Filters', fields: [{ key: 'status', type: 'text' }], value: filters, onValueChange: setFilters }),
      h('div', { className: 'btn-group' }, h(Button, null, 'Previous'), h(Button, null, 'Following')),
      h(Lifecycle, { status: h(StatusBadge, { tone: 'success' }, 'Running'), actions: h(Button, { size: 'sm' }, 'Stop') }),
      h(ThemeSelector, { variant: 'cards', theme, onChange: setTheme }),
    ),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
