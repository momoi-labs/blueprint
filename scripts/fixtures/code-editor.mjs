import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CodeEditor, FormField } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
for (const key of ['borderStyle', 'cornerStyle', 'cornerSize', 'cornerMarks', 'frameScope', 'markScope']) {
  if (params.has(key)) document.documentElement.dataset[key] = params.get(key);
}
// A deliberately small shell highlighter: one class per token, no dependency.
const pattern = /(#.*$)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$\{?\w+\}?)|\b(if|then|else|fi|for|do|done|echo|export|set)\b/gm;
const roles = ['sh-comment', 'sh-string', 'sh-variable', 'sh-keyword'];
function shell(code) {
  const out = []; let last = 0;
  for (const match of code.matchAll(pattern)) {
    if (match.index > last) out.push(code.slice(last, match.index));
    out.push(h('span', { key: match.index, className: roles[match.slice(1).findIndex(Boolean)] }, match[0]));
    last = match.index + match[0].length;
  }
  out.push(code.slice(last));
  return out;
}
const escape = text => text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const html = code => ({ __html: escape(code).replace(/(#.*$)/gm, '<span class="sh-comment">$1</span>') });
const script = [
  '#!/bin/sh',
  'set -eu',
  '# Back up the database before an upgrade, with a very long comment that runs past the right edge of the editor',
  'export PGDATA="/var/lib/postgresql/data"',
  'for table in users orders; do',
  '  echo "dumping ${table}"',
  'done',
  ...Array.from({ length: 18 }, (_, i) => `echo "step ${i + 1}"`),
].join('\n');
function Fixture() {
  const [value, setValue] = useState(script);
  const [plain, setPlain] = useState('');
  return h('main', { className: 'stack', style: { maxWidth: '36rem' } },
    h(FormField, { id: 'script', label: 'Startup script', hint: 'Runs before the service starts.' },
      h(CodeEditor, { value, onChange: e => setValue(e.target.value), highlight: shell, rows: 8 })),
    h(FormField, { id: 'html', label: 'HTML highlight' },
      h(CodeEditor, { defaultValue: '# comment\necho ok', highlight: html, rows: 3 })),
    h(FormField, { id: 'plain', label: 'Without highlighter', error: plain === 'bad' ? 'The script must not be "bad".' : undefined },
      h(CodeEditor, { value: plain, onChange: e => setPlain(e.target.value), placeholder: 'echo hello', rows: 3 })),
    h(FormField, { id: 'bare', label: 'Without line numbers' },
      h(CodeEditor, { defaultValue: 'echo "no gutter"', highlight: shell, lineNumbers: false, rows: 3 })),
    h(FormField, { id: 'disabled', label: 'Disabled' },
      h(CodeEditor, { defaultValue: '# locked\necho "read only"', highlight: shell, disabled: true, rows: 3 })));
}
createRoot(document.getElementById('root')).render(h(Fixture));
