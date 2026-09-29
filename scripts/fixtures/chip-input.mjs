import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChipInput, ChipInputBox, ChipInputField, ChipInputList, ChipInputOption, Chip, ChipName, ChipRemove } from '../../packages/kiso-react/dist/chip-input.js';
import '../../packages/kiso-react/dist/styles.css';

function Fixture() {
  const [query, setQuery] = useState('');
  const [dependencies, setDependencies] = useState(['node']);
  const [selected, setSelected] = useState(0);
  const mode = new URLSearchParams(location.search).get('mode');
  return h('main', null,
    h('h1', null, 'Dependencies'),
    h(ChipInput, null,
      h(ChipInputBox, null,
        dependencies.map(name => h(Chip, { key: name },
          h(ChipName, null, name),
          h(ChipRemove, { 'aria-label': `Remove ${name}`, onClick: () => setDependencies(dependencies.filter(item => item !== name)) }),
        )),
        h(ChipInputField, { 'aria-label': 'Dependencies', value: query, onChange: event => setQuery(event.target.value) }),
      ),
      query && mode !== 'empty' && h(ChipInputList, null,
        ...['python', 'pypy'].filter(name => name.includes(query)).map(name => h(ChipInputOption, {
          key: name, disabled: mode === 'disabled', onSelect: () => {
            setDependencies([...new Set([...dependencies, name])]);
            setSelected(selected + 1);
            setQuery('');
          },
        }, name, h('span', { className: 'muted' }, 'as typed'))),
      ),
    ),
    h('button', null, 'Continue'),
    h('output', { 'aria-label': 'Selections' }, selected),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
