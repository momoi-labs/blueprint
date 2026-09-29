import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeSelector } from '@momoi-labs/kiso-react';

function Fixture() {
  const [theme, setTheme] = useState('system');
  const [changes, setChanges] = useState([]);
  const [submits, setSubmits] = useState(0);
  return h('main', { style: { maxWidth: '40rem' } },
    h('h1', null, 'Appearance'),
    h('form', {
      style: { display: 'grid', gap: 'var(--spacing-sm)', overflowWrap: 'anywhere' },
      onSubmit: event => { event.preventDefault(); setSubmits(count => count + 1); },
    },
      h('input', { 'aria-label': 'Before theme', defaultValue: 'Workspace' }),
      h(ThemeSelector, { theme, onChange: value => { setTheme(value); setChanges(previous => [...previous, value]); } }),
      h('input', { 'aria-label': 'After theme', defaultValue: 'Project' }),
      h('button', { type: 'button', onClick: () => setTheme('light') }, 'Replace with light'),
      h('output', { 'aria-label': 'Selected theme' }, theme),
      h('output', { 'aria-label': 'Theme changes' }, JSON.stringify(changes)),
      h('output', { 'aria-label': 'Form submissions' }, submits),
    ),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
