import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  CardFooter, DashboardGrid, DashboardPanel, Input, PageHeader, PageHeaderTitle,
  PageHeaderDescription, Stat, StatHeader, StatLabel, StatValue, StatDelta,
  StatFoot, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';

const params = new URLSearchParams(location.search);
Object.assign(document.documentElement.dataset, {
  theme: params.get('theme') || 'light',
  visualStyle: params.get('style') || 'default',
  borderStyle: params.get('border') || 'round',
  cornerMarks: 'arcs',
  accent: 'teal',
});

const metric = value => h(Stat, null,
  h(StatHeader, null, h(StatLabel, null, 'Requests handled'), h(StatDelta, { variant: 'success' }, '+18%')),
  h(StatValue, null, value), h(StatFoot, null, 'During the last 24 hours'),
);

createRoot(document.getElementById('root')).render(h('main', { className: 'page' },
  h(PageHeader, { actions: h(Button, { variant: 'primary', id: 'deploy' }, 'Deploy application') },
    h(PageHeaderTitle, null, 'Your homelab'),
    h(PageHeaderDescription, null, 'Applications, machines, and images in one place.'),
  ),
  h('h2', { className: 't-h2', id: 'section-title' }, 'Applications'),
  h(DashboardGrid, null,
    h(DashboardPanel, { span: 6 },
      h(Card, { id: 'application-card' },
        h(CardHeader, null, h(CardTitle, null, 'grafana'), h(CardDescription, null, 'Metrics and observability')),
        h(CardContent, null,
          h('label', { className: 'field' }, 'Domain', h(Input, { id: 'domain', defaultValue: 'grafana.home.lan' })),
          h('div', { className: 'row' }, h(Badge, { variant: 'success', id: 'status' }, 'Running')),
        ),
        h(CardFooter, null, h(Button, { id: 'save' }, 'Save changes')),
      ),
    ),
    h(DashboardPanel, { span: 6 }, h(Card, { id: 'metric-card' }, metric(params.has('long') ? '123,456,789,012' : '1,284'))),
  ),
  h('section', { id: 'compact-region', 'data-visual-style': 'default' },
    h('h2', { className: 't-h2' }, 'Compact inspection'),
    h(Card, null,
      h(CardHeader, null, h(CardTitle, null, 'Selected application')),
      h(CardContent, null, h('p', null, 'This region keeps the default hierarchy.')),
      metric('42'),
    ),
  ),
  h('section', { 'aria-label': 'Recent requests' },
    h('div', { className: 'table-wrap' }, h(Table, null,
      h(TableHeader, null, h(TableRow, null, h(TableHead, null, 'Application'), h(TableHead, null, 'Requests'))),
      h(TableBody, null, h(TableRow, null, h(TableCell, { id: 'table-cell' }, 'grafana'), h(TableCell, null, '1,284'))),
    )),
  ),
));
