import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import * as Kiso from '@momoi-labs/kiso-react';

const examples = [];
for (const [kind, placement] of [['Dialog'], ['AlertDialog'], ['Drawer', 'side'], ['Drawer', 'bottom']]) {
  for (const withBody of [false, true]) {
    const name = `${kind}${placement ? ` ${placement}` : ''} ${withBody ? 'with body' : 'without body'}`;
    const Close = kind === 'AlertDialog' ? Kiso.AlertDialogCancel : Kiso[`${kind}Close`];
    examples.push(h(Kiso[kind], { key: name },
      h(Kiso[`${kind}Trigger`], { asChild: true }, h(Kiso.Button, null, name)),
      h(Kiso[`${kind}Content`], placement ? { placement } : null,
        h(Kiso[`${kind}Header`], null,
          h(Kiso[`${kind}Title`], null, name),
          h(Kiso[`${kind}Description`], null, 'Review the project before continuing.'),
        ),
        withBody && h(Kiso.DialogBody, null, h('p', null, 'Project details.')),
        h(Kiso[`${kind}Footer`], null,
          h(Close, { asChild: true }, h(Kiso.Button, null, 'Cancel')),
        ),
      ),
    ));
  }
}
createRoot(document.getElementById('root')).render(h('main', { className: 'stack' }, examples));
