import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppShellMain, Button, Chart, DashboardGrid, DashboardPanel, Disclosure, PageHeader, PageHeaderTitle,
  Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
Object.assign(document.documentElement.dataset, { theme: 'dark', backgroundStyle: 'dots', cornerMarks: 'brackets' });
const data = [10, 40, 80, 30, 90, 60].map((a, index) => ({ timestamp: 1000 + index * 1000, values: { a } }));
const series = [{ key: 'a', label: 'User', slot: 1 }];
const cells = ['A long project name that wraps on paper', 'Design', 'In progress', 'Alex Morgan', 'Sep 18', '18 / 24'];
// An ordinary dashboard page, not a report: wrapped charts, a bounded table
// with a footer and a wide table with long headings and numbers.
const queries = Array.from({ length: 35 }, (_, i) => [`Query ${i + 1}`, `${(i + 1) * 12} ms`]);
const wide = ['Database name', 'Transactions committed per second', 'Transactions rolled back per second',
  'Shared buffer cache hit ratio', 'Temporary files written per hour', 'Deadlocks detected since reset', 'Longest running query duration'];
const dashboard = h('div', { className: 'page' },
  h(PageHeader, null, h(PageHeaderTitle, null, 'Overview')),
  h(DashboardGrid, { 'aria-label': 'Overview' },
    h(DashboardPanel, { id: 'resources', title: 'Resources', size: 12 },
      h('div', null, h(Chart, { label: 'CPU utilization', data, series, min: 0, max: 100 })),
      h('div', null, h(Chart, { label: 'Memory usage', data, series, min: 0, max: 100 }))),
    h(DashboardPanel, { id: 'queries', title: 'Queries', size: 12 },
      h(TableFrame, { id: 'bounded', style: { height: '300px' } },
        h(Table, { 'aria-label': 'Queries' },
          h(TableHeader, null, h(TableRow, null, h(TableHead, null, 'Query'), h(TableHead, { className: 'num' }, 'Duration'))),
          h(TableBody, null, ...queries.map(([name, ms]) => h(TableRow, { key: name }, h(TableCell, null, name), h(TableCell, { className: 'num' }, ms))))),
        h('div', { className: 'table-footer' }, '35 queries'))),
    h(DashboardPanel, { id: 'databases', title: 'Databases', size: 12 },
      h(TableFrame, { id: 'wide' },
        h(Table, { 'aria-label': 'Databases' },
          h(TableHeader, null, h(TableRow, null, ...wide.map((label, i) => h(TableHead, { key: i, className: i ? 'num' : 'col-tight' }, label)))),
          h(TableBody, null, h(TableRow, null, ...wide.map((_, i) => h(TableCell, { key: i, className: i ? 'num' : 'col-tight' },
            i ? '12,345.67' : 'analytics_production'))))))),
  ),
);
const report = new URLSearchParams(location.search).get('case') !== 'dashboard';
createRoot(document.getElementById('root')).render(h(AppShell, { 'data-variant': 'inset' }, h(AppShellMain, null,
  h('header', { className: 'topbar' }, 'Workspace'),
  report ? h('div', { className: 'page' },
    h(PageHeader, { actions: h(Button, null, 'Print report') },
      h('p', { className: 'report-kicker' }, 'Workspace report'), h(PageHeaderTitle, null, 'September')),
    h('div', { className: 'report' },
      h('section', { 'aria-labelledby': 'activity' }, h('h2', { id: 'activity' }, 'Activity'),
        h(DashboardGrid, { 'aria-label': 'Activity', static: true },
          h(DashboardPanel, { id: 'cpu', title: 'CPU (%)', size: 6, expandable: true },
            h('div', null, h(Chart, { label: 'CPU (%)', data, series, min: 0, max: 100 }))),
          h(DashboardPanel, { id: 'projects', title: 'Projects', size: 6 },
            h(TableFrame, null, h(Table, { 'aria-label': 'Projects' },
              h(TableHeader, null, h(TableRow, null, ...cells.map((_, i) => h(TableHead, { key: i }, `Column ${i + 1}`)))),
              h(TableBody, null, h(TableRow, null, ...cells.map((cell, i) => h(TableCell, { key: i }, cell)))))))),
      ),
      h(Disclosure, { summary: 'Method' }, h('p', null, 'Counts come from the tracker.')),
    ),
  ) : dashboard,
)));
