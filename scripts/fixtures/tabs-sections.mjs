import { createElement as h, Fragment, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../packages/kiso-react/dist/tabs.js';
import '../../packages/kiso-react/dist/styles.css';

function Fixture() {
  const [tab, setTab] = useState('summary');
  const [changes, setChanges] = useState([]);
  const withLogs = true;
  return h('main', null,
    h(Tabs, { sections: true, value: tab, onValueChange: next => { setTab(next); setChanges(current => [...current, next]); } },
      h(TabsList, { 'aria-label': 'Details' },
        h(TabsTrigger, { value: 'summary' }, 'Summary'),
        h(TabsTrigger, { value: 'configuration' }, 'Configuration'),
        // A conditional group of triggers still gets its sections.
        withLogs ? h(Fragment, null, h(TabsTrigger, { value: 'logs' }, 'Logs')) : null,
        h(TabsTrigger, { value: 'archive', disabled: true }, 'Archive'),
      ),
      h(TabsContent, { value: 'summary' }, h('p', null, 'Summary panel')),
      h(TabsContent, { value: 'configuration' }, h('label', { className: 'field' }, 'Name', h('input', { className: 'input', 'aria-label': 'Name' }))),
      withLogs ? h(Fragment, null, h(TabsContent, { value: 'logs' }, h('p', null, 'Logs panel'))) : null,
      h(TabsContent, { value: 'archive' }, h('p', null, 'Archive panel')),
    ),
    h('output', { 'aria-label': 'Changes' }, changes.join(', ')),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
