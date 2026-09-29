import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Sidebar, SidebarBody, Navigation, NavigationGroup, NavigationLink,
  Label, Input, Textarea, Search, ChipInput, ChipInputBox, ChipInputField,
  Chip, ChipName, ChipOption, ChipOptionAdd, Select, SelectTrigger,
  SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuItem, CommandPalette, CommandPaletteInput, CommandPaletteList,
  CommandPaletteGroup, CommandPaletteItem,
} from '@momoi-labs/kiso-react';

function Fixture() {
  const scenario = new URLSearchParams(location.search).get('scenario');
  const [open, setOpen] = useState(false);
  if (scenario === 'select') return h(Select, null,
    h(SelectTrigger, { 'aria-label': 'Region' }, h(SelectValue, { placeholder: 'Choose region' })),
    h(SelectContent, null, h(SelectGroup, null, h(SelectLabel, null, 'Regions'), h(SelectItem, { value: 'us' }, 'US'))),
  );
  if (scenario === 'menu') return h(DropdownMenu, null,
    h(DropdownMenuTrigger, null, 'Open projects'),
    h(DropdownMenuContent, null, h(DropdownMenuLabel, null, 'Projects'), h(DropdownMenuItem, null, 'All projects')),
  );
  if (scenario === 'palette') return h('main', null,
    h('button', { onClick: () => setOpen(true) }, 'Open commands'),
    h(CommandPalette, { open, onOpenChange: setOpen },
      h(CommandPaletteInput, { 'aria-label': 'Commands' }),
      h(CommandPaletteList, null, h(CommandPaletteGroup, { heading: 'Projects' }, h(CommandPaletteItem, null, 'Open project'))),
    ),
  );
  return h('main', { style: { display: 'grid', gap: 'var(--spacing-md)', maxWidth: '40rem' } },
    h('h1', null, 'Small text contrast'),
    h('p', { className: 't-caps', 'data-case': 'page-caps' }, 'Project settings'),
    h(Sidebar, { style: { position: 'static', height: 'auto', width: '100%' } }, h(SidebarBody, null,
      h(Navigation, { 'aria-label': 'Primary' }, h(NavigationGroup, { label: 'Projects' },
        h(NavigationLink, { href: '#projects' },
          h('svg', { className: 'icon', viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'aria-hidden': true }, h('path', { d: 'M2 2h12v12H2z' })),
          'All projects'),
      )),
    )),
    h(Label, { htmlFor: 'name' }, 'Name'), h(Input, { id: 'name', placeholder: 'Project name' }),
    h(Label, { htmlFor: 'description' }, 'Description'), h(Textarea, { id: 'description', placeholder: 'Project description' }),
    h(Search, { 'aria-label': 'Search projects', placeholder: 'Search projects' }),
    h(ChipInput, null, h(ChipInputBox, null,
      h(Chip, null, h(ChipName, null, 'node'), h(ChipOption, { name: 'os', value: ['linux', 'darwin'] }), h(ChipOptionAdd, { label: 'node', onCommit: () => {} })),
      h(ChipInputField, { 'aria-label': 'Dependencies', placeholder: 'package@version' }),
    )),
    h('div', { className: 'chart-axis' }, h('span', null, '09:00'), h('span', null, '12:00')),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
