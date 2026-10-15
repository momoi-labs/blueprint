import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FilePlus, FileText, Pencil, UserRound } from 'lucide-react';
import { ApplicationShell, BottomNav, BottomNavBadge, BottomNavLink, Button, Card, CardContent, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Form, FormActions, FormField } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
const root = document.documentElement;
root.dataset.appShell = 'inset';
root.dataset.backgroundStyle = params.get('background') ?? 'momoi';
for (const name of ['outer', 'theme', 'cornerStyle', 'borderStyle', 'cornerMarks', 'cornerSize']) {
  if (params.has(name)) root.dataset[name === 'outer' ? 'appShellOuter' : name] = params.get(name);
}
const destinations = [['New', FilePlus], ['In progress', Pencil, '12'], ['Ready', FileText], ['Account', UserRound]];
const tabs = h('nav', { 'aria-label': 'Contracts', style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } },
  ...destinations.map(([label]) => h('a', { key: label, className: 'btn btn-ghost', href: `#${label}` }, label)));
function Fixture() {
  const [created, setCreated] = useState('');
  const primaryAction = params.has('action') ? h(DropdownMenu, null,
    h(DropdownMenuTrigger, { asChild: true }, h(Button, { size: 'sm' }, 'Create')),
    h(DropdownMenuContent, null, ...['Application', 'Database'].map(name =>
      h(DropdownMenuItem, { key: name, onSelect: () => setCreated(name) }, name)))) : undefined;
  if (params.has('sidebar')) return h(ApplicationShell, { brand: h('strong', null, 'Product'), phoneNavigation: params.get('sidebar') || undefined, primaryAction,
    navigation: [{ label: 'Contracts', destinations: destinations.map(([label, Icon, count], index) => ({ href: `#${label}`, label, active: index === 1,
      leading: h(Icon, { className: 'icon' }), trailing: count })) },
      ...(params.has('more') ? [{ label: 'Manage', destinations: ['Settings', 'Help'].map(label => ({ href: `#${label}`, label, leading: h(UserRound, { className: 'icon' }) })) }] : [])],
    footer: params.has('more') ? h('p', null, 'Signed in as Alex') : undefined },
    params.has('form') ? h('div', { className: 'page' }, h('h1', null, 'Workspace'),
      h(Card, { id: 'form-card' }, h(Form, { onSubmit: event => event.preventDefault() },
        h('div', { className: 'form-body' }, ...Array.from({ length: 14 }, (_, i) => h(FormField, { key: i, label: `Field ${i + 1}`, defaultValue: 'Value' }))),
        h(FormActions, { sticky: true }, h(Button, { type: 'button', variant: 'ghost' }, 'Discard'), h(Button, { type: 'submit' }, 'Save'))))) :
    h('div', { className: 'page' }, h('h1', null, 'Workspace'), h('output', { 'aria-label': 'Created' }, created), ...Array.from({ length: 40 }, (_, i) => h('p', { key: i }, `Line ${i + 1}`)),
      h('button', { className: 'btn', id: 'last' }, 'Last action')));
  return h(ApplicationShell, { layout: 'topbar', brand: h('strong', null, 'Product'),
    header: params.has('wrap') ? h('div', { style: { flex: '1 1 100%', minWidth: 0 } }, tabs) : null,
    bottomNav: params.has('bottom') && h(BottomNav, { 'aria-label': 'Primary' },
      ...destinations.map(([label, Icon, count], index) => h(BottomNavLink, { key: label, href: `#${label}`, active: index === 1 },
        h(Icon, { className: 'icon', 'aria-hidden': true }), h('span', null, label),
        count && h(BottomNavBadge, null, count)))) },
    h('div', { className: 'page' },
      h('h1', null, 'Workspace'),
      h(Card, null, h(CardContent, null, h(FormField, { label: 'Name', defaultValue: 'Value' }))),
      ...Array.from({ length: Number(params.get('lines') ?? 40) }, (_, i) => h('p', { key: i }, `Line ${i + 1}`)),
      h('button', { className: 'btn', id: 'last' }, 'Last action')));
}
createRoot(document.getElementById('root')).render(h(Fixture));
