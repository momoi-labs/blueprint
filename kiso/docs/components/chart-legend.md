# ChartLegend

## Purpose and anatomy

A native summary table for a [Chart](chart.md), available without hovering.
Each row has the series' numbered label and stroke sample, then min, max,
arithmetic average, and current. The visible caption names the metric and unit.

## Data and states

Accept the same `data` and `series` as the chart. Keep ordering and slots
identical. Min, max, and average use finite measurements only. Current is the
measurement at the final timestamp. Missing statistics read "Not collected";
zero remains zero. An empty window retains the named series and headers.

`formatValue` controls all summary cells. Use one unit and precision across
the table. The chart's exact-values table preserves unrounded source data.
The legend alone is a summary, not a replacement for the full sample table.

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
