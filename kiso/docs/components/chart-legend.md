# ChartLegend

Line swatches inherit the chart line. Curved has round line ends; straight
and stepped keep square ends. Series colors and numbered labels do not
change with chart appearance.

## Purpose and anatomy

A native summary table for a [Chart](chart.md), available without hovering.
Each row has the series' numbered label and stroke sample, then one cell per
summary column. The visible caption names the metric and unit.

## Summary columns

`summary` lists the table's columns in order. The default is `min`, `max`,
`avg`, `current`. The other columns are `p50`, `p75`, `p90`, `p95` and `p99`.
An unknown column throws an error. The inline and sidebar legends show one
value per series and ignore `summary`.

Choose percentiles for latency, cost and other spiky measures, where one
outlier sets the max and moves the average: `["p50", "p75", "p95", "p99",
"current"]`. A percentile interpolates linearly between the two closest ranks
of the sorted measurements, so p50 of 0 and 10 is 5.

## Data and states

Accept the same `data` and `series` as the chart. Keep ordering and slots
identical. Min, max, average, and percentiles use finite measurements only. Current is the
measurement at the final timestamp. Missing statistics read "Not collected";
zero remains zero. An empty window retains the named series and headers.

`formatValue` controls all summary cells. Use one unit and precision across
the table. The chart's exact-values table preserves unrounded source data.
The legend alone is a summary, not a replacement for the full sample table.

## Labels

`labels` localizes the fixed text: `series` (the first column header),
`notCollected`, `current` (the current column and the inline and sidebar
caption) and one key per summary column, `min`, `max`, `avg`, `p50`, `p75`,
`p90`, `p95` and `p99`. Defaults are "Series", "Not collected", "Current",
"Min", "Max", "Avg" and the percentile names. The `label` prop is the caption.

## Accessibility and behavior

Use native table, caption, column headers, and row headers. Numeric cells align
to the end with tabular figures. By default rows are informational. With `onHighlightSeriesChange`, series
labels become buttons with pressed state from `highlightSeries`. Selection
emphasizes a series without hiding values. The table scrolls horizontally inside its frame at narrow
widths. Numbered labels, highlighting, and the exact sample table supplement color.

## Tokens and implementation

Text uses `--color-foreground` and `--color-muted-foreground`. Borders use
`--color-border`; spacing uses `--spacing-xs` and `--spacing-sm`. Series
swatches consume the same five semantic chart roles as Chart. There is no
Radix primitive; use a native table.

## Display forms

`variant="table"` is the default. `inline` wraps series labels and current
values into a short row. `sidebar` places them in a column beside the plot,
falling below it on narrow screens. Both use native description lists.
`activeTimestamp` selects the sidebar sample, otherwise it shows the last
sample. `formatTime` formats its timestamp. A missing measurement stays
"Not collected". Sidebar changes use a polite live region.

## Terminal

In a terminal, ChartLegend is part of `tui-kiso` `Chart`, set with
`ChartLegend::Table` (the default), `Inline` or `Hidden`. Each series
starts with a short `▄▄` bar in its chart color, its number in
`subtle-foreground` and its label in `foreground`.

- Table: column titles in `subtle-foreground`, "Series", then Min, Max,
  Avg and Current, numbers aligned right. A narrow area drops Min, then
  Max, then Avg. Current always stays.
- Inline: every series and its current value on one row, cut with `…`
  when it does not fit.
- A missing statistic is `—` in `muted-foreground`, the unknown value of
  [data-heavy interfaces](../data-interfaces.md), since "Not collected"
  does not fit a terminal column. Zero stays zero.
- The legend follows the chart's indent: two columns by default, none
  after `.indent(0)`.
- The summary columns are fixed, and the legend has no keys.

See [terminal interfaces](../terminal-interfaces.md).
