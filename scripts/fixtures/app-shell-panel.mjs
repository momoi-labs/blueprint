import { createElement as h, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppShellMain, AppShellPanel, AppShellPanelToggle, ApplicationShell, Sidebar, Header, Button, FormField } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
if (params.has('rtl')) document.documentElement.dir = 'rtl';
function Fixture() {
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const [placement, setPlacement] = useState('floating');
  const toggle = useRef(null);
  const panel = h(AppShellPanel, { id: 'settings', 'aria-label': 'Settings', hidden: !panelOpen },
    h(FormField, { label: 'Panel value', defaultValue: 'Keep me' }),
    h(Button, { onClick: () => { toggle.current.focus(); setPanelOpen(false); } }, 'Close from panel'),
    ...Array.from({length: 80}, (_, i) => h('p', { key: i }, `Panel detail ${i + 1}`)),
  );
  const header = h(Header, null,
    h(Button, { 'aria-controls': 'navigation', 'aria-expanded': navigationOpen, onClick: () => setNavigationOpen(!navigationOpen) }, 'Toggle navigation'),
    h(AppShellPanelToggle, { ref: toggle, placement, 'aria-controls': 'settings', 'aria-expanded': panelOpen, onClick: () => setPanelOpen(!panelOpen) }),
    h('label', null, 'Toggle placement', h('select', { className: 'select', value: placement, onChange: e => setPlacement(e.target.value) }, h('option', {value:'floating'}, 'Floating'), h('option', {value:'header'}, 'Header'))),
  );
  const body = h('div', { className: 'page' }, h('h1', null, 'Workspace'), h(FormField, { label: 'Main value', defaultValue: 'Independent' }), h('div', { style: { height: '1600px' } }, 'Scrollable main content'));
  const props = { variant: params.get('variant') || 'default', style: { '--app-shell-panel-width': '320px' } };
  if (params.has('application')) return h(ApplicationShell, { ...props, brand: 'Workspace', ...(params.has('topbar') ? {layout:'topbar'} : {navigation:[], collapsible:true, togglePlacement:'header'}), header: header.props.children, panel }, body);
  return h(AppShell, { ...props, 'data-layout': params.has('topbar') ? 'topbar' : undefined },
    !params.has('topbar') && h(Sidebar, { id:'navigation', hidden: !navigationOpen }, h('nav', {'aria-label':'Navigation'}, h('a', {href:'#overview'}, 'Overview'))),
    h(AppShellMain, null, header, body), panel,
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
