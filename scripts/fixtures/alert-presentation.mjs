import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, AlertTitle, AlertDescription, AlertContent } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') || 'light';
createRoot(document.getElementById('root')).render(h('main', { className: 'page' },
  ...['tinted', 'rail'].map(appearance => h('section', { className: 'stack-sm', key: appearance },
    h('h1', { className: 't-h3' }, appearance),
    ...['info', 'success', 'warning', 'error'].map(variant => h(Alert, { key: variant, variant, appearance },
      h('svg', { className: 'icon', viewBox: '0 0 16 16', 'aria-hidden': true }, h('circle', { cx: 8, cy: 8, r: 6 })),
      h(AlertContent, null, h(AlertTitle, null, variant), h(AlertDescription, null, 'Review concurrent operations before changing memory settings.')),
    )),
  )),
  h(Alert, { appearance: 'rail', role: 'note', id: 'documentation' }, h(AlertContent, null,
    h(AlertTitle, null, 'Parameter documentation'),
    h('div', { className: 'alert-body stack-sm' },
      h('p', null, 'The description can contain several paragraphs.'),
      h('ul', null, h('li', null, 'Keep the explanation and the recommended action together.')),
      h('pre', null, h('code', null, 'work_mem * operations * workers * connections'.repeat(5))),
      h('a', { href: '#documentation' }, 'Read documentation'),
    ),
  )),
));
