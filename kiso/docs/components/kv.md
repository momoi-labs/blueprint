# KV

## Purpose

KV presents named facts about one object, such as its region, image, and
restart policy. A description list expresses the relationship between each
term and its value without implying tabular records.

## Anatomy

```
KV (dl)
├── KVKey (dt)
├── KVValue (dd)
└── further key/value pairs
```

Keep keys and values as direct children, in reading order. Each key names the
fact described by the following value. Values can contain text, a
[Badge](badge.md), or a [Link](link.md).

## Variants

One description-list layout. No variant prop.

## Sizes

One size. The key column has a 96px minimum and grows with its content; the
value column takes remaining space with a zero minimum. Row and column gaps
use `--spacing-sm` and `--spacing-lg`. Keys use
`--color-muted-foreground` and `--type-size-label`; values use `--font-mono`
and `--type-size-label`. Long values wrap anywhere to stay within the column.

## States

Static facts have no hover, active, or disabled state. The product supplies
loading placeholders and explicit unknown or unavailable values. Keep the
key visible when a value is missing so the reader knows which fact is absent.

## Accessibility

Preserve native `dl`, `dt`, and `dd` semantics. Do not replace them with generic
containers or table roles just to align text. The list describes one object;
it has no column headers, row selection, or sorting. Name any controls within
a value according to their own contracts.

### Keyboard

No list keymap or tab stop. Links and controls inside values remain in normal
tab order.

## When to use

- Fixed facts in a resource detail pane.
- Configuration summaries that the reader scans by name.

## When NOT to use

- Repeated records with the same fields across columns. Use [Table](table.md).
- Editable settings. Compose [FormField](form-field.md) and controls.
- One prominent metric and its trend. Use [Stat](stat.md).

## Radix/shadcn mapping

No dedicated primitive. Use native HTML description-list semantics with Kiso's
layout and typography. A two-column shadcn Table is not a substitute for a
list of facts about one object.
