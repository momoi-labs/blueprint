---
"@momoi-labs/kiso": minor
---

Chart, ChartLegend, Sparkline, Meter and BarGauge gain a Terminal section.
It says how `tui-kiso` draws them: braille lines in the chart tokens with a
muted scale and a dotted grid, a legend as a table or one row, one block per
sample in a sparkline, and meter rows with a heavy track and the value at the
right edge. Missing samples break lines, blank cells or show a hatch, and
short areas keep the plot first.
