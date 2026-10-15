import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, CommandPalette, CommandPaletteInput, Drawer, DrawerBody, DrawerContent, DrawerHeader, DrawerTitle, FormField, Input,
  PageHeader, PageHeaderTitle, Tabs, TabsList, TabsTrigger, Toasts, useToast } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
function Notify() { const notify = useToast(); return h(Button, { onClick: () => notify('success', 'Changes saved', 'Your project has been updated.') }, 'Notify'); }
function Fixture() {
  const [palette, setPalette] = useState(false);
  return h(Toasts, { duration: 60000 }, h('main', { className: 'page stack' },
    h(PageHeader, { actions: h(Button, { variant: 'primary', id: 'action' }, 'Deploy application') }, h(PageHeaderTitle, null, 'Your homelab')),
    h(Input, { 'aria-label': 'Name', placeholder: 'Website refresh' }),
    h(Tabs, { defaultValue: 'a' }, h(TabsList, { 'aria-label': 'Sections' },
      h(TabsTrigger, { value: 'a' }, 'Overview'), h(TabsTrigger, { value: 'b' }, 'Configuration'),
      h(TabsTrigger, { value: 'c' }, 'Logs'), h(TabsTrigger, { value: 'd', disabled: true }, 'Metrics (unavailable)'))),
    h('nav', { className: 'breadcrumb', 'aria-label': 'Breadcrumb', id: 'trail' },
      ...['Workspace', 'Applications', 'Production cluster', 'paperless-ngx'].flatMap(label => [h('a', { key: label, href: '#' }, label), h('span', { key: `${label}-sep`, className: 'sep' }, '/')]),
      h('span', { 'aria-current': 'page' }, 'Environment variables')),
    h('table', { className: 'table' }, h('tbody', null, h('tr', null, h('td', null, 'work_mem'), h('td', { className: 'num', id: 'num' }, '128 MB')))),
    h(Notify),
    h(DrawerButton),
    h(Button, { id: 'palette', onClick: () => setPalette(true) }, 'Open command palette'),
    h(CommandPalette, { open: palette, onOpenChange: setPalette }, h(CommandPaletteInput, { 'aria-label': 'Search commands' }))));
}
function DrawerButton() {
  const [open, setOpen] = useState(false);
  return h(Drawer, { open, onOpenChange: setOpen },
    h(Button, { onClick: () => setOpen(true) }, 'Open drawer'),
    h(DrawerContent, { placement: 'side' }, h(DrawerHeader, null, h(DrawerTitle, null, 'Edit')), h(DrawerBody, null, h(FormField, { label: 'Drawer name' }))));
}
createRoot(document.getElementById('root')).render(h(Fixture));
