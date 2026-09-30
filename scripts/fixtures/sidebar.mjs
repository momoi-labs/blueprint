import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ApplicationShell } from '../../packages/kiso-react/dist/app-shell.js';
import { PageHeader, PageHeaderTitle, PageHeaderDescription } from '../../packages/kiso-react/dist/page-header.js';
import { Button } from '../../packages/kiso-react/dist/button.js';
import { BrandMark } from '../../packages/kiso-react/dist/brand-mark.js';
import { TerminalIcon } from '../../packages/kiso-react/dist/terminal-icon.js';
import '../../packages/kiso-react/dist/styles.css';

const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, {
  theme: params.get('theme') || 'light',
  borderStyle: params.get('border') || 'soft',
  cornerMarks: params.get('marks') || 'none',
  cornerSize: params.get('corners') || 'large',
  markSize: params.get('markSize') || 'medium',
  accent: 'terracotta',
  visualStyle: params.get('visualStyle') || 'default',
  pageHeader: params.get('headingPreference') || 'default',
  appShell: params.get('shellPreference') || 'default',
});

function Fixture() {
  const [page, setPage] = useState('Overview');
  const [collapsed, setCollapsed] = useState(params.has('collapsed'));
  const [requested, setRequested] = useState('None');
  const controlled = params.has('controlled');
  const topbar = params.has('topbar');
  const sidebarProps = topbar ? { layout: 'topbar' } : {
    collapsible: !params.has('plain'),
    defaultCollapsed: params.has('collapsed'),
    ...(controlled ? { collapsed } : {}),
    onCollapsedChange(next) {
      setRequested(String(next));
      if (!params.has('veto')) setCollapsed(next);
    },
    navigation: [{ label: 'Workspace', destinations: [
      ...['Overview', 'Applications', 'Virtual machines'].map(label => ({
        label, href: `#${label.toLowerCase().replaceAll(' ', '-')}`,
        active: label === page,
        leading: h(TerminalIcon),
        trailing: label === 'Applications' ? h('span', { className: 'badge badge-neutral' }, '4') : undefined,
        onClick: () => setPage(label),
      })),
      { label: 'Settings', href: '#settings' },
    ] }],
    footer: h('label', { className: 'field' }, 'Workspace name', h('input', { className: 'input', defaultValue: 'homelab' })),
  };
  return h(ApplicationShell, {
    ...sidebarProps,
    variant: params.get('variant') || undefined,
    brand: h('div', { className: 'brand' }, h(BrandMark, null, 'H'), h('span', { className: 't-label' }, 'self-host')),
    primaryAction: h(Button, { variant: 'primary', onClick: () => setCollapsed(true) }, 'Create application'),
    header: h('span', null, 'homelab / ', page),
  }, h('section', { className: 'page' },
    h(PageHeader, {
      variant: params.has('editorial') ? 'editorial' : params.get('headingVariant') || undefined,
      ...(params.has('editorial') ? { actions: [
        h(Button, { key: 'logs' }, 'Inspect logs'),
        h(Button, { key: 'deploy', variant: 'primary' }, 'Deploy application'),
      ] } : {}),
    },
      h(PageHeaderTitle, null, params.get('title') || page),
      h(PageHeaderDescription, null, 'Applications and machines on this Host.'),
    ),
    h('div', { className: 'card', style: { marginTop: 'var(--spacing-xl)' } },
      h('div', { className: 'card-body' },
        h('h2', { className: 't-h3' }, 'grafana'),
        h('p', { className: 'muted' }, 'grafana.home.lan'),
        h('span', { className: 'badge badge-success' }, 'Running'),
      ),
    ),
    h('output', { 'aria-label': 'Requested collapse state' }, requested),
    params.has('dense') && h('div', { className: 'table-wrap' },
      h('table', { className: 'table' },
        h('thead', null, h('tr', null, h('th', null, 'Application'), h('th', null, 'State'))),
        h('tbody', null, Array.from({ length: 100 }, (_, i) =>
          h('tr', { key: i }, h('td', null, `app-${i}`), h('td', null, 'Running')))),
      ),
    ),
    params.has('long') && Array.from({ length: 30 }, (_, i) =>
      h('p', { key: i }, `Event ${i}: application restarted.`)),
  ));
}

createRoot(document.getElementById('root')).render(h(Fixture));
