---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Chart takes `onRangeSelect`. A reader drags across the plot with a mouse or
pen, and a tinted band marks the samples between both ends. Release calls
`onRangeSelect` with the ordered `{ from, to }` timestamps. A click or Escape
selects nothing. The product applies the range, usually through
TimeRangeControl, which stays the keyboard and touch path. The plot shows a
crosshair cursor while a range can be selected.
