import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../packages/kiso-react/dist/select.js';
import '../../packages/kiso-react/dist/styles.css';

function Fixture() {
  const [value, setValue] = useState('12');
  return h('main', null,
    h('h1', null, 'Container selector'),
    h('section', { style: { marginTop: '160px' } },
      h(Select, { value, onValueChange: setValue },
        h(SelectTrigger, { 'aria-label': 'Container' }, h(SelectValue)),
        h(SelectContent, null, Array.from({ length: 22 }, (_, index) => h(SelectItem, {
          key: index, value: `${index + 1}`, disabled: index === 1,
        }, `Container ${index + 1}`))),
      ),
    ),
    h('output', { 'aria-label': 'Selected container' }, value),
  );
}

createRoot(document.getElementById('root')).render(h(Fixture));
