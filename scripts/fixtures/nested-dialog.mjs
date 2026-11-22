import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import * as Kiso from '@momoi-labs/kiso-react';

const fields = Array.from({ length: 4 }, (_, index) => h('p', { key: index }, `Route detail ${index + 1}.`));

const child = (kind, name) => {
  const Close = kind === 'AlertDialog' ? Kiso.AlertDialogCancel : Kiso[`${kind}Close`];
  return h(Kiso[kind], null,
    h(Kiso[`${kind}Trigger`], { asChild: true }, h(Kiso.Button, null, `Open ${name}`)),
    h(Kiso[`${kind}Content`], null,
      h(Kiso[`${kind}Header`], null,
        h(Kiso[`${kind}Title`], null, name),
        h(Kiso[`${kind}Description`], null, 'Compare the fingerprint before you trust it.'),
      ),
      h(Kiso[`${kind}Footer`], null,
        h(Close, { asChild: true }, h(Kiso.Button, null, `Cancel ${name}`)),
      ),
    ),
  );
};

createRoot(document.getElementById('root')).render(h('main', { className: 'stack' },
  h(Kiso.Dialog, null,
    h(Kiso.DialogTrigger, { asChild: true }, h(Kiso.Button, null, 'Open single dialog')),
    h(Kiso.DialogContent, null,
      h(Kiso.DialogHeader, null,
        h(Kiso.DialogTitle, null, 'Single dialog'),
        h(Kiso.DialogDescription, null, 'A hostname and path, and what they do.'),
      ),
      h(Kiso.DialogFooter, null, h(Kiso.DialogClose, { asChild: true }, h(Kiso.Button, null, 'Cancel single'))),
    ),
  ),
  h(Kiso.Dialog, null,
    h(Kiso.DialogTrigger, { asChild: true }, h(Kiso.Button, null, 'Open parent dialog')),
    h(Kiso.DialogContent, null,
      h(Kiso.DialogHeader, null,
        h(Kiso.DialogTitle, null, 'Parent dialog'),
        h(Kiso.DialogDescription, null, 'A hostname and path, and what they do.'),
      ),
      h(Kiso.DialogBody, null, ...fields, child('Dialog', 'child dialog'), child('AlertDialog', 'child alert')),
      h(Kiso.DialogFooter, null, h(Kiso.DialogClose, { asChild: true }, h(Kiso.Button, null, 'Cancel parent'))),
    ),
  ),
));
