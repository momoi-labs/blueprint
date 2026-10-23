import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell, AppShellMain, Button, Chart, DashboardGrid, DashboardPanel, Disclosure, PageHeader, PageHeaderTitle,
  Table, TableBody, TableCell, TableFrame, TableHead, TableHeader, TableRow } from '../../packages/kiso-react/dist/index.js';
import '../../packages/kiso-react/dist/styles.css';
Object.assign(document.documentElement.dataset, { theme: 'dark', backgroundStyle: 'dots', cornerMarks: 'brackets' });
const data = [10, 40, 80, 30, 90, 60].map((a, index) => ({ timestamp: 1000 + index * 1000, values: { a } }));
const series = [{ key: 'a', label: 'User', slot: 1 }];
const cells = ['A long project name that wraps on paper', 'Design', 'In progress', 'Alex Morgan', 'Sep 18', '18 / 24'];
createRoot(document.getElementById('root')).render(h(AppShell, { 'data-variant': 'inset' }, h(AppShellMain, null,
  h('header', { className: 'topbar' }, 'Workspace'),
  h('div', { className: 'page' },
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
  ),
)));
