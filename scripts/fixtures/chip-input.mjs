import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChipInput, ChipInputBox, ChipInputField, ChipInputList, ChipInputOption, Chip, ChipName, ChipRemove, ChipValue, ChipOption, ChipOptionAdd } from '../../packages/kiso-react/dist/chip-input.js';
import { CommandPalette, CommandPaletteInput, CommandPaletteList, CommandPaletteItem } from '../../packages/kiso-react/dist/command-palette.js';
import '../../packages/kiso-react/dist/styles.css';

function Fixture() {
  const [query, setQuery] = useState('');
  const [dependencies, setDependencies] = useState(['node']);
  const [selected, setSelected] = useState(0);
  const [version, setVersion] = useState('latest');
  const [option, setOption] = useState('linux');
  const [added, setAdded] = useState('');
  const [commits, setCommits] = useState(0);
  const [commands, setCommands] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commit = setter => value => { setter(value); setCommits(count => count + 1); };
  const mode = new URLSearchParams(location.search).get('mode');
  return h('main', null,
    h('h1', null, 'Dependencies'),
    h(ChipInput, null,
      h(ChipInputBox, null,
        dependencies.map(name => h(Chip, { key: name },
          h(ChipName, null, name),
          name === 'node' && h(ChipValue, { value: version, onCommit: commit(setVersion), editLabel: 'Edit version' }),
          name === 'node' && h(ChipOption, { name: 'os', value: option, onCommit: commit(value => setOption(value.replace(/^os=/, ''))), editLabel: 'Edit option' }),
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

createRoot(document.getElementById('root')).render(h(Fixture));
