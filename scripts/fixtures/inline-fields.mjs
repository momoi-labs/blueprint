import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FormField, Input, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Button } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, { theme: params.get('theme') || 'light', borderStyle: params.get('border') || 'round' });
const controlSize = params.get('size') || 'md';
const icon = h('svg', { className: 'icon', viewBox: '0 0 16 16' }, h('rect', { x: 2, y: 4, width: 12, height: 8 }));
function Fixture() {
  const [ram, setRam] = useState('4');
  const [os, setOs] = useState('linux');
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [changes, setChanges] = useState(0);
  const [submits, setSubmits] = useState(0);
  return h('main', { className: 'page' }, h('form', { onSubmit: event => { event.preventDefault(); setSubmits(n => n + 1); }, className: 'stack' },
    h('div', { id: 'environment', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))', gap: 'var(--spacing-md)' } },
      h(FormField, { label: 'RAM', layout: 'inline', controlSize, suffix: 'GB', leading: icon, hint: 'Total available memory.', error: error ? 'Enter at least 1 GB.' : undefined, disabled, type: 'number', min: 1, value: ram, onChange: event => { setRam(event.target.value); setChanges(n => n + 1); } }),
      h(Select, { value: os, onValueChange: value => { setOs(value); setChanges(n => n + 1); } },
        h(FormField, { label: 'OS', layout: 'inline', controlSize, hint: 'Target operating system.' }, h(SelectTrigger, null, h(SelectValue))),
        h(SelectContent, null, h(SelectItem, { value: 'linux' }, 'GNU/Linux'), h(SelectItem, { value: 'windows' }, 'Windows'), h(SelectItem, { value: 'macos' }, 'macOS')),
      ),
      h(FormField, { label: 'Connections', layout: 'inline', controlSize, type: 'number', defaultValue: 100 }),
      h(FormField, { label: 'Managed value', layout: 'inline', controlSize, disabled: true, defaultValue: 'Inherited' }),
      h(FormField, { label: 'Native size', layout: 'inline', controlSize: 'lg', suffix: 'characters', hint: 'A supplied input keeps its attributes.', 'aria-describedby': 'legacy-hint' }, h(Input, { id: 'native-size', size: 6, controlSize: 'sm', defaultValue: 'server', 'aria-describedby': 'legacy-hint' })),
      h(FormField, { label: params.has('long') ? 'Available memory across every configured server' : 'Stacked field', controlSize, suffix: 'GB', leading: icon, defaultValue: '128' }),
      h(FormField, { label: 'Standalone input', controlSize, defaultValue: 'server' }),
      h(Select, { defaultValue: 'linux' },
        h(FormField, { label: 'Standalone select' }, h(SelectTrigger, { controlSize }, h(SelectValue))),
        h(SelectContent, null, h(SelectItem, { value: 'linux' }, 'GNU/Linux')),
      ),
    ),
    h('p', { id: 'legacy-hint' }, 'External description.'),
    h('div', { className: 'row-wrap' }, h(Button, { type: 'button', onClick: () => setError(!error) }, 'Toggle error'), h(Button, { type: 'button', onClick: () => setDisabled(!disabled) }, 'Toggle disabled')),
    h('output', { 'aria-label': 'Field changes' }, String(changes)), h('output', { 'aria-label': 'Submissions' }, String(submits)),
  ));
}
createRoot(document.getElementById('root')).render(h(Fixture));
