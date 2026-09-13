# Meter and Progress

## Purpose

Meter shows a measurement against a known limit, such as 64 connections out
of 100. Progress shows completion of work. A task's completion is not a meter.

## Anatomy and states

Both have a visible label, a value above a thin horizontal track. Meter takes
`value`, `min` (default 0), and `max` (default 100). Progress takes an optional
`value` and positive `max` (default 100). `valueText` supplies units or context.

Bounds must be finite and ordered. Clip the filled width and ARIA value to the
bounds, while retaining the original measurement in the visible value and
accessible value text. Do not hide an over-limit measurement by changing it
to the maximum. Compose a labelled Badge if that measurement is a warning.

A null or nonfinite Meter value reads "Not collected" with an unfilled hatch
track. It has no fabricated numeric ARIA state. An omitted, null, or nonfinite
Progress value means indeterminate work, reads "In progress", and has a static
hatch track. Zero is a known empty track; the maximum is a full track.

## Accessibility

Known measurements use `role="meter"` with name, minimum, maximum, current
value, and value text. Progress uses `role="progressbar"`; omit its current
value while indeterminate. Neither adds a tab stop or announces every update.
Keep the label and value visible for touch and assistive technology.
No information depends on animation or color.

## Tokens and implementation

The 6px track combines `--spacing-xs` and `--spacing-2xs`, with `--radius-xs`, and `--color-secondary`.
Meter fill uses `--color-secondary-foreground`; Progress uses `--color-chart-1`. Labels use `--type-size-label` and
`--color-foreground`. Unknown tracks use the existing hatch tokens. This
contract adds `.meter-track`; legacy `.progress` rules remain compatible.
