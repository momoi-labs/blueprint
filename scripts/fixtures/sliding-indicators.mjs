import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Navigation, NavigationGroup, NavigationItem, NavigationLink, NavigationList,
  Sidebar, SidebarBody, Tabs, TabsContent, TabsList, TabsTrigger, ThemeSelector,
} from '@momoi-labs/kiso-react';

// Radix sets its own `dir`, so Tabs takes the direction as a prop.
const dir = new URLSearchParams(location.search).get('dir') || 'ltr';
document.documentElement.dir = dir;

function Links({ items, current, onSelect, className }) {
  return h(NavigationList, { className }, items.map(label => h(NavigationItem, { key: label },
    h(NavigationLink, {
      href: `#${label.toLowerCase()}`,
      active: label === current,
      onClick: event => { event.preventDefault(); onSelect(label); },
    }, label))));
}

function Segmented({ id, options, initial }) {
  const [selected, setSelected] = useState(initial);
  return h('div', { id, className: 'segmented', role: 'tablist', 'aria-label': id },
    options.map(option => h('button', {
      key: option, type: 'button', role: 'tab', 'aria-selected': option === selected,
      onClick: () => setSelected(option),
    }, option)));
}

const frame = { position: 'static', height: 'auto' };

function Fixture() {
  const [theme, setTheme] = useState('system');
  const [row, setRow] = useState('Overview');
  const [primary, setPrimary] = useState('Applications');
  const [help, setHelp] = useState('Docs');
  const [section, setSection] = useState('General');
  return h('main', { style: { display: 'grid', gap: 'var(--spacing-xl)', justifyItems: 'start', alignContent: 'start' } },
    h('div', { id: 'tabs' }, h(Tabs, { defaultValue: 'overview', dir },
      h(TabsList, { 'aria-label': 'Project panels' },
        h(TabsTrigger, { value: 'overview' }, 'Overview'),
        h(TabsTrigger, { value: 'configuration' }, 'Configuration'),
        h(TabsTrigger, { value: 'logs' }, 'Logs')),
      ['overview', 'configuration', 'logs'].map(value => h(TabsContent, { key: value, value }, value)))),
    h(Segmented, { id: 'segmented', options: ['3 months', '30 days', '7 days'], initial: '3 months' }),
    h(Segmented, { id: 'segmented-empty', options: ['One', 'Two'], initial: null }),
    h('div', { id: 'theme' }, h(ThemeSelector, { theme, onChange: setTheme })),
    h('div', { id: 'row' }, h(Navigation, { 'aria-label': 'Project' },
      h(Links, { className: 'nav-row', items: ['Overview', 'Deployments', 'Settings'], current: row, onSelect: setRow }))),
    h(Sidebar, { id: 'sidebar', style: { ...frame, width: '240px' } }, h(SidebarBody, null,
      h(Navigation, { 'aria-label': 'Primary' },
        h(NavigationGroup, { label: 'Workspace' }, h(Links, { items: ['Applications', 'Routes'], current: primary, onSelect: setPrimary })),
        h(NavigationGroup, { label: 'Host' }, h(Links, { items: ['Metrics', 'Settings'], current: primary, onSelect: setPrimary }))),
      h(Navigation, { 'aria-label': 'Help' }, h(Links, { items: ['Docs', 'Support'], current: help, onSelect: setHelp })))),
    h(Sidebar, { id: 'sidebar-row', style: { ...frame, width: '320px' } }, h(SidebarBody, null,
      h(Navigation, { 'aria-label': 'Sections' },
        h(Links, { className: 'nav-row', items: ['General', 'Members'], current: section, onSelect: setSection })),
      h(Navigation, { 'aria-label': 'Views', className: 'nav-row' },
        ['Board', 'List'].map(label => h(NavigationLink, { key: label, href: `#${label.toLowerCase()}`, active: label === 'Board' }, label))))),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
