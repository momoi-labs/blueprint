# StatusBadge

## Purpose

StatusBadge says the state of one record in one of three tones, the way a
light on a device does. Green is alive: a running machine, a build that is
going, a run that ended well. Red is failed. Neutral is what is not
happening: pending, stopped, disabled. It is a [Badge](badge.md) with a
[Dot](dot.md); use Badge directly for classification that is not a state.

## Anatomy

```
StatusBadge (Badge)
├── Dot (decorative, pulses while work is going), or with a series an icon
└── label (required)
```

## States

| Tone | Meaning | Badge variant |
| --- | --- | --- |
| `success` | Alive, or finished well. | `success` |
| `danger` | Failed. | `danger` |
| `neutral` | Not happening: pending, stopped, disabled. | `neutral` |

There is no fourth tone. "In progress" is not a colour: set `pulse` and let
the label name the phase ("Provisioning", "Building"), not "Running". A thing
that is merely up holds still. The one exception is a series, below.

### Series

Inside a [Diagram](diagram.md#series-edges), a state that belongs to an
edge can take that edge's colour: `series` in place of `tone`. "Streaming"
on the replica that replication series 1 feeds takes series 1; "Archiving"
on the node WAL leaves through takes the WAL series. The state and the edge
then read as one thing.

A series colour is allowed only when all of these hold:

- the badge sits in a Diagram, on a node at one end of an edge with that
  series;
- the Diagram's key names the series, so the colour has a meaning in text;
- the state is about that link, not about the node's health. A node that is
  up stays `success`; a failure stays `danger`.

`series` takes a chart slot or `"neutral"`, the Diagram's grey series. The
colour goes on the fill, the border and the mark; the label stays in the
foreground colour, because a chart slot meets 3:1 and the label needs
4.5:1. `icon`, a Lucide component, replaces the dot and says what the link
is (waves for streaming, an archive for WAL). With `pulse` the dot's halo
glows around the icon, for a link that is moving now. `icon` is available
with a series only. Outside a Diagram, or when the rules above do not hold,
use the three tones.

## Sizes

One size, the Badge's. In a [Lifecycle](lifecycle.md) status cluster the
badge takes the cluster's height.

## Accessibility

The label carries the state; the dot is `aria-hidden`. Nothing depends on
colour alone. The pulse stops under `prefers-reduced-motion`, the same as
Dot's. A series icon is `aria-hidden`, like the dot; the label still names
the state.

## Tokens and implementation

Tones map to Badge variants and reuse their tokens. A series takes the
edge's colour: its chart slot, `--color-chart-1` to `--color-chart-5` and
then the chart's generated colours, or `--color-muted-foreground` for
`"neutral"`. `.badge-series` mixes it into the fill at 12% and the border at
50%. The pulse is Dot's `pulse`, around
the dot or the icon. No Radix primitive.

```tsx
<StatusBadge tone="success">Running</StatusBadge>
<StatusBadge tone="success" pulse>Provisioning</StatusBadge>
<StatusBadge tone="danger">Failed</StatusBadge>
<StatusBadge tone="neutral">Stopped</StatusBadge>
<StatusBadge series={1} icon={Waves} pulse>Streaming</StatusBadge>
<StatusBadge series="neutral" icon={Archive} pulse>Archiving</StatusBadge>
```

## Terminal

In a terminal, StatusBadge is `tui-kiso` `StatusBadge`: a mark and the
label, both in the tone's color. It converts into a line or a table cell.

| Tone | Mark | Color |
| --- | --- | --- |
| `success` | ● | `success-on-dark` |
| `success`, pulse | ◐ | `success-on-dark` |
| `danger` | ● | `danger-on-dark` |
| `neutral` | ○ | `muted-foreground` |

The terminal does not animate the pulse; ◐ marks work that is going, such
as an application stopping, while a spinner runs next to it on the page.
The label always names the state, so color never carries it alone. On a
selected table row, a `success` or `danger` label that misses contrast
takes bold `foreground`; a `neutral` label takes plain `foreground`, as
other secondary text does, and its `○` and word still name the state.
StatusBadge has no keys. `series` is React only: the terminal draws no
Diagram, so it has no edge for the colour to point to.

## When to use

- A record's state in a table cell or in a detail screen's Lifecycle row.

## When NOT to use

- Classification without a state ("Beta", "v2"). Use Badge.
- A warning or information state. Use Badge `warning` or `info`, or an
  [Alert](alert.md) when the person must act.
