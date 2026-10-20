---
"@momoi-labs/kiso-react": minor
"@momoi-labs/kiso": minor
---

Synchronized charts no longer stall on pointer moves. Only the inspected
chart shows the floating readout and crosshair; the other charts with the
same `syncId` draw a dashed line and dots at the same timestamp. A click or
tap without a drag pins the timestamp across the group with its values, and
a second click or Escape clears it. Enter or Space on a focused plot pins the
sample inspected with the keyboard.
