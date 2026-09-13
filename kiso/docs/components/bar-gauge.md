# BarGauge

## Purpose and anatomy

Compare labelled measurements on horizontal bars with a value column.
Each row composes [Meter](meter.md). All rows share a positive finite `max`
and start at zero. Give the group a descriptive `label`, including its unit.
Use [Chart](chart.md) when the task requires history.

## Data, states, and behavior

Rows have a stable key, label, and numeric or null value. `formatValue` applies
the same unit and precision to every known value. Preserve row order across
refreshes so a reader can compare changes. Bars clip at their bounds while
text retains the actual number. A missing row value reads "Not collected";
zero draws an empty track. An empty group reads "No measurements."

## Accessibility

The group has an accessible name; each measured row has Meter semantics and
its own name and value text. Labels and numbers remain visible. There is no
hover requirement, animation, or keyboard interaction. Wrap long labels and
keep values aligned. Color does not encode the identity of a row.

## Tokens and implementation

Use Meter's track and fill tokens, `--spacing-md` between rows, and
`--spacing-sm` within each row. No separate charting or Radix primitive is
required. The old `.bars` vertical mini-bars are unrelated and stay compatible.
