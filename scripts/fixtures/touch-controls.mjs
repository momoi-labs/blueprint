import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Checkbox } from '../../packages/kiso-react/dist/checkbox.js';
import { Switch } from '../../packages/kiso-react/dist/switch.js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../packages/kiso-react/dist/tabs.js';
import { TimeRangeControl } from '../../packages/kiso-react/dist/time-range-control.js';
import '../../packages/kiso-react/dist/styles.css';

const bounds = { from: Date.UTC(2026, 8, 12, 9), to: Date.UTC(2026, 8, 12, 10) };

function Fixture() {
  const [range, setRange] = useState(bounds);
  return h('main', { className: 'stack' },
    h('section', { id: 'checkboxes', className: 'stack' },
      h('h2', null, 'Checkboxes'),
      ...['First', 'Second', 'Disabled'].map((name, index) => h('div', { className: 'row', key: name },
        h(Checkbox, { id: `check-${index}`, disabled: index === 2 }),
        h('label', { htmlFor: `check-${index}` }, name),
      )),
      h('div', { className: 'row' },
        h(Checkbox, { 'aria-label': 'Left' }),
        h(Checkbox, { 'aria-label': 'Right' }),
      ),
    ),
    h('section', { id: 'switches', className: 'stack' },
      h('h2', null, 'Switches'),
      ...['Notifications', 'Logging', 'Disabled switch'].map((name, index) => h('div', { className: 'row', key: name },
        h(Switch, { id: `switch-${index}`, disabled: index === 2 }),
        h('label', { htmlFor: `switch-${index}` }, name),
      )),
    ),
    h('section', { id: 'tabs' },
      h('h2', null, 'Tabs'),
      h(Tabs, { defaultValue: 'config' },
        h(TabsList, { 'aria-label': 'Record views' },
          h(TabsTrigger, { value: 'config' }, 'Configuration'),
          h(TabsTrigger, { value: 'logs' }, 'Logs'),
          h(TabsTrigger, { value: 'disabled', disabled: true }, 'Disabled tab'),
        ),
        h(TabsContent, { value: 'config' }, 'Configuration panel'),
        h(TabsContent, { value: 'logs' }, 'Logs panel'),
      ),
    ),
    h('section', { id: 'time-range', className: 'stack' },
      h('h2', null, 'Time range'),
      h(TimeRangeControl, { value: range, bounds, onValueChange: setRange }),
      h(TimeRangeControl, { value: bounds, bounds, disabled: true, label: 'Disabled range', onValueChange: setRange }),
    ),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
