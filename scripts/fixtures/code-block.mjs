import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { CodeBlock, Toasts } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
for (const key of ['borderStyle', 'cornerStyle', 'cornerSize', 'cornerMarks', 'frameScope', 'markScope']) {
  if (params.has(key)) document.documentElement.dataset[key] = params.get(key);
}
// Tokens that span lines, as a real highlighter returns for a multi-line string.
const nodes = code => code.split(/("[^"]*")/).map((part, i) => i % 2 ? h('span', { key: i, className: 'code-string' }, part) : part);
const html = code => ({ __html: code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/("[^"]*")/g, '<span class="code-string">$1</span>').replace(/(#.*)$/gm, '<span class="code-comment">$1</span>') });
const command = 'echo "first line\nsecond line" | tee /tmp/out && echo "a very long line that runs well past the right edge of a phone screen and keeps going"';
const yaml = '-replicas: 1\n+replicas: 2\n restart: unless-stopped';
const roles = ['comment', 'keyword', 'string', 'constant', 'name'].map(role => h('span', { key: role, className: `code-${role}` }, role)).flatMap((node, i) => i ? [' ', node] : [node]);
createRoot(document.getElementById('root')).render(h(Toasts, null, h('main', { className: 'stack', style: { maxWidth: '40rem' } },
  h(CodeBlock, { id: 'command', terminal: true, title: 'Run this', copy: 'command', highlight: nodes, code: command }),
  h(CodeBlock, { id: 'html', title: 'HTML highlight', highlight: html, code: '# a<b\necho "x\ny"' }),
  h(CodeBlock, { id: 'diff', diff: true, title: 'Changes', code: yaml }),
  h(CodeBlock, { id: 'marked', lineNumbers: true, added: [2], removed: [1], collapse: [[3, 5]], code: 'a\nb\nc\nd\ne\nf' }),
  h(CodeBlock, { id: 'plain', code: 'plain' }),
  h('pre', { id: 'roles' }, h('code', null, roles)))));
