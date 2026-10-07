import { createElement as h, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LogView, LogViewLine } from '@momoi-labs/kiso-react';
const controlled = new URLSearchParams(location.search).has('controlled');
// Some lines wrap, so the virtualizer has rows to measure. None of them is in
// view at the end.
const text = index => index % 50 === 25 ? `line ${index} ${'wrapped output '.repeat(60)}` : `line ${index}`;
function Fixture() {
  const log = useRef(null);
  const [count, setCount] = useState(500);
  const [follow, setFollow] = useState(true);
  const [renders, setRenders] = useState(0);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => log.current?.getScrollElement() ?? null,
    estimateSize: () => 20,
    overscan: 4,
  });
  return h('main', { style: { maxWidth: '45rem' } },
    // Rows are a multiple of 20px and the scroller is 235px tall, so a row
    // edge sits 5px above the end, inside the 8px that counts as the bottom.
    h(LogView, { ref: log, 'aria-label': 'Output', style: { height: 261, lineHeight: '20px' }, ...controlled && { follow, onFollowChange: setFollow } },
      h('div', { style: { position: 'relative', height: virtualizer.getTotalSize() } },
        virtualizer.getVirtualItems().map(item => h(LogViewLine, {
          key: item.key, ref: virtualizer.measureElement, 'data-index': item.index,
          style: { position: 'absolute', top: 0, insetInline: 0, transform: `translateY(${item.start}px)` },
        }, text(item.index))))),
    h('button', { type: 'button', onClick: () => setCount(n => n + 1) }, 'Append line'),
    h('button', { type: 'button', onClick: () => setCount(n => n + 40) }, 'Append 40 lines'),
    h('button', { type: 'button', onClick: () => setRenders(n => n + 1) }, 'Rerender'),
    h('button', { type: 'button', onClick: () => log.current?.scrollToBottom() }, 'Jump to end'),
    controlled && h('label', null, h('input', { type: 'checkbox', checked: follow, onChange: event => setFollow(event.target.checked) }), 'Follow'),
    h('output', { 'aria-label': 'Renders' }, renders),
  );
}
createRoot(document.getElementById('root')).render(h(Fixture));
