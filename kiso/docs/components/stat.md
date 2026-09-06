# Stat

## Purpose

Stat presents one named metric with an optional change and context. It supplies
the metric layout and typography. [Card](card.md) supplies the surrounding
surface and border when the metric needs a tile.

## Anatomy

```
Stat
├── StatHeader
│   ├── StatLabel (required)
│   └── StatDelta (optional)
├── StatValue (required)
└── StatFoot (optional)
```

StatHeader puts the label and delta on one line. StatValue includes the value
and any unit needed to read it. StatFoot explains the time window, baseline,
or supporting fact. StatDelta accepts content; the product supplies its sign,
arrow, number, and unit.

## Variants

Stat has no variants. StatDelta uses the same `variant` names as
[Badge](badge.md), with an outline badge treatment.

| StatDelta variant | Meaning | Color token |
| --- | --- | --- |
| `neutral` (default) | Change without a judgment of health. | `--color-foreground` |
| `info` | Informational change. | `--color-info` |
| `success` | A beneficial or healthy change. | `--color-success` |
| `warning` | A change needing attention. | `--color-warning` |
| `danger` | A harmful or failed condition. | `--color-danger` |

Direction does not determine severity. Lower latency can be `success`; fewer
successful requests can be `danger`. State the direction and comparison in
text so color is not the only explanation.

## Sizes

One size. Stat uses `--spacing-lg` padding and `--spacing-2xs` between slots.
The label and foot use `--type-size-label` and `--color-muted-foreground`.
The value uses `--type-size-display`, `--type-weight-semibold`,
`--type-line-height-tight`, `--type-letter-spacing-display`, and tabular
numerals. The foot has `--spacing-sm` above it. Delta uses
`--type-size-metadata`, `--type-weight-medium`, and `--spacing-xs` between
its content parts.

## States

The default is a readable metric. The product replaces unknown values with
[Skeleton](skeleton.md), describes unavailable data explicitly, and supplies
stale or error context. Do not display zero as a substitute for missing data.
Stat has no interactive or disabled state.

## Accessibility

The root and header are `div` elements; the text slots are `span` elements.
Keep the label, value, and comparison together in reading order. Include units
and time windows in text. Decorative arrows are hidden from assistive
technology. Stat does not create a live region; announce updates only when
the task needs them.

### Keyboard

No keymap. Any accompanying action uses its own Button or Link.

## When to use

- A dashboard metric with a label, value, and comparison period.
- A compact summary inside a Card or an existing section.

## When NOT to use

- Comparing many records across columns. Use [Table](table.md).
- A set of descriptive facts about one object. Use [KV](kv.md).
- A status without a metric. Use Badge.

## Radix/shadcn mapping

No dedicated Radix or shadcn Stat primitive. Compose metric text and Badge
visuals, with Card supplying an optional outer surface.
