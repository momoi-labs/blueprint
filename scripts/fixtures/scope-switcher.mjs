import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApplicationShell, Button, ScopeDestination, ScopeSegment, ScopeSwitcher } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
const params = new URLSearchParams(location.search);
document.documentElement.dataset.theme = params.get('theme') || 'light';
const long = params.has('long');
const orgs = [{ value: 'acme', label: long ? 'Acme Industrial Holdings International Limited' : 'Acme' }, { value: 'umbrella', label: 'Umbrella' }];
const projects = [{ value: 'checkout', label: long ? 'Checkout and payments platform for Europe' : 'Checkout' }, { value: 'billing', label: 'Billing' }, { value: 'analytics', label: 'Analytics' }];
const count = Number(params.get('servers') ?? 4);
const names = ['db-prod-01', 'db-prod-02', 'db-replica-01', 'cache-01'];
const servers = Array.from({ length: count }, (_, i) => ({ value: `s${i}`, label: names[i] ?? `db-node-${String(i + 1).padStart(2, '0')}`, group: i % 2 ? 'Billing' : 'Checkout' }));
function Fixture() {
  const [org, setOrg] = useState('acme');
  const [project, setProject] = useState('checkout');
  const [server, setServer] = useState('s0');
  const [status, setStatus] = useState(params.get('state') || 'ready');
  const empty = params.has('empty');
  const switcher = h(ScopeSwitcher, null,
    h(ScopeSegment, { level: 'Organization', value: org, options: orgs, onValueChange: setOrg,
      destinations: h(ScopeDestination, { href: '#settings' }, 'Organization settings') }),
    h(ScopeSegment, { level: 'Project', value: project, options: projects, all: { value: 'all', label: 'All projects' },
      onValueChange: value => { setProject(value); setServer('all'); }, labels: { list: 'Projects' },
      destinations: h(ScopeDestination, { href: '#projects' }, 'Manage projects') }),
    h(ScopeSegment, { level: 'Server', value: server, options: empty || status !== 'ready' ? [] : servers, all: { value: 'all', label: 'All servers' }, searchable: true,
      currentLabel: status === 'ready' ? undefined : (params.has('unknown') ? undefined : 'db-prod-01'),
      status, onRetry: () => { setStatus('loading'); setTimeout(() => setStatus('ready'), 300); },
      onValueChange: setServer, labels: { list: 'Servers', empty: empty ? 'No servers in Checkout.' : undefined },
      destinations: h(ScopeDestination, { href: '#server' }, 'Open server details') }));
  return h(ApplicationShell, { layout: 'topbar', brand: h('a', { href: '#home', className: 'btn btn-ghost' }, 'pg-yard'), header: h('div', { style: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1, minWidth: 0 } },
      switcher, h('span', { style: { flex: 1 } }), h(Button, { size: 'sm', id: 'account' }, 'Account')) },
    h('div', { className: 'page' }, h('h1', null, 'Metrics'),
      h('output', { 'aria-label': 'Scope' }, `${org}/${project}/${server}`),
      h('button', { className: 'btn', id: 'after' }, 'Page action')));
}
createRoot(document.getElementById('root')).render(h(Fixture));
