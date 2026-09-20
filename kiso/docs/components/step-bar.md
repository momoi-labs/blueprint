# StepBar

## Purpose

StepBar summarises a run in one row: one segment per step, coloured by the
step's state. It answers "how far" and "where it stopped" at a glance, in the
places a [StepList](step-list.md) does not fit: a summary tab, a table cell,
a Toast. [Progress](meter.md) shows a continuous ratio; StepBar shows discrete
steps, so a failure is visible as a red segment in its place.

## Anatomy

```
StepBar (role="img", named)
└── segment (repeated, one per step)
```

The bar is the whole component. The product places the count ("4 of 11"),
the current step's label, or the last output line beside it in its own
markup; StepBar does not render text.

## States

Segments take the same five states as StepList: pending in
`--color-secondary`, running and done in `--color-success`, skipped hatched in
`--color-success`, failed in `--color-danger`. A running segment may show a
partial fill from `progress` (0 to 1); without it, running fills fully.

## Sizes

One height, `--spacing-xs`. Width comes from the container. In a table cell,
give the cell a fixed width and keep the bar to one line beside the Badge;
do not add the ticker there. Hide the bar when the machine is not running and
has not failed; the Badge alone says "Stopped".

## Accessibility

`role="img"` with a name that says the count and the current step, such as
"Create: step 4 of 11, running System packages" or
"Create: failed at step 4 of 11, System packages". The segments are
decorative. Nothing depends on colour alone.

## Tokens and implementation

Segments use `--radius-xs` and a `--spacing-2xs` gap. The hatch for a skipped
segment reuses the existing hatch tokens. No Radix primitive.

## When to use

- A machine's summary tab or card while an action runs or after it fails.
- A machines table, one line per row, next to the status Badge.
- A progress Toast for a run started from another screen.

## When NOT to use

- The run's own page. Use StepList there; the bar would repeat it.
- A continuous measurement. Use Meter or Progress.
