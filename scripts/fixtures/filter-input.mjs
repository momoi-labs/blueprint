import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FilterInput } from '../../packages/kiso-react/dist/filter-input.js';
import { ChipInput, ChipInputBox, ChipInputField, Chip, ChipName, ChipValue } from '../../packages/kiso-react/dist/chip-input.js';
const fields = [
  { key: 'status', type: 'text', values: ['active', 'paused', 'failed'] },
  { key: 'region', type: 'text', values: ['eu', 'us', 'ap'] },
  { key: 'lag', type: 'number' },
  { key: 'owner', type: 'text', nullable: true },
];
function Fixture() {
  const [value, setValue] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const [version, setVersion] = useState('latest');
  return h('main', null,
    h('form', { onSubmit: event => { event.preventDefault(); setSubmitted(submitted + 1); } },
      h(FilterInput, { id: 'filters', label: 'Find replicas', value, fields, onValueChange: setValue, disabled }),
      h('button', { type: 'submit' }, 'Search'),
    ),
    h('button', { onClick: () => setDisabled(!disabled) }, 'Toggle disabled'),
    h('output', { 'aria-label': 'Filter state' }, JSON.stringify(value)),
    h('output', { 'aria-label': 'Submissions' }, submitted),
    h(ChipInput, null, h(ChipInputBox, null,
      h(Chip, null, h(ChipName, null, 'node'), h(ChipValue, { value: version, onCommit: setVersion })),
      h(ChipInputField, { 'aria-label': 'Dependencies' }),
    )),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
