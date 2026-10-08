import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, FormField, PasswordInput } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
function Fixture() {
 const [value, setValue] = useState('');
 const [submits, setSubmits] = useState(0);
 return h('main', { className: 'stack', style: { maxWidth: '30rem' } },
  h('form', { className: 'stack', onSubmit: e => { e.preventDefault(); setSubmits(n => n + 1); } },
   h(FormField, { label: 'Password', hint: 'At least 12 characters.', error: value === 'bad' ? 'Too short.' : undefined },
    h(PasswordInput, { name: 'password', value, onChange: e => setValue(e.target.value) })),
   h(FormField, { label: 'API key', controlSize: 'xl' },
    h(PasswordInput, { name: 'api_key', labels: { showName: 'Show API key', hideName: 'Hide API key' } })),
   h(FormField, { label: 'Disabled' }, h(PasswordInput, { disabled: true, defaultValue: 'x' })),
   h(Button, { type: 'submit' }, 'Submit')),
  h('output', { 'aria-label': 'Submissions' }, submits));
}
createRoot(document.getElementById('root')).render(h(Fixture));
