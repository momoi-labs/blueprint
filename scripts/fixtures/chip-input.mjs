import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChipInput, ChipInputBox, ChipInputField, ChipInputList, ChipInputOption, Chip, ChipName, ChipScope, ChipRemove, ChipValue, ChipOption, ChipOptionAdd } from '../../packages/kiso-react/dist/chip-input.js';
import { CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteItem } from '../../packages/kiso-react/dist/command-palette.js';
import '../../packages/kiso-react/dist/styles.css';

function Fixture() {
  const mode = new URLSearchParams(location.search).get('mode');
  const [query, setQuery] = useState('');
  const [dependencies, setDependencies] = useState(['node']);
  const [selected, setSelected] = useState(0);
  const [version, setVersion] = useState(mode === 'touch' ? '1' : 'latest');
  const [option, setOption] = useState(mode === 'touch' ? '1' : 'linux');
  const [added, setAdded] = useState('');
  const [commits, setCommits] = useState(0);
  const [commands, setCommands] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commit = setter => value => { setter(value); setCommits(count => count + 1); };
  const [submits, setSubmits] = useState(0);
  if (mode?.startsWith('layout')) return h(LayoutFixture, { mode });
  if (['keyboard', 'keyboard-long', 'always', 'free-text'].includes(mode)) {
    return h('main', null,
      h('h1', null, 'Package form'),
      h('form', { onSubmit: event => { event.preventDefault(); setSubmits(count => count + 1); } },
        h(ChipInput, null,
          h(ChipInputBox, null,
            h(ChipInputField, {
              'aria-label': 'Packages', value: query, onChange: event => setQuery(event.target.value),
              onKeyDown: event => {
                if (mode === 'free-text' && event.key === 'Enter' && !event.defaultPrevented && query) {
                  event.preventDefault();
                  setDependencies(items => [...items, query]);
                  setQuery('');
                  setSelected(count => count + 1);
                }
              },
            }),
          ),
          (query || mode === 'always') && mode !== 'free-text' && h(ChipInputList, null,
            ...Array.from({ length: mode === 'keyboard-long' ? 20 : 1 }, (_, index) => h(ChipInputOption, { key: index, onSelect: () => { setQuery(''); setSelected(count => count + 1); } }, mode === 'keyboard-long' ? `Package ${index + 1}` : 'Package')),
          ),
        ),
        h('button', { type: 'submit' }, 'Save'),
        h('p', null, 'Submissions: ', h('output', { 'aria-label': 'Submissions' }, submits)),
        h('p', null, 'Selections: ', h('output', { 'aria-label': 'Selections' }, selected)),
        h('p', null, 'Values: ', dependencies.join(', ')),
      ),
    );
  }
  return h('main', null,
    h('h1', null, 'Dependencies'),
    h(ChipInput, null,
      h(ChipInputBox, null,
        dependencies.map(name => h(Chip, { key: name },
          h(ChipName, null, name),
          name === 'node' && h(ChipValue, { key: `version-${version}`, value: version, onCommit: commit(setVersion), editLabel: 'Edit version' }),
          name === 'node' && h(ChipOption, { key: `option-${option}`, name: mode === 'touch' ? 'x' : 'os', value: option, onCommit: commit(value => setOption(value.replace(/^os=/, ''))), editLabel: 'Edit option' }),
          name === 'node' && (added
            ? h(ChipOption, { name: 'arch', value: added, onCommit: commit(setAdded), editLabel: 'Edit added option' })
            : h(ChipOptionAdd, { label: 'node', onCommit: commit(setAdded), editLabel: 'Add option' })),
          h(ChipRemove, { 'aria-label': `Remove ${name}`, onClick: () => setDependencies(dependencies.filter(item => item !== name)) }),
        )),
        h(ChipInputField, { 'aria-label': 'Dependencies', value: query, onChange: event => setQuery(event.target.value), onRemoveLast: () => setDependencies(dependencies.slice(0, -1)) }),
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
    h('output', { 'aria-label': 'Commits' }, commits),
    h('output', { 'aria-label': 'Commands run' }, commands),
    h('button', { onClick: () => setPaletteOpen(true) }, 'Open commands'),
    h(CommandPalette, { open: paletteOpen, onOpenChange: setPaletteOpen },
      h(CommandPaletteInput, { 'aria-label': 'Commands', value: commandQuery, onChange: event => setCommandQuery(event.target.value) }),
      h(CommandPaletteList, null,
        ...['Deploy', 'Delete'].filter(name => name.toLowerCase().includes(commandQuery)).map(name => h(CommandPaletteItem, { key: name, onSelect: () => setCommands(count => count + 1) }, name)),
      ),
    ),
  );
}

function LayoutFixture({ mode }) {
  const long = mode === 'layout-long';
  const [items, setItems] = useState(mode === 'layout-many' ? ['node', 'python', 'ruby', 'go', 'cargo', 'deno'] : [long ? '@scope/a-very-long-unbroken-package-name-for-build-tooling' : 't3']);
  const [version, setVersion] = useState(long ? '2026.09.29-release-candidate-with-a-long-version' : 'latest');
  const [option, setOption] = useState(long ? ['a-very-long-unbroken-native-module-name', 'another-long-build-dependency'] : ['node-pty']);
  const [added, setAdded] = useState('');
  const [query, setQuery] = useState('');
  return h('main', null,
    h('h1', null, 'Dependencies'),
    h('form', { onSubmit: event => event.preventDefault() },
      h(ChipInput, null,
        h(ChipInputBox, null,
          items.map(name => h(Chip, { key: name },
            h(ChipScope, null, 'npm'),
            h(ChipName, null, name),
            mode !== 'layout-many' && h(ChipValue, { value: version, onCommit: setVersion, editLabel: 'Edit dependency version' }),
            mode !== 'layout-many' && h(ChipOption, { name: 'allow_builds', value: option, onCommit: setOption, editLabel: 'Edit build options' }),
            mode !== 'layout-many' && h(ChipOptionAdd, { label: name, onCommit: setAdded, editLabel: 'Add dependency option' }),
            h(ChipRemove, { 'aria-label': `Remove ${name}`, onClick: () => setItems(items.filter(item => item !== name)) }),
          )),
          h(ChipInputField, { 'aria-label': 'Packages', value: query, onChange: event => setQuery(event.target.value) }),
        ),
      ),
      h('button', { type: 'submit' }, 'Save'),
      h('output', { 'aria-label': 'Added option' }, added),
    ),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
