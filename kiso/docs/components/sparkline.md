# Sparkline

## Purpose

Shows the shape of one metric series in the space of a table cell or a Stat
tile. The number beside the line carries the precision; the line carries the
shape. A Sparkline answers "is this trending up", never "what was the value
at 09:41".

The evidence that forced the v1 deferral open: the self-host console collects
metrics in-process, one sample per tick on an evenly spaced window, and needs
the same shape three times over. A cell trend per application row, context
under a KPI value, and one series per container in a detail view.

## Anatomy

A single `div` frame around one SVG path. No axis, no grid, no legend, no
tooltip, no pointer behavior. It is a drawing of a number that is already
present somewhere nearby, or that names itself when it is not.

## Variants

| Prop | Values | Meaning |
| --- | --- | --- |
| `tone` | `neutral` (default), `primary` | Neutral uses `--color-border-strong`, the voice of an incidental series. Primary uses `--color-primary` and marks the series a tile is about. At most one sibling raises its voice. |
| `fill` | `false` (default), `true` | Draws the area under the line in the same color at 0.12 opacity. The fill is flat; there is no gradient. |

## Sizes

`height` is a number of pixels, default `24`. The known cases: `18` in a
table cell, `24` in a detail row, `28` under a Stat value. Width is always
the container; the line stretches with it. Do not place a Sparkline inside a
fixed-height box that crops it.

## Scale

By default the domain is the data's own extent, so one series fills its box.
Pass `min` and `max` to make sibling Sparklines share a scale: comparing
containers in one table only means something if the rows share one domain. A
flat series (every value equal) is padded automatically so it still draws a
line.

## States

| State | Behavior |
| --- | --- |
| fewer than two samples | Renders nothing. A flat rule across a cell reads as a border, not as a measurement. Keep the cell's number; reserve height with the surrounding layout. |
| loading | [Skeleton](skeleton.md) at the same height the Sparkline will occupy. |
| error | Show the last known number as text; the shape is optional, the value is not. |

The component takes plain values and does not model gaps. A series with holes
is the caller's data problem; interpolate or truncate before passing it in.

## Accessibility

This is the contract, not a guess:

- When the value is readable as text beside the drawing (a table cell, a
  Stat), omit `label`. The component renders `aria-hidden` and is decoration;
  the number is the accessible content.
- When the Sparkline is the only presentation of the series, pass `label`.
  It renders `role="img"` with that string as `aria-label`. Name the metric
  and the window: "CPU, last 5 minutes, 10-second ticks". Even then, put the
  current value in nearby text when any action depends on it.
- Announcing every refresh of a live series would be noise. The drawing
  updates silently; rely on the adjacent number for change awareness.

### Keyboard

No keymap and no tab stop. A Sparkline is never an action.

## When to use

- Trend cell in a table row: is this application busier than a minute ago.
- Context under a [Stat](stat.md) value on a dashboard.
- One series per container in a detail view, rows sharing a scale.

## When NOT to use

- Analysis that needs an axis, a legend, or crosshair reading. A framed,
  interactive chart is a separate, still-deferred contract.
- Multi-series overlays. Stack several Sparklines only as separate rows with
  their own labels, never as one drawing with a homemade legend.
- A single value with no history. Use [Stat](stat.md) alone.

## Recharts mapping

No Radix primitive exists for this. The component composes Recharts
`ResponsiveContainer`, `AreaChart`, and `Area` with animation, dots, and
axes off. Color reaches the path through `currentColor` from the
`.sparkline` rules in `ui.css`; never pass a hex value or invent a
categorical palette. The framed `.chart` rules in `ui.css` stay reserved for
the later interactive chart contract.
