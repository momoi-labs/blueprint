# Chart

## Purpose

Read several metric series across a collection window. pg-probe needs to
correlate CPU, memory, disk, and database activity at the same instant.
[Issue #93](https://github.com/momoi-labs/blueprint/issues/93) records that need.
Use [Sparkline](sparkline.md) for a small, single-series trend.

## Anatomy and forms

A named figure contains axes, horizontal grid lines, a plot, an inspection
readout, [ChartLegend](chart-legend.md), and a disclosure of exact samples.
`line` is the default. `stacked-area` shows nonnegative contributions to a
total. No gradients, curves that overshoot observations, or animation.

One to five series share a unit and timestamp axis. Put the unit in the figure
label, such as "CPU by state (%)". Give each series a unique key and label.
An optional slot from 1 to 5 fixes its color and numbered label across
panels. Slots must be unique within a chart. Keep ascending slot order in stacks. Never encode health with a slot.

In standard layout, `height` defaults to 200 pixels. Width follows the parent. Axes and their labels
remain visible. `min` and `max` establish comparable scales across panels;
otherwise lines use their extent and stacks start at zero. Stacks reject
negative values. Use lines for signed data.

## Data and gaps

`data` contains `{ timestamp, values }`, where timestamps are epoch
milliseconds in strictly increasing order. Supply every expected collection
timestamp, including slots the collector missed. Values are keyed by series.
A null, absent, or nonfinite measurement is unavailable, never zero. The
component does not infer a sampling interval or interpolate missing samples.

Lines break at gaps. A stack breaks across all series when any contribution
is missing, because its total is unknown. The readout and tables retain known
contributions at that timestamp. An isolated sample draws a point.

The summary ignores missing samples for min, max, and arithmetic mean. Current
means the final timestamp, including an unavailable value. It never silently
substitutes an older sample. Statistics describe the supplied window only.

## Interaction and accessibility

The figure has a visible caption and an accessible name. Tab focuses the plot;
Left and Right inspect adjacent samples through Recharts' accessibility layer.
Pointer hover and touch inspect the same readout. The floating readout or sidebar names the
selected timestamp and every series, including "Not collected" values.

Pass the same `syncId` to related charts to synchronize by timestamp. Products
must supply the same expected timestamp grid and window to that group. Array
positions alone do not establish correspondence. Panels retain their own
series and scales.

Series use continuous strokes. Numbered labels, per-series highlighting,
and the exact table provide identification beyond color. Select a legend
label with pointer, touch, Enter, or Space to highlight that series; select
it again to clear. The active label is underlined and exposes `aria-pressed`.
Other series stay in the plot and in every readout. The
"View exact values" disclosure exposes every sample as a native table, with
full UTC timestamps and unrounded source numbers. Include units in the chart
label; formatters change display text, never the exact table. Scrolling stays
inside the table at narrow widths.

Tab reaches the exact-values summary. Enter or Space opens it. No essential
information requires hover, color discrimination, animation, or a live
announcement on every background refresh. Keep series labels descriptive.

## States

- Empty or wholly unavailable data: retain the caption, summary, exact table,
  and plot height; show "No collected samples in this window."
- Partial collection: draw gaps and preserve the available numbers.
- One sample: show a point and the tables.
- Loading: compose a [Skeleton](skeleton.md) at the expected plot height.
- Error: compose an [Alert](alert.md) with the cause and retry action. Label
  retained data as stale. An empty chart is not an error message.

## Tokens and implementation

Series use `--color-chart-1`, `--color-chart-2`, `--color-chart-3`,
`--color-chart-4`, and `--color-chart-5`. Axes use
`--color-muted-foreground`; grid lines use `--color-border`; the crosshair
uses `--color-border-strong`. Focus uses `--color-focus`. The readout uses
`--color-elevated-surface`, `--color-foreground`, and `--shadow-md`.

## Presentation options

| Prop | Values | Default |
| --- | --- | --- |
| `variant` | `line`, `stacked-area` | `line` |
| `layout` | `standard`, `compact`, `split` | `standard` |
| `legend` | `table`, `inline`, `sidebar` | `table` |
| `highlightSeries` | A series key or null | Local selection |

Standard uses a 200-pixel plot; compact uses 165 pixels and tighter spacing.
Split gives each series a labelled 90-pixel lane on one shared numeric scale,
with synchronized timestamps. Explicit `height` overrides the plot or lane
height. Split accepts only line charts; combining it with stacked-area throws
an error because a stack must retain one common plot.

Table keeps min, max, average, and current visible. Inline shows current values
in a wrapping legend. Sidebar shows current values at rest and the inspected
instant on hover, keyboard navigation, or touch, without a floating readout.
At narrow widths it moves below the plot. All forms keep the exact table.

`highlightSeries` makes highlighting controlled; pass null to clear it. Pair
it with `onHighlightSeriesChange` to update selection from the legend. Omitting
it enables local selection. Unknown keys produce no highlight, including when
a series disappears after a data change. Highlighting changes emphasis only;
it never removes contributions or changes the stack's total or scale.

Keyboard instructions remain available through the plot's accessible
description instead of taking permanent space above every plot.

The React component composes Recharts `ComposedChart`, `Line`, `Area`, axes,
and Tooltip, with animation disabled and `connectNulls={false}`. Synchronization
uses `syncMethod="value"`. See the [Recharts API](https://recharts.github.io/en-US/api/AreaChart/).
The existing `.chart` SVG helpers remain compatible; the component frame uses
`.framed-chart` to avoid changing older SVG consumers.
