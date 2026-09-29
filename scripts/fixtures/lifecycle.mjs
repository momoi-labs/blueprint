import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Lifecycle } from '../../packages/kiso-react/dist/lifecycle.js';
import { Button } from '../../packages/kiso-react/dist/button.js';
import { StatusBadge } from '../../packages/kiso-react/dist/status-badge.js';

function Fixture() {
  const [actions, setActions] = useState([]);
  const action = (name, disabled = false) => h(Button, {
    key: name, size: 'sm', disabled,
    onClick: () => setActions(current => [...current, name]),
  }, name);
  return h('main', null,
    h('h1', null, 'Lifecycle'),
    h(Lifecycle, {
      status: h(StatusBadge, { tone: 'success' }, 'Running'),
      actions: [action('Start', true), action('Stop'), action('Restart')],
      destructive: h(Button, { size: 'sm', variant: 'ghost', className: 'btn-danger-ghost' }, 'Remove'),
    }),
    h('output', { 'aria-label': 'Actions triggered' }, actions.join(', ')),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
