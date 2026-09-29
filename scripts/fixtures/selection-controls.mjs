import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../packages/kiso-react/dist/select.js';
import { Pagination, PaginationPrevious, PaginationPage, PaginationNext, PaginationEllipsis } from '../../packages/kiso-react/dist/pagination.js';
import '../../packages/kiso-react/dist/styles.css';

function PaginationFixture() {
  const [page, setPage] = useState(1);
  const compact = new URLSearchParams(location.search).has('compact');
  return h('main', null,
    h('h1', null, 'Pagination'),
    h(Pagination, null,
      h(PaginationPrevious, { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1 }),
      ...(compact ? [1, 2] : [1, 2, 3, 4, 5]).map(value => h(PaginationPage, {
        key: value, active: page === value, 'aria-label': `Go to page ${value}`, onClick: () => setPage(value),
      }, value)),
      compact && h(PaginationEllipsis),
      compact && h(PaginationPage, { active: page === 10, 'aria-label': 'Go to page 10', asChild: true },
        h('a', { href: '#page-10', onClick: event => { event.preventDefault(); setPage(10); } }, '10')),
      h(PaginationNext, { onClick: () => setPage(page + 1) }),
    ),
    h('output', { 'aria-label': 'Current page' }, page),
  );
}

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

createRoot(document.getElementById('root')).render(h(new URLSearchParams(location.search).has('pagination') ? PaginationFixture : Fixture));
