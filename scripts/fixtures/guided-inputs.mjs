import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Steps, RadioGroup, RadioGroupItem, FileDropzone, Button, FormField, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, ApplicationShell, Header, Checkbox, Switch, Badge, BrandMark } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const q = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: q.get('theme') || 'light', accent: q.get('accent') || 'tangerine', cornerStyle: q.get('corners') || 'rounded', cornerSize: 'large', frameScope: q.get('scope') || 'all', borderStyle: q.get('border') || 'solid' });
document.documentElement.dir = q.get('dir') || 'ltr';
function Fixture() {
 const [current, setCurrent] = useState('options');
 const [controlled, setControlled] = useState('compact');
 const [changes, setChanges] = useState(0);
 const [submits, setSubmits] = useState(0);
 const [submitted, setSubmitted] = useState('');
 const [actions, setActions] = useState(0);
 const [files, setFiles] = useState([]);
 const [calls, setCalls] = useState(0);
 const [rejects, setRejects] = useState(0);
 const [multiple, setMultiple] = useState(false);
 const [disabled, setDisabled] = useState(false);
 const [name, setName] = useState('sample');
 const [choice, setChoice] = useState('normal');
 const items = [
  { id: 'source', label: 'Source', status: 'completed', description: 'Text selected', navigable: true },
  { id: 'format', label: 'Format', status: 'completed', href: '#format' },
  { id: 'options', label: 'Options', status: 'error', navigable: true },
  { id: 'review', label: q.has('long') ? 'A'.repeat(100) : 'Review' },
  { id: 'finish', label: 'Finish', status: 'disabled', navigable: true, href: '#finish' },
 ];
 return h('main', { className: 'stack', style: { maxWidth: '70rem', margin: 'auto' } },
  h('div', { className: 'card', id: 'frame-reference' }, h('div', { className: 'card-body' }, 'Panel frame reference')),
  h(Steps, { label: 'Progress', items: q.has('empty') ? [] : items, current, orientation: q.get('orientation') || 'horizontal', onStepChange: setCurrent }),
  h('form', { id: 'choices', className: 'stack', onSubmit: e => { e.preventDefault(); setSubmits(n => n + 1); setSubmitted(new FormData(e.currentTarget).get('format')); }, onReset: () => setControlled('compact') },
   h(RadioGroup, { label: 'Format', name: 'format', defaultValue: 'compact', variant: q.get('variant') || 'tiles', controlSize: 'xl', required: true, description: 'Choose then submit.', error: q.has('invalid') ? 'Choose an available format.' : undefined },
    h(RadioGroupItem, { value: 'compact', label: 'Compact', description: 'Short output.' }),
    h(RadioGroupItem, { value: 'disabled', label: 'Unavailable', disabled: true }),
    h(RadioGroupItem, { value: 'full', label: q.has('long') ? 'B'.repeat(100) : 'Full', description: 'All details.' })),
   h(RadioGroup, { label: 'Controlled choice', name: 'controlled', value: controlled, onValueChange: value => { setControlled(value); setChanges(n => n + 1); } },
    h(RadioGroupItem, { value: 'compact', label: 'First' }), h(RadioGroupItem, { value: 'full', label: 'Second' })),
   h(Button, { type: 'submit' }, 'Submit format'), h(Button, { type: 'reset' }, 'Reset format'),
   h(Button, { presentation: 'tile', size: 'xl', description: 'Run this action.', onClick: () => setActions(n => n + 1) }, 'Run action'),
   h(Button, { presentation: 'tile', disabled: true, onClick: () => setActions(n => n + 1) }, 'Unavailable action'),
   h('output', { 'aria-label': 'Submissions' }, submits), h('output', { 'aria-label': 'Submitted format' }, submitted),
   h('output', { 'aria-label': 'Changes' }, changes), h('output', { 'aria-label': 'Actions' }, actions)),
  h(FileDropzone, { label: 'Choose sample file', description: 'Text and PNG files.', accept: '.txt,image/png', multiple, disabled, onFilesSelected: value => { setFiles(value); setCalls(n => n + 1); }, onFilesRejected: () => setRejects(n => n + 1) }),
  h('label', { className: 'check' }, h('input', { type: 'checkbox', checked: multiple, onChange: e => setMultiple(e.target.checked) }), 'Multiple files'),
  h('label', { className: 'check' }, h('input', { type: 'checkbox', checked: disabled, onChange: e => setDisabled(e.target.checked) }), 'Disable files'),
  h('output', { 'aria-label': 'Files' }, files.map(file => file.name).join(',')), h('output', { 'aria-label': 'File calls' }, calls), h('output', { 'aria-label': 'Rejections' }, rejects),
  h(FormField, { label: 'Large input', controlSize: 'xl', value: name, onChange: e => setName(e.target.value) }),
  h(FormField, { label: 'Grouped input', controlSize: 'xl', layout: 'inline', suffix: 'units', value: name, onChange: e => setName(e.target.value) }),
  h(FormField, { label: 'Notes', controlSize: 'xl' }, h(Textarea, { rows: 4, defaultValue: 'Sample text' })),
  h(Select, { value: choice, onValueChange: setChoice }, h(FormField, { label: 'Large select', controlSize: 'xl' }, h(SelectTrigger, null, h(SelectValue))), h(SelectContent, null, h(SelectItem, { value: 'normal' }, 'Normal'), h(SelectItem, { value: 'wide' }, 'Wide'))),
  h(Button, { size: 'xl', variant: 'primary', id: 'primary' }, 'Continue'),
  h('div', { className: 'row-wrap' }, h(Checkbox, { defaultChecked: true, 'aria-label': 'Checked option' }), h(Switch, { defaultChecked: true, 'aria-label': 'Enabled setting' }), h(Badge, { variant: 'primary' }, 'Primary badge'), h(BrandMark, null, 'S')),
  h(Header, { variant: 'plain', id: 'standalone-header' }, 'Plain header'),
  h(ApplicationShell, { layout: 'topbar', variant: q.get('shell') || 'inset', headerVariant: 'plain', brand: 'Sample', header: h(Button, null, 'Header action') }, h('p', null, 'Sample content')),
 );
}
createRoot(document.getElementById('root')).render(h(Fixture));
